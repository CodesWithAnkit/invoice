import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Guards the print/PDF pipeline's "everything fits on one A4 page" contract
// (see src/styles/invoice-print.css — `.invoice-print-page { zoom: 0.85 }`,
// and context/ui_context.md's "Maximum Item Rule": up to 15 line items on a
// single page). Row height here does NOT grow with description length (the
// description cell doesn't wrap), so the real overflow driver is item COUNT
// — this test therefore fills the app's own enforced maximum (15 items,
// "+ Add Item" disables past that) plus full business/customer/bank details
// AND a drawn signature, and asserts the generated PDF has exactly one page.
// Run for both templates (Classic/Modern) and the two document types with
// the most footer content (Invoice, Proforma — the latter adds a
// payment-terms table and a delivery/installation block).
//
// The signature is not optional filler: Classic's Proforma footer bottom-
// aligns its "Thank you" / signature row, so a real signature image (which
// most users will actually add) makes that row much taller than the
// no-signature placeholder — this is what caused a real 2-page regression
// that a signature-less test missed. See Classic.tsx's `isProforma` footer
// branch and its `zoom: 0.78` override for the fix.

const ITEM_COUNT = 15;

async function drawSignature(page: import('@playwright/test').Page) {
  const canvas = page.locator('.sigCanvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + 20, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 20);
  await page.mouse.move(box.x + 200, box.y + 90);
  await page.mouse.move(box.x + 260, box.y + 40);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Save Signature' }).click();
}

async function fillRealisticInvoice(page: import('@playwright/test').Page) {
  await page.getByLabel('Business Name').fill('Shanvi Machinery');
  await page.getByLabel('Phone').fill('7677614547');
  await page.getByLabel('GSTIN').fill('10FIUPS1815LIZU');
  await page
    .getByLabel('Business Address')
    .fill('New Magadh Colony, Ward No 23, Bihar Sarif, Nalanda, Bihar, 803101');

  await page.getByLabel('Company Name').fill('Maa Laxmi Namkeen Udhyog');
  await page.getByLabel('Customer Name').fill('Taniya Gupta');
  await page.getByLabel('Mobile').fill('9006503660');
  // Touch Aadhaar (even blank) so `customer.fields.aadhaar` exists in state —
  // matches real edited invoices, which always populate this key.
  await page.getByLabel('Aadhaar').fill('');
  await page
    .getByLabel('Customer Address')
    .fill('Pakki Talab, Sogra Collage, Dargah Road, Biharsharif, Nalanda, Bihar, 803101');

  await page.getByLabel('Bank Name').fill('State Bank of India');
  await page.getByLabel('Account Name').fill('Shanvi Machinery');
  await page.getByLabel('Account Number').fill('41409826619');
  await page.getByLabel('IFSC Code').fill('SBIN0003063');

  const items = [
    ['Automatic Namkeen Packing Machine', '800000'],
    ['Frying System', '600000'],
    ['Sev Making Machine', '550000'],
    ['Namkeen/Boondi Making Machine', '450000'],
    ['Weighing & Sealing System', '300000'],
    ['Masala Mixing Machine', '250000'],
    ['Conveyor & Material Handling', '230000'],
    ['Dough/Flour Mixer', '210000'],
    ['Potato/Raw Material Processing', '200000'],
    ['Oil Filtration System', '200000'],
    ['Electrical/Control Panel', '200000'],
    ['Installation & Commissioning', '150000'],
    ['SS Tables/Bins & Accessories', '100000'],
    ['Spare Parts Kit', '90000'],
    ['Annual Maintenance Contract', '80000'],
  ];

  for (let i = 0; i < ITEM_COUNT; i++) {
    if (i > 0) {
      await page.getByRole('button', { name: /Add Item/ }).click();
    }
    const [description, price] = items[i];
    await page
      .getByPlaceholder('Item description')
      .filter({ visible: true })
      .nth(i)
      .fill(description);
    await page.getByPlaceholder('Qty').filter({ visible: true }).nth(i).fill('1');
    await page.getByPlaceholder('Price').filter({ visible: true }).nth(i).fill(price);
  }

  await drawSignature(page);
}

async function countPdfPages(buffer: Buffer): Promise<number> {
  const pdfParse = (await import('pdf-parse-new')).default;
  const data = await pdfParse(buffer);
  return data.numpages;
}

for (const template of ['modern', 'classic'] as const) {
  for (const docType of ['invoice', 'proforma'] as const) {
    test(`exported PDF is a single A4 page — ${template} template, ${docType} type`, async ({ page }, testInfo) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Invoice Editor' }).first()).toBeVisible();

      // Select template
      await page.getByRole('button', { name: new RegExp(`^${template}$`, 'i') }).click();

      // Select document type
      await page.locator('#type').selectOption(docType);

      await fillRealisticInvoice(page);

      // Let totals/derived state (amount-in-words, GST split, etc.) settle.
      await page.waitForTimeout(300);

      const pdfPath = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-pdf-')),
        `${template}-${docType}.pdf`
      );

      await page.emulateMedia({ media: 'print' });
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });

      const buffer = fs.readFileSync(pdfPath);
      const pageCount = await countPdfPages(buffer);

      await testInfo.attach(`${template}-${docType}.pdf`, { path: pdfPath, contentType: 'application/pdf' });

      expect(pageCount, `${template}/${docType} invoice PDF should fit on a single page`).toBe(1);
    });
  }
}

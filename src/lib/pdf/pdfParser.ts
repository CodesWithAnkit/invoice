"use server";

import { PdfReader } from "pdfreader";

/**
 * Parses an invoice PDF to extract key fields using pdfreader on the server.
 * @param formData The FormData containing the PDF file.
 * @returns A partial InvoiceData object with extracted meta, items, and totals.
 */
export async function parseInvoicePDF(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const rows: { [key: number]: any[] } = {};

    await new Promise((resolve, reject) => {
      // PdfReader expects a Buffer or a string path
      new PdfReader().parseBuffer(Buffer.from(arrayBuffer), (err: any, item: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (!item) {
          resolve(true);
          return;
        }
        if (item.text) {
          const y = Math.round(item.y);
          if (!rows[y]) rows[y] = [];
          rows[y].push({
            text: item.text,
            x: item.x,
          });
        }
      });
    });

    // Convert rows to ordered lines
    const lines = Object.values(rows).map((row) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((cell) => cell.text)
        .join(" ")
    );

    const items: any[] = [];
    // The user's requested regex
    const itemRegex = /(.+?)\s+(\d{1,2})\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/;

    lines.forEach((line) => {
      const match = line.match(itemRegex);
      if (match) {
        items.push({
          id: Math.random().toString(36).substring(2, 9), // crypto.randomUUID() might not be available in all Node versions, using simple ID
          description: match[1].trim(),
          quantity: parseInt(match[2]),
          unitPrice: parseFloat(match[3].replace(/,/g, "")),
          total: parseFloat(match[4].replace(/,/g, "")),
        });
      }
    });

    if (items.length === 0) {
      // We'll log the full text to see why extraction failed if needed
      console.log("Full reconstructed text:", lines.join("\n"));
      throw new Error("Invoice table could not be detected");
    }

    // Temporarily log parsed items
    console.table(items);

    // Extract invoice metadata
    const fullText = lines.join(" ");
    
    const invMatch = fullText.match(/Bill No:\s*#?(\d+)/i);
    const invoiceNumber = invMatch ? invMatch[1] : "";

    const dateMatch = fullText.match(/Date:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const date = dateMatch ? dateMatch[1] : "";

    const parseCurrency = (val: string) => (val ? parseFloat(val.replace(/,/g, "")) : 0);

    const subTotalMatch = fullText.match(/Sub Total\s*([\d,.]+)/i);
    const subTotal = subTotalMatch ? parseCurrency(subTotalMatch[1]) : 0;

    const sgstMatch = fullText.match(/SGST.*?([\d,.]+)/i);
    const sgst = sgstMatch ? parseCurrency(sgstMatch[1]) : 0;

    const cgstMatch = fullText.match(/CGST.*?([\d,.]+)/i);
    const cgst = cgstMatch ? parseCurrency(cgstMatch[1]) : 0;

    const grandTotalMatch = fullText.match(/Grand Total\s*([\d,.]+)/i);
    const grandTotal = grandTotalMatch ? parseCurrency(grandTotalMatch[1]) : 0;

    return {
      meta: { invoiceNumber, date },
      items,
      totals: { subTotal, sgst, cgst, grandTotal },
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to parse PDF. Please ensure it's a valid invoice PDF.");
  }
}

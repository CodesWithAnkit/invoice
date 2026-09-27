/**
 * Phase 6 – Quotation: frontend E2E (desktop + mobile).
 *
 * E2E-002 (customer → project → estimate → quotation → send, all in the UI),
 * AC-PREVIEW-001 preview completeness, E2E-003 / AC-PDF-003 one-page PDF whose
 * total equals the API total at the R-15a caps, revise / duplicate / archive,
 * the quotations list, and axe.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";
import { createUser, signInViaUi } from "./utils/auth";

const ISO = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const long = (base: string, length: number) => (base + " " + "x".repeat(length)).slice(0, length);

async function shot(page: Page, testInfo: TestInfo, step: string) {
  const device = testInfo.project.name.toLowerCase().replace(/\s+/g, "-");
  await page.screenshot({ path: `screenshots/quotations/${device}-${step}.png`, fullPage: true });
}

async function countPdfPages(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse-new")).default;
  const data = await pdfParse(buffer);
  return { pages: data.numpages as number, text: data.text as string };
}

/** A draft filled to every R-15a cap with maximum-length text (the worst case for one page). */
function maxedDraft() {
  return {
    title: long("Complete website and brand platform rebuild", 100),
    issue_date: ISO(0),
    valid_until: ISO(30),
    discount_type: "percent",
    discount_value_minor: 0,
    discount_bp: 1000,
    tax_name: "GST",
    tax_rate_bp: 1800,
    notes: long("Prices exclude third-party licences and hosting.", 500),
    internal_notes: "",
    terms: Array.from({ length: 5 }, (_, i) => long(`Term ${i + 1}: payment and delivery conditions apply`, 160)),
    items: Array.from({ length: 10 }, (_, i) => ({
      name: long(`Line item ${i + 1} with a deliberately long descriptive name`, 80),
      description: long(`Detailed description for item ${i + 1} covering what is delivered`, 160),
      pricing_model: i === 9 ? "percentage" : i % 2 ? "hourly" : "fixed",
      quantity: i % 2 ? 12.5 : 1,
      unit: i % 2 ? "hour" : "",
      rate_minor: 123_456_789,
      percent_bp: i === 9 ? 1000 : 0,
    })),
    scope: {
      overview: long("We will rebuild the marketing site, CMS and analytics stack.", 500),
      deliverables: Array.from({ length: 5 }, (_, i) => long(`Deliverable ${i + 1} described at full length`, 120)),
      included: Array.from({ length: 5 }, (_, i) => long(`Included ${i + 1} described at full length`, 120)),
      excluded: Array.from({ length: 5 }, (_, i) => long(`Excluded ${i + 1} described at full length`, 120)),
      assumptions: Array.from({ length: 5 }, (_, i) => long(`Assumption ${i + 1} described at full length`, 120)),
      revision_policy: long("Two rounds of revisions per milestone are included.", 300),
    },
    milestones: Array.from({ length: 5 }, (_, i) => ({
      name: long(`Milestone ${i + 1} with a long name`, 60),
      description: long(`What happens during milestone ${i + 1}`, 120),
      start_label: long(`Week ${i * 2 + 1} start label`, 30),
      end_label: long(`Week ${i * 2 + 2} end label`, 30),
    })),
  };
}

/** A complete, realistic quotation: every section filled at sensible length. Must fit one page. */
function realisticDraft() {
  const services = [
    ["Discovery workshop", "Stakeholder interviews and requirements", "fixed", 1, 7_500_000],
    ["UX and visual design", "Wireframes and UI for 12 page templates", "fixed", 1, 18_000_000],
    ["Frontend development", "Responsive build, Next.js", "hourly", 120, 250_000],
    ["CMS integration", "Headless CMS with editor roles", "fixed", 1, 9_000_000],
    ["Content migration", "Move existing pages and media", "daily", 4, 1_200_000],
    ["Analytics setup", "GA4, consent banner and dashboards", "fixed", 1, 3_500_000],
    ["SEO foundations", "Metadata, sitemap, redirects", "fixed", 1, 2_500_000],
    ["QA and accessibility", "Cross-browser and WCAG 2.1 AA checks", "hourly", 40, 180_000],
    ["Launch support", "Go-live and two weeks of fixes", "daily", 3, 1_000_000],
  ] as const;
  return {
    title: "Marketing website rebuild",
    issue_date: ISO(0),
    valid_until: ISO(30),
    discount_type: "percent",
    discount_value_minor: 0,
    discount_bp: 500,
    tax_name: "GST",
    tax_rate_bp: 1800,
    notes: "Prices exclude third-party licences and hosting fees, which are billed at cost.",
    internal_notes: "Margin is thin",
    terms: [
      "50% advance on acceptance, balance on launch.",
      "Invoices are payable within 15 days.",
      "Timeline starts once the advance and brand assets are received.",
    ],
    items: [
      ...services.map(([name, description, pricing_model, quantity, rate_minor]) => ({
        name,
        description,
        pricing_model,
        quantity,
        unit: pricing_model === "hourly" ? "hour" : pricing_model === "daily" ? "day" : "",
        rate_minor,
        percent_bp: 0,
      })),
      { name: "Project management", description: "", pricing_model: "percentage", quantity: 1, rate_minor: 0, percent_bp: 1000 },
    ],
    scope: {
      overview:
        "We will rebuild the marketing website on a headless CMS so the team can publish without developer help, improve performance and accessibility, and set up analytics to measure campaigns.",
      deliverables: ["Responsive website with 12 page templates", "Headless CMS with editor roles", "Analytics dashboards"],
      included: ["Two revision rounds per milestone", "Training session for editors", "Two weeks of post-launch fixes"],
      excluded: ["Copywriting and photography", "Hosting and domain costs", "Paid advertising setup"],
      assumptions: ["Brand guidelines are provided", "Feedback within 3 working days", "One consolidated set of comments"],
      revision_policy: "Two rounds of revisions per milestone are included; further changes are billed hourly.",
    },
    milestones: [
      { name: "Discovery", description: "Workshops and sitemap", start_label: "Week 1", end_label: "Week 2" },
      { name: "Design", description: "Wireframes and UI", start_label: "Week 3", end_label: "Week 5" },
      { name: "Build", description: "Development and CMS", start_label: "Week 6", end_label: "Week 10" },
      { name: "Launch", description: "QA, go-live, support", start_label: "Week 11", end_label: "Week 12" },
    ],
  };
}

async function setupBusiness(request: APIRequestContext) {
  const res = await request.patch("/api/business", {
    data: {
      name: "Northwind Digital Studio Private Limited",
      address: "Unit 402, Fourth Floor, Tower B, Cyber Greens, DLF Phase 3, Gurugram, Haryana 122002",
      phone: "+91 98100 00000",
      email: "hello@northwind.example",
      website: "https://northwind.example",
      tax_id: "06ABCDE1234F1Z5",
      default_tax_name: "GST",
      default_tax_rate_bp: 1800,
    },
  });
  expect(res.status()).toBe(200);
}

async function newProjectApi(request: APIRequestContext, name: string) {
  const customer = await request.post("/api/customers", {
    data: {
      name: `${name} client`,
      company_name: "Maa Laxmi Enterprises Private Limited",
      email: "accounts@client.example",
      phone: "+91 90065 03660",
      address: "Pakki Talab, Sogra College Road, Dargah Road, Biharsharif, Nalanda, Bihar 803101",
    },
  });
  const project = await request.post("/api/projects", {
    data: { name, customer_id: (await customer.json()).data.id, description: "Marketing site, CMS and analytics." },
  });
  return (await project.json()).data.id as string;
}

async function sentQuotation(request: APIRequestContext, name: string, body: Record<string, unknown> = realisticDraft()) {
  const projectId = await newProjectApi(request, name);
  const id = (await (await request.post("/api/quotations", { data: { project_id: projectId } })).json()).data.id;
  const saved = await request.patch(`/api/quotations/${id}`, { data: body });
  expect(saved.status()).toBe(200);
  const sent = await request.post(`/api/quotations/${id}/send`);
  expect(sent.status()).toBe(200);
  const q = (await (await request.get(`/api/quotations/${id}`)).json()).data;
  return { id, projectId, q };
}

test.describe("Quotation lifecycle UI", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  let user: Awaited<ReturnType<typeof createUser>>;

  test.beforeAll(async () => {
    user = await createUser("quote-lifecycle-ui");
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await signInViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard\/overview/);
    await setupBusiness(page.request);
  });

  test("E2E-002: customer → project → estimate → quotation → send, all in the UI", async ({ page }, testInfo) => {
    const suffix = Math.random().toString(36).slice(2, 7);
    const customer = `E2E Customer ${suffix}`;
    const project = `E2E Project ${suffix}`;

    await page.goto("/dashboard/customers");
    await page.getByRole("button", { name: "New Customer" }).click();
    await page.getByLabel("Name *").fill(customer);
    await page.getByLabel("Email").fill("e2e@client.example");
    await page.getByRole("button", { name: "Save Customer" }).click();
    await expect(page.getByText(customer).first()).toBeVisible();

    await page.goto("/dashboard/projects");
    await page.getByRole("button", { name: "New Project" }).first().click();
    await page.getByLabel("Project Name *").fill(project);
    await expect(page.getByLabel("Customer *").locator("option", { hasText: customer })).toHaveCount(1);
    await page.getByLabel("Customer *").selectOption({ label: customer });
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.getByRole("link", { name: project }).first().click();
    await expect(page.getByRole("heading", { name: project })).toBeVisible();

    await page.getByRole("button", { name: "Create quotation" }).click();
    await expect(page.getByRole("heading", { name: "Estimate builder" })).toBeVisible();
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Item 1 name").fill("Website development");
    await page.getByLabel("Item 1 rate").fill("100000");
    await page.getByLabel("Discount type").selectOption("fixed");
    await page.getByLabel("Discount amount").fill("10000");
    await page.getByLabel("Tax rate").fill("18");
    await expect(page.getByTestId("summary-total")).toHaveText("₹1,06,200.00");
    await expect(page.getByTestId("save-status")).toHaveText("All changes saved", { timeout: 10_000 });

    await page.getByRole("link", { name: "Preview & send" }).click();
    await expect(page.getByRole("heading", { name: "Draft quotation" })).toBeVisible();
    await expect(page.getByTestId("doc-quote-number")).toHaveText("Draft");
    await expect(page.getByTestId("doc-total")).toHaveText("₹1,06,200.00");
    await shot(page, testInfo, "p6-step1_draft_preview");

    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Send quotation" }).click();
    const number = new RegExp(`QT-${new Date().getFullYear()}-\\d{3}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(number);
    await expect(page.getByTestId("doc-quote-number")).toHaveText(number);
    await expect(page.getByRole("textbox", { name: "Client link" })).toHaveValue(/\/public\/quote\/[A-Za-z0-9_-]{32}$/);
    await expect(page.getByText("Sent", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await shot(page, testInfo, "p6-step2_sent");

    const quoteNumber = (await page.getByRole("heading", { level: 1 }).textContent())!;
    await page.goto("/dashboard/quotations");
    await page.getByLabel("Search quotations").fill(quoteNumber);
    await expect(page.getByRole("link", { name: new RegExp(quoteNumber) })).toBeVisible();
    await expect(page.getByText("₹1,06,200.00")).toBeVisible();
    await shot(page, testInfo, "p6-step3_list");
  });

  test("AC-PREVIEW-001: the preview shows every section, from the frozen snapshot", async ({ page }, testInfo) => {
    const { id, q } = await sentQuotation(page.request, "Preview sections");
    await page.goto(`/dashboard/quotations/${id}`);
    const doc = page.getByTestId("quotation-document");

    for (const text of [
      "Northwind Digital Studio Private Limited", // business
      "Maa Laxmi Enterprises Private Limited", // customer
      q.quote_number,
      "Valid until",
      "Preview sections", // project
      "Discovery workshop",
      "Subtotal",
      "Discount (5%)",
      "GST 18%",
      "Scope of work",
      "Deliverables",
      "Not included",
      "Assumptions",
      "Timeline",
      "Launch",
      "Terms",
      "Notes",
    ]) {
      await expect(doc.getByText(text, { exact: false }).first(), text).toBeVisible();
    }
    // AC-PREVIEW-002: the preview shows the stored total, never its own.
    await expect(page.getByTestId("doc-total")).toHaveText(
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(q.total_minor / 100)
    );
    // Internal notes stay out of the client document.
    await expect(doc.getByText("Margin")).toHaveCount(0);
    await expect(page.getByText("Showing the version sent on")).toBeVisible();
    await shot(page, testInfo, "p6-step4_preview");
  });

  test("E2E-003 / AC-PDF-003: a complete quotation prints as one A4 page and its total equals the API total", async ({ page }, testInfo) => {
    const { id, q } = await sentQuotation(page.request, "PDF guard");
    await page.goto(`/dashboard/quotations/${id}`);
    await expect(page.getByTestId("quotation-document")).toBeVisible();

    await page.emulateMedia({ media: "print" });
    // The page must fit on paper: nothing may overflow the document sideways either.
    const overflowX = await page.evaluate(() => {
      const doc = document.querySelector('[data-testid="quotation-document"]') as HTMLElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflowX).toBeLessThanOrEqual(0);
    await shot(page, testInfo, "p6-print_view");
    const pdfPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "quotation-pdf-")), `${q.quote_number}.pdf`);
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    await testInfo.attach("quotation.pdf", { path: pdfPath, contentType: "application/pdf" });

    const { pages, text } = await countPdfPages(fs.readFileSync(pdfPath));
    expect(pages).toBe(1);
    const total = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(q.total_minor / 100);
    expect(text.replace(/\s+/g, "")).toContain(total.replace(/\s+/g, ""));
    expect(text).toContain(q.quote_number);
    // Owner UI never reaches the PDF.
    expect(text).not.toContain("Activity");
    expect(text).not.toContain("Client link");
  });

  test("R-15a: a draft that doesn't fit one page is flagged and can't be sent", async ({ page }, testInfo) => {
    const projectId = await newProjectApi(page.request, "Too long");
    const id = (await (await page.request.post("/api/quotations", { data: { project_id: projectId } })).json()).data.id;
    expect((await page.request.patch(`/api/quotations/${id}`, { data: maxedDraft() })).status()).toBe(200);

    await page.goto(`/dashboard/quotations/${id}/edit`);
    await expect(page.getByTestId("one-page-status")).toHaveText("Too long for one page");
    await expect(page.getByText("A quotation must fit on one page before it can be sent.")).toBeVisible();
    await shot(page, testInfo, "p6-too_long_builder");

    await page.goto(`/dashboard/quotations/${id}`);
    await expect(page.getByTestId("too-long-notice")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send", exact: true })).toBeDisabled();

    // A realistic draft is fine.
    const okId = (await (await page.request.post("/api/quotations", { data: { project_id: projectId } })).json()).data.id;
    await page.request.patch(`/api/quotations/${okId}`, { data: realisticDraft() });
    await page.goto(`/dashboard/quotations/${okId}/edit`);
    await expect(page.getByTestId("one-page-status")).toHaveText("Fits on one page");
    await page.goto(`/dashboard/quotations/${okId}`);
    await expect(page.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
    await expect(page.getByTestId("too-long-notice")).toHaveCount(0);
  });

  test("revise, duplicate and archive from the detail page (R-11)", async ({ page }, testInfo) => {
    const { id, q } = await sentQuotation(page.request, "Actions", {
      ...realisticDraft(),
      title: maxedDraft().title, // 100 chars: "(copy)" must still fit
    });
    await page.goto(`/dashboard/quotations/${id}`);

    await page.getByRole("button", { name: "Revise" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Revise" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/quotations/${id}/edit$`));
    await expect(page.getByRole("heading", { name: "Estimate builder" })).toBeVisible();

    await page.getByRole("link", { name: "Preview & send" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(q.quote_number);
    await expect(page.getByText("Version 2").first()).toBeVisible();
    await expect(page.getByText("Revision started")).toBeVisible();

    await page.getByRole("button", { name: "Duplicate" }).click();
    await expect(page).toHaveURL(/\/dashboard\/quotations\/[0-9a-f-]{36}\/edit$/);
    expect(page.url()).not.toContain(id);
    await expect(page.getByLabel("Title")).toHaveValue(/\(copy\)$/);

    await page.goto(`/dashboard/quotations/${id}`);
    await page.getByRole("button", { name: "Archive" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Send", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Archive" })).toHaveCount(0);
    await shot(page, testInfo, "p6-step5_archived");

    // Non-drafts can't be opened in the builder.
    await page.goto(`/dashboard/quotations/${id}/edit`);
    await expect(page).toHaveURL(new RegExp(`/dashboard/quotations/${id}$`));
  });

  test("send shows what's missing when the draft isn't ready (AC-QUOTE-002)", async ({ page }) => {
    const projectId = await newProjectApi(page.request, "Not ready");
    const id = (await (await page.request.post("/api/quotations", { data: { project_id: projectId } })).json()).data.id;
    await page.goto(`/dashboard/quotations/${id}`);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Send quotation" }).click();
    await expect(page.getByText("Add at least one line item.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Draft quotation" })).toBeVisible();
  });

  test("quotations list: empty filter state and status filter", async ({ page }) => {
    await page.goto("/dashboard/quotations");
    await expect(page.getByRole("heading", { name: "Quotations" })).toBeVisible();
    await page.getByLabel("Search quotations").fill("no-such-quotation-zzz");
    await expect(page.getByText("No matching quotations")).toBeVisible();
    await page.getByLabel("Search quotations").fill("");
    await page.getByLabel("Filter by status").selectOption("Archived");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("detail and list pages are accessible and don't scroll sideways", async ({ page }) => {
    const { id } = await sentQuotation(page.request, "A11y");
    for (const url of [`/dashboard/quotations/${id}`, "/dashboard/quotations"]) {
      await page.goto(url);
      await expect(page.locator("main")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include("main")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations, url).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, url).toBeLessThanOrEqual(0);
    }
  });
});

/**
 * Phase 5 – Estimate builder: frontend E2E (desktop + mobile).
 *
 * Project page → "Create quotation" → builder: line items for every pricing
 * model, catalog pick, discount/tax, live totals matching the server,
 * validation, auto-save + reload, scope/timeline, one-page caps, axe.
 */
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createUser, signInViaUi } from "./utils/auth";

const SAVED = "All changes saved";

async function newProject(page: Page, name: string) {
  const customer = await page.request.post("/api/customers", { data: { name: `${name} client` } });
  expect(customer.status()).toBe(200);
  const project = await page.request.post("/api/projects", {
    data: { name, customer_id: (await customer.json()).data.id },
  });
  expect(project.status()).toBe(200);
  return (await project.json()).data.id as string;
}

/** Opens the project and creates a quotation through the UI; returns the quotation id. */
async function openBuilder(page: Page, projectName: string) {
  const projectId = await newProject(page, projectName);
  await page.goto(`/dashboard/projects/${projectId}`);
  await expect(page.getByText("No quotations yet. Create one to start estimating.")).toBeVisible();
  await page.getByRole("button", { name: "Create quotation" }).click();
  await expect(page).toHaveURL(/\/dashboard\/quotations\/[0-9a-f-]{36}\/edit$/);
  await expect(page.getByRole("heading", { name: "Estimate builder" })).toBeVisible();
  const id = page.url().split("/").at(-2)!;
  return { id, projectId };
}

/** Step screenshots of the flow, one set per device (like customers.spec.ts). */
async function shot(page: Page, testInfo: TestInfo, step: string) {
  const device = testInfo.project.name.toLowerCase().replace(/\s+/g, "-");
  await page.screenshot({ path: `screenshots/quotations/${device}-${step}.png`, fullPage: true });
}

async function waitSaved(page: Page) {
  await expect(page.getByTestId("save-status")).toHaveText(SAVED, { timeout: 10_000 });
}

async function apiQuotation(page: Page, id: string) {
  const res = await page.request.get(`/api/quotations/${id}`);
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

test.describe("Estimate builder", () => {
  // Own tenant per worker: the shared E2E user's settings (e.g. currency) are
  // changed by other suites running in parallel.
  test.use({ storageState: { cookies: [], origins: [] } });
  let user: Awaited<ReturnType<typeof createUser>>;

  test.beforeAll(async () => {
    user = await createUser("quote-ui");
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await signInViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard\/overview/);
  });

  test("AC-CALC-003 flow: build, auto-save, reload — builder total equals the server total", async ({ page }, testInfo) => {
    const { id, projectId } = await openBuilder(page, "Builder calc");

    await expect(page.getByText("No line items yet.")).toBeVisible();
    await shot(page, testInfo, "step1_empty_builder");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Item 1 name").fill("Website development");
    await page.getByLabel("Item 1 rate").fill("1,00,000");
    await expect(page.getByTestId("line-amount").first()).toHaveText("₹1,00,000.00");

    await page.getByLabel("Discount type").selectOption("fixed");
    await page.getByLabel("Discount amount").fill("10000");
    await page.getByLabel("Tax name").fill("GST");
    await page.getByLabel("Tax rate").fill("18");

    await expect(page.getByTestId("summary-subtotal")).toHaveText("₹1,00,000.00");
    await expect(page.getByTestId("summary-discount")).toHaveText("−₹10,000.00");
    await expect(page.getByTestId("summary-taxable")).toHaveText("₹90,000.00");
    await expect(page.getByTestId("summary-tax")).toHaveText("₹16,200.00");
    await expect(page.getByTestId("summary-total")).toHaveText("₹1,06,200.00");
    await waitSaved(page);
    await shot(page, testInfo, "step2_items_discount_tax_saved");

    const saved = await apiQuotation(page, id);
    expect(saved.total_minor).toBe(10_620_000);

    await page.reload();
    await expect(page.getByLabel("Item 1 name")).toHaveValue("Website development");
    await expect(page.getByLabel("Discount amount")).toHaveValue("10000");
    await expect(page.getByTestId("summary-total")).toHaveText("₹1,06,200.00");
    await expect(page.getByTestId("save-status")).toHaveText(SAVED);
    await shot(page, testInfo, "step3_after_reload");

    // The project page lists the draft with the same total and links back.
    await page.goto(`/dashboard/projects/${projectId}`);
    await expect(page.getByText("₹1,06,200.00")).toBeVisible();
    await expect(page.getByText("Estimating").first()).toBeVisible();
    await shot(page, testInfo, "step4_project_with_quotation");
    await page.getByRole("link", { name: "Builder calc", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/quotations/${id}/edit$`));
  });

  test("hourly, daily, quantity and percentage pricing; reorder and remove", async ({ page }) => {
    const { id } = await openBuilder(page, "Builder models");
    await page.getByLabel("Tax rate").fill("0");

    const add = page.getByRole("button", { name: "Add item" });
    await add.click();
    await page.getByLabel("Item 1 name").fill("Dev hours");
    await page.getByLabel("Item 1 pricing").selectOption("hourly");
    await page.getByLabel("Item 1 hours").fill("40");
    await page.getByLabel("Item 1 rate").fill("2000");

    await add.click();
    await page.getByLabel("Item 2 name").fill("Support");
    await page.getByLabel("Item 2 pricing").selectOption("daily");
    await page.getByLabel("Item 2 days").fill("0.5");
    await page.getByLabel("Item 2 rate").fill("8000");

    await add.click();
    await page.getByLabel("Item 3 name").fill("Pages");
    await page.getByLabel("Item 3 pricing").selectOption("quantity");
    await page.getByLabel("Item 3 quantity").fill("8");
    await page.getByLabel("Item 3 rate").fill("5000");

    await add.click();
    await page.getByLabel("Item 4 name").fill("Project management");
    await page.getByLabel("Item 4 pricing").selectOption("percentage");
    await page.getByLabel("Item 4 percentage").fill("10");

    const amounts = page.getByTestId("line-amount");
    await expect(amounts).toHaveText(["₹80,000.00", "₹4,000.00", "₹40,000.00", "₹12,400.00"]);
    await expect(page.getByTestId("summary-total")).toHaveText("₹1,36,400.00");

    await page.getByRole("button", { name: "Move item 3 up" }).click();
    await expect(page.getByLabel("Item 2 name")).toHaveValue("Pages");
    await page.getByRole("button", { name: "Remove item 1" }).click();
    await expect(page.getByTestId("estimate-line-item")).toHaveCount(3);
    // Base is now 40,000 + 4,000 → PM 10% = 4,400.
    await expect(amounts).toHaveText(["₹40,000.00", "₹4,000.00", "₹4,400.00"]);
    await waitSaved(page);

    const saved = await apiQuotation(page, id);
    expect(saved.items.map((i: { name: string }) => i.name)).toEqual(["Pages", "Support", "Project management"]);
    expect(saved.total_minor).toBe(4_840_000);
  });

  test("selecting a catalog service fills the line from its defaults (AC-ESTIMATE-002)", async ({ page }) => {
    const name = `Design sprint ${Date.now()}`;
    const product = await page.request.post("/api/products", {
      data: { name, kind: "service", pricing_model: "daily", unit: "day", default_rate_minor: 750_000 },
    });
    expect(product.status()).toBe(200);

    const { id } = await openBuilder(page, "Builder catalog");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Catalog item 1").selectOption({ label: name });
    await expect(page.getByLabel("Item 1 name")).toHaveValue(name);
    await expect(page.getByLabel("Item 1 pricing")).toHaveValue("daily");
    await expect(page.getByLabel("Item 1 rate")).toHaveValue("7500");
    await expect(page.getByLabel("Item 1 unit")).toHaveValue("day");
    await page.getByLabel("Item 1 days").fill("2");
    await expect(page.getByTestId("line-amount").first()).toHaveText("₹15,000.00");
    await waitSaved(page);
    expect((await apiQuotation(page, id)).items[0].service_id).toBe((await product.json()).data.id);
  });

  test("invalid values show field errors and are not saved (AC-CALC-005)", async ({ page }, testInfo) => {
    const { id } = await openBuilder(page, "Builder invalid");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Item 1 rate").fill("500");
    await waitSaved(page);

    await page.getByLabel("Item 1 rate").fill("-5");
    await expect(page.getByText("Use a non-negative amount with up to 2 decimals")).toBeVisible();
    await expect(page.getByLabel("Item 1 rate")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("save-status")).toHaveText("Fix the highlighted fields to save");

    await page.getByLabel("Item 1 rate").fill("500");
    await page.getByLabel("Item 1 quantity").fill("0");
    await expect(page.getByText("Quantity must be greater than 0")).toBeVisible();

    await page.getByLabel("Item 1 quantity").fill("1");
    await page.getByLabel("Discount type").selectOption("fixed");
    await page.getByLabel("Discount amount").fill("501");
    await expect(page.getByText("Discount cannot exceed the subtotal.")).toBeVisible();
    await shot(page, testInfo, "step5_validation_errors");

    await page.getByLabel("Discount type").selectOption("percent");
    await page.getByLabel("Discount percentage").fill("150");
    await expect(page.getByText("Discount cannot exceed 100%")).toBeVisible();

    await page.getByLabel("Tax rate").fill("abc");
    await expect(page.getByText("Use a percentage between 0 and 100")).toBeVisible();

    // Nothing invalid reached the server.
    const saved = await apiQuotation(page, id);
    expect(saved.items[0].rate_minor).toBe(50_000);
    expect(saved.discount_type).toBe("none");
  });

  test("scope, milestones and terms save; one-page caps are enforced (R-15a)", async ({ page }, testInfo) => {
    const { id } = await openBuilder(page, "Builder scope");

    await page.getByLabel("Project overview").fill("Rebuild the marketing site on a headless CMS.");
    await page.getByRole("button", { name: "Add deliverables" }).click();
    await page.getByLabel("Deliverables 1", { exact: true }).fill("Responsive website");
    await page.getByRole("button", { name: "Add excluded" }).click();
    await page.getByLabel("Excluded 1", { exact: true }).fill("Copywriting");
    await page.getByLabel("Revision policy").fill("Two revision rounds included.");

    await page.getByRole("button", { name: "Add milestone" }).click();
    await page.getByLabel("Milestone 1 name").fill("Design");
    await page.getByLabel("Milestone 1 start").fill("Week 1");
    await page.getByLabel("Milestone 1 end").fill("Week 2");

    await page.getByRole("button", { name: "Add terms" }).click();
    await page.getByLabel("Terms 1", { exact: true }).fill("50% advance");
    await waitSaved(page);
    await shot(page, testInfo, "step6_scope_timeline_terms");

    const saved = await apiQuotation(page, id);
    expect(saved.scope).toMatchObject({
      overview: "Rebuild the marketing site on a headless CMS.",
      deliverables: ["Responsive website"],
      excluded: ["Copywriting"],
      revision_policy: "Two revision rounds included.",
    });
    expect(saved.milestones).toMatchObject([{ name: "Design", start_label: "Week 1", end_label: "Week 2" }]);
    expect(saved.terms).toEqual(["50% advance"]);

    // Caps: 10 items, 5 per bullet list.
    const addItem = page.getByRole("button", { name: "Add item" });
    for (let i = 0; i < 10; i++) await addItem.click();
    await expect(page.getByRole("button", { name: "Limit of 10 items reached" })).toBeDisabled();
    await expect(page.getByTestId("one-page-status")).toHaveText("Fits on one page");
    await shot(page, testInfo, "step7_one_page_item_cap");

    const addDeliverable = page.getByRole("button", { name: "Add deliverables" });
    for (let i = 0; i < 4; i++) await addDeliverable.click();
    await expect(addDeliverable).toBeDisabled();
    await expect(page.getByLabel("Item 1 name")).toHaveAttribute("maxlength", "80");
  });

  test("another business's quotation is not found", async ({ page }) => {
    const res = await page.goto("/dashboard/quotations/00000000-0000-0000-0000-000000000000/edit");
    expect(res?.status()).toBe(404);
  });

  test("mobile keeps the total reachable; desktop shows the sticky summary", async ({ page, isMobile }) => {
    await openBuilder(page, "Builder responsive");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Item 1 rate").fill("1000");
    await page.getByLabel("Tax rate").fill("0");
    if (isMobile) {
      await expect(page.getByTestId("mobile-total")).toHaveText("₹1,000.00");
    } else {
      await expect(page.getByTestId("mobile-total")).toBeHidden();
    }
    await expect(page.getByTestId("summary-total")).toHaveText("₹1,000.00");
    // No horizontal page scroll.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("builder page is accessible", async ({ page }) => {
    await openBuilder(page, "Builder a11y");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByRole("button", { name: "Add milestone" }).click();
    await page.getByLabel("Item 1 rate").fill("-1"); // include an error state
    await expect(page.getByText("Use a non-negative amount with up to 2 decimals")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

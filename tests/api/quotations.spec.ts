/**
 * Phase 5 – Estimate builder: backend E2E (real HTTP, local Supabase).
 *
 * POST /api/quotations, GET/PATCH /api/quotations/:id — happy path, validation
 * (400), unauthenticated (401), other business (404), non-draft (409), and the
 * server recomputing totals (AC-CALC-004).
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { adminClient } from "../utils/auth";
import { createTenant, userDbClient, type Tenant } from "../utils/ownership";

const RUPEE = 100;

type Json = Record<string, unknown>;

async function createProject(request: APIRequestContext, name = "Website revamp") {
  const customer = await request.post("/api/customers", { data: { name: `${name} client` } });
  expect(customer.status()).toBe(200);
  const customerId = (await customer.json()).data.id as string;
  const project = await request.post("/api/projects", { data: { name, customer_id: customerId } });
  expect(project.status()).toBe(200);
  return (await project.json()).data.id as string;
}

async function createQuotation(request: APIRequestContext, projectId: string) {
  const res = await request.post("/api/quotations", { data: { project_id: projectId } });
  expect(res.status()).toBe(200);
  return (await res.json()).data.id as string;
}

function item(overrides: Json = {}): Json {
  return {
    service_id: null,
    name: "Development",
    description: "",
    pricing_model: "fixed",
    quantity: 1,
    unit: "",
    rate_minor: 0,
    percent_bp: 0,
    ...overrides,
  };
}

function draft(overrides: Json = {}): Json {
  return {
    title: "Website revamp",
    issue_date: "2026-09-27",
    valid_until: "2026-10-27",
    discount_type: "none",
    discount_value_minor: 0,
    discount_bp: 0,
    tax_name: "GST",
    tax_rate_bp: 1800,
    notes: "",
    internal_notes: "",
    terms: [],
    items: [],
    scope: { overview: "", deliverables: [], included: [], excluded: [], assumptions: [], revision_policy: "" },
    milestones: [],
    ...overrides,
  };
}

test.describe("Quotations API", () => {
  let tenant: Tenant;
  let other: Tenant;
  let projectId: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    tenant = await createTenant(browser, baseURL!, "quote-api-a");
    other = await createTenant(browser, baseURL!, "quote-api-b");
    const settings = await tenant.request.patch("/api/business", {
      data: { default_tax_name: "GST", default_tax_rate_bp: 1800, default_validity_days: 15, default_notes: "Thanks!" },
    });
    expect(settings.status()).toBe(200);
    projectId = await createProject(tenant.request);
  });

  test.afterAll(async () => {
    await tenant?.context.close();
    await other?.context.close();
  });

  test.describe("unauthenticated", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("every quotation route answers 401", async ({ request }) => {
      const id = "00000000-0000-0000-0000-000000000000";
      expect((await request.post("/api/quotations", { data: { project_id: id } })).status()).toBe(401);
      expect((await request.get(`/api/quotations/${id}`)).status()).toBe(401);
      expect((await request.patch(`/api/quotations/${id}`, { data: draft() })).status()).toBe(401);
    });
  });

  test.describe("create (AC-ESTIMATE-001)", () => {
    test("creates a draft with business defaults and moves the project to Estimating", async () => {
      const freshProject = await createProject(tenant.request, "Create defaults");
      const id = await createQuotation(tenant.request, freshProject);

      const res = await tenant.request.get(`/api/quotations/${id}`);
      expect(res.status()).toBe(200);
      const q = (await res.json()).data;
      expect(q).toMatchObject({
        status: "Draft",
        project_id: freshProject,
        title: "Create defaults",
        currency: "INR",
        tax_name: "GST",
        tax_rate_bp: 1800,
        notes: "Thanks!",
        total_minor: 0,
        items: [],
        milestones: [],
      });
      expect(q.customer?.name).toBe("Create defaults client");
      expect(q.scope).toMatchObject({ deliverables: [], overview: null });
      expect(q).not.toHaveProperty("business_id");
      // valid_until = issue_date + default_validity_days (15)
      const days = (Date.parse(q.valid_until) - Date.parse(q.issue_date)) / 86_400_000;
      expect(days).toBe(15);

      const project = await tenant.request.get(`/api/projects/${freshProject}`);
      expect((await project.json()).data.status).toBe("Estimating");
    });

    test("rejects a missing or malformed project id (400)", async () => {
      expect((await tenant.request.post("/api/quotations", { data: {} })).status()).toBe(400);
      expect((await tenant.request.post("/api/quotations", { data: { project_id: "nope" } })).status()).toBe(400);
    });

    test("another business's project answers 404", async () => {
      const res = await other.request.post("/api/quotations", { data: { project_id: projectId } });
      expect(res.status()).toBe(404);
    });

    test("archived projects can't get new quotations (400)", async () => {
      const archived = await createProject(tenant.request, "Archived one");
      expect((await tenant.request.delete(`/api/projects/${archived}`)).status()).toBe(200);
      const res = await tenant.request.post("/api/quotations", { data: { project_id: archived } });
      expect(res.status()).toBe(400);
    });

    test("ignores a client-supplied business_id", async () => {
      const res = await tenant.request.post("/api/quotations", {
        data: { project_id: projectId, business_id: other.businessId },
      });
      expect(res.status()).toBe(200);
      const id = (await res.json()).data.id;
      const { data } = await adminClient().from("quotations").select("business_id").eq("id", id).single();
      expect(data?.business_id).toBe(tenant.businessId);
    });
  });

  test.describe("get", () => {
    test("another business's quotation and malformed ids answer 404", async () => {
      const id = await createQuotation(tenant.request, projectId);
      expect((await other.request.get(`/api/quotations/${id}`)).status()).toBe(404);
      expect((await tenant.request.get(`/api/quotations/not-a-uuid`)).status()).toBe(404);
      expect((await tenant.request.get(`/api/quotations/00000000-0000-0000-0000-000000000000`)).status()).toBe(404);
    });
  });

  test.describe("save draft (PATCH)", () => {
    let id: string;
    test.beforeEach(async () => {
      id = await createQuotation(tenant.request, projectId);
    });

    test("AC-CALC-003: ₹1,00,000 − ₹10,000, 18% → ₹1,06,200; client totals are ignored", async () => {
      const res = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({
          discount_type: "fixed",
          discount_value_minor: 10_000 * RUPEE,
          items: [item({ rate_minor: 100_000 * RUPEE })],
          // Deliberately wrong: the server must recompute.
          subtotal_minor: 1,
          total_minor: 999,
        }),
      });
      expect(res.status()).toBe(200);
      const q = (await res.json()).data;
      expect(q).toMatchObject({
        subtotal_minor: 10_000_000,
        discount_minor: 1_000_000,
        taxable_minor: 9_000_000,
        tax_minor: 1_620_000,
        total_minor: 10_620_000,
      });
      expect(q.items[0].amount_minor).toBe(10_000_000);
    });

    test("all pricing models, percentage base (R-04) and percent discount (PRD §21)", async () => {
      const res = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({
          discount_type: "percent",
          discount_bp: 1000,
          items: [
            item({ name: "Build", pricing_model: "fixed", rate_minor: 200_000 * RUPEE }),
            item({ name: "Dev hours", pricing_model: "hourly", quantity: 40, unit: "hour", rate_minor: 2_000 * RUPEE }),
            item({ name: "Support", pricing_model: "daily", quantity: 10, unit: "day", rate_minor: 8_000 * RUPEE }),
            item({ name: "Pages", pricing_model: "quantity", quantity: 8, unit: "page", rate_minor: 5_000 * RUPEE }),
            item({ name: "Half hour", pricing_model: "hourly", quantity: 0.5, rate_minor: 0 }),
            item({ name: "PM", pricing_model: "percentage", percent_bp: 1000, quantity: 99, rate_minor: 12345 }),
          ],
        }),
      });
      expect(res.status()).toBe(200);
      const q = (await res.json()).data;
      // Base = 2,00,000 + 80,000 + 80,000 + 40,000 = 4,00,000; PM 10% = 40,000.
      expect(q.items.map((i: Json) => i.amount_minor)).toEqual([
        200_000 * RUPEE,
        80_000 * RUPEE,
        80_000 * RUPEE,
        40_000 * RUPEE,
        0,
        40_000 * RUPEE,
      ]);
      expect(q.items[4].quantity).toBe(0.5);
      // Percentage lines store neither quantity nor rate.
      expect(q.items[5]).toMatchObject({ quantity: 1, rate_minor: 0, percent_bp: 1000 });
      expect(q.subtotal_minor).toBe(440_000 * RUPEE);
      expect(q.discount_minor).toBe(44_000 * RUPEE);
      expect(q.total_minor).toBe(Math.round(396_000 * RUPEE * 1.18));
    });

    test("saves scope, milestones, terms and item order; a second save replaces them", async () => {
      const first = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({
          items: [item({ name: "A", rate_minor: 100 }), item({ name: "B", rate_minor: 200 })],
          scope: {
            overview: "Rebuild the marketing site.",
            deliverables: ["Responsive website", "CMS integration"],
            included: ["2 revision rounds"],
            excluded: ["Copywriting"],
            assumptions: ["Client provides assets"],
            revision_policy: "Two rounds included.",
          },
          milestones: [
            { name: "Design", description: "", start_label: "Week 1", end_label: "Week 2" },
            { name: "Build", description: "Pages and CMS", start_label: "Week 3", end_label: "Week 6" },
          ],
          terms: ["50% advance"],
        }),
      });
      expect(first.status()).toBe(200);
      const q1 = (await first.json()).data;
      expect(q1.items.map((i: Json) => i.name)).toEqual(["A", "B"]);
      expect(q1.scope.deliverables).toEqual(["Responsive website", "CMS integration"]);
      expect(q1.milestones.map((m: Json) => m.name)).toEqual(["Design", "Build"]);
      expect(q1.milestones[0].description).toBeNull();
      expect(q1.terms).toEqual(["50% advance"]);

      const second = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({ items: [item({ name: "B", rate_minor: 200 })], milestones: [] }),
      });
      const q2 = (await second.json()).data;
      expect(q2.items.map((i: Json) => i.name)).toEqual(["B"]);
      expect(q2.milestones).toEqual([]);
      expect(q2.scope.deliverables).toEqual([]);

      const persisted = await tenant.request.get(`/api/quotations/${id}`);
      expect((await persisted.json()).data.total_minor).toBe(236);
    });

    test("incomplete drafts save (AC-QUOTE-001)", async () => {
      const res = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({ title: "", issue_date: null, valid_until: null, items: [item({ name: "" })] }),
      });
      expect(res.status()).toBe(200);
    });

    const invalid: [string, Json][] = [
      ["negative rate", { items: [item({ rate_minor: -1 })] }],
      ["non-numeric rate (NaN)", { items: [item({ rate_minor: "abc" })] }],
      ["non-integer minor units", { items: [item({ rate_minor: 10.5 })] }],
      ["negative quantity", { items: [item({ quantity: -1 })] }],
      ["zero quantity", { items: [item({ quantity: 0 })] }],
      ["quantity with 4 decimals", { items: [item({ quantity: 1.0001 })] }],
      ["unknown pricing model", { items: [item({ pricing_model: "barter" })] }],
      ["percentage above 100%", { items: [item({ pricing_model: "percentage", percent_bp: 10_001 })] }],
      ["tax rate above 100%", { tax_rate_bp: 10_001 }],
      ["negative tax rate", { tax_rate_bp: -1 }],
      ["percent discount above 100%", { discount_type: "percent", discount_bp: 10_001 }],
      ["fixed discount above subtotal (R-07)", { discount_type: "fixed", discount_value_minor: 101, items: [item({ rate_minor: 100 })] }],
      ["valid_until before issue_date", { issue_date: "2026-10-01", valid_until: "2026-09-01" }],
      ["more than 10 line items (R-15a)", { items: Array.from({ length: 11 }, () => item()) }],
      ["more than 5 milestones (R-15a)", { milestones: Array.from({ length: 6 }, () => ({ name: "M" })) }],
      ["more than 5 deliverables (R-15a)", { scope: { deliverables: ["a", "b", "c", "d", "e", "f"] } }],
      ["overlong item name", { items: [item({ name: "x".repeat(81) })] }],
      ["missing items array", { items: undefined }],
    ];
    for (const [label, patch] of invalid) {
      test(`rejects ${label} (400)`, async () => {
        const res = await tenant.request.patch(`/api/quotations/${id}`, { data: draft(patch) });
        expect(res.status()).toBe(400);
        expect((await res.json()).error).toBeTruthy();
      });
    }

    test("a rejected save leaves the stored draft unchanged", async () => {
      await tenant.request.patch(`/api/quotations/${id}`, { data: draft({ items: [item({ rate_minor: 500 })] }) });
      const bad = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({ discount_type: "fixed", discount_value_minor: 10_000, items: [item({ rate_minor: 100 })] }),
      });
      expect(bad.status()).toBe(400);
      const q = (await (await tenant.request.get(`/api/quotations/${id}`)).json()).data;
      expect(q.items[0].rate_minor).toBe(500);
      expect(q.total_minor).toBe(590);
    });

    test("another business's quotation answers 404", async () => {
      const res = await other.request.patch(`/api/quotations/${id}`, { data: draft() });
      expect(res.status()).toBe(404);
    });

    test("a non-draft quotation can't be edited (409)", async () => {
      await adminClient().from("quotations").update({ status: "Sent" }).eq("id", id);
      const res = await tenant.request.patch(`/api/quotations/${id}`, { data: draft() });
      expect(res.status()).toBe(409);
    });

    test("catalog items: own service is linked and later catalog edits don't change the quote (AC-CATALOG-003)", async () => {
      const product = await tenant.request.post("/api/products", {
        data: { name: "Design sprint", kind: "service", pricing_model: "daily", unit: "day", default_rate_minor: 8_000 * RUPEE },
      });
      expect(product.status()).toBe(200);
      const serviceId = (await product.json()).data.id as string;

      const res = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({
          tax_rate_bp: 0,
          items: [item({ service_id: serviceId, name: "Design sprint", pricing_model: "daily", quantity: 3, rate_minor: 8_000 * RUPEE })],
        }),
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).data.items[0].service_id).toBe(serviceId);

      const edit = await tenant.request.patch(`/api/products/${serviceId}`, { data: { default_rate_minor: 1 } });
      expect(edit.status()).toBe(200);
      const q = (await (await tenant.request.get(`/api/quotations/${id}`)).json()).data;
      expect(q.items[0].rate_minor).toBe(8_000 * RUPEE);
      expect(q.total_minor).toBe(24_000 * RUPEE);
    });

    test("another business's catalog item is rejected (400)", async () => {
      const product = await other.request.post("/api/products", {
        data: { name: "Foreign", kind: "service", pricing_model: "fixed", default_rate_minor: 100 },
      });
      const foreignId = (await product.json()).data.id as string;
      const res = await tenant.request.patch(`/api/quotations/${id}`, {
        data: draft({ items: [item({ service_id: foreignId })] }),
      });
      expect(res.status()).toBe(400);
    });
  });

  test("RLS: another business can't read quotation rows directly", async () => {
    const id = await createQuotation(tenant.request, projectId);
    await tenant.request.patch(`/api/quotations/${id}`, { data: draft({ items: [item({ rate_minor: 100 })] }) });
    const db = await userDbClient(other.user.email, other.user.password);
    for (const table of ["quotations", "quotation_items", "quotation_milestones"]) {
      const column = table === "quotations" ? "id" : "quotation_id";
      const { data } = await db.from(table).select("*").eq(column, id);
      expect(data ?? []).toEqual([]);
    }
    const { data: scope } = await db.from("quotation_scope").select("*").eq("quotation_id", id);
    expect(scope ?? []).toEqual([]);
    const { error } = await db.rpc("save_quotation_draft", {
      p_quotation_id: id,
      p_header: { title: "hijack", discount_type: "none", discount_value_minor: 0, discount_bp: 0, tax_rate_bp: 0, subtotal_minor: 0, discount_minor: 0, taxable_minor: 0, tax_minor: 0, total_minor: 0 },
      p_items: [],
      p_scope: {},
      p_milestones: [],
    });
    expect(error).not.toBeNull();
    const q = (await (await tenant.request.get(`/api/quotations/${id}`)).json()).data;
    expect(q.title).toBe("Website revamp");
    expect(q.items).toHaveLength(1);
  });
});

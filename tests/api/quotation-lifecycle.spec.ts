/**
 * Phase 6 – Quotation lifecycle: backend E2E (real HTTP, local Supabase).
 *
 * Send (numbering, snapshot, token), required data, the R-11 transition table,
 * revise / archive / duplicate / regenerate link, snapshot immutability,
 * insert-only activity and versions, list filters, and business isolation.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { adminClient } from "../utils/auth";
import { createTenant, userDbClient, type Tenant } from "../utils/ownership";

type Json = Record<string, unknown>;
const YEAR = new Date().getFullYear();

function isoDay(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

async function newProject(request: APIRequestContext, name: string) {
  const customer = await request.post("/api/customers", { data: { name: `${name} client`, email: "client@example.test" } });
  expect(customer.status()).toBe(200);
  const customerId = (await customer.json()).data.id as string;
  const project = await request.post("/api/projects", { data: { name, customer_id: customerId } });
  expect(project.status()).toBe(200);
  return { projectId: (await project.json()).data.id as string, customerId };
}

function draft(overrides: Json = {}): Json {
  return {
    title: "Website revamp",
    issue_date: isoDay(0),
    valid_until: isoDay(30),
    discount_type: "fixed",
    discount_value_minor: 1_000_000,
    discount_bp: 0,
    tax_name: "GST",
    tax_rate_bp: 1800,
    notes: "Thanks",
    internal_notes: "Margin is thin",
    terms: ["50% advance"],
    items: [{ name: "Build", pricing_model: "fixed", quantity: 1, rate_minor: 10_000_000, percent_bp: 0 }],
    scope: { overview: "Rebuild", deliverables: ["Site"], included: [], excluded: [], assumptions: [], revision_policy: "" },
    milestones: [{ name: "Design", start_label: "Week 1", end_label: "Week 2" }],
    ...overrides,
  };
}

/** A saved, sendable draft. */
async function readyDraft(request: APIRequestContext, projectId: string, overrides: Json = {}) {
  const res = await request.post("/api/quotations", { data: { project_id: projectId } });
  expect(res.status()).toBe(200);
  const id = (await res.json()).data.id as string;
  const saved = await request.patch(`/api/quotations/${id}`, { data: draft(overrides) });
  expect(saved.status()).toBe(200);
  return id;
}

async function get(request: APIRequestContext, id: string) {
  const res = await request.get(`/api/quotations/${id}`);
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

async function activityTypes(request: APIRequestContext, id: string) {
  const res = await request.get(`/api/quotations/${id}/activity`);
  expect(res.status()).toBe(200);
  return ((await res.json()).data.activity as { type: string }[]).map((a) => a.type).reverse();
}

test.describe("Quotation lifecycle API", () => {
  let tenant: Tenant;
  let other: Tenant;
  let projectId: string;
  let customerId: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    tenant = await createTenant(browser, baseURL!, "lifecycle-a");
    other = await createTenant(browser, baseURL!, "lifecycle-b");
    ({ projectId, customerId } = await newProject(tenant.request, "Lifecycle project"));
  });

  test.afterAll(async () => {
    await tenant?.context.close();
    await other?.context.close();
  });

  test.describe("unauthenticated", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("every lifecycle route answers 401", async ({ request }) => {
      const id = "00000000-0000-0000-0000-000000000000";
      expect((await request.get("/api/quotations")).status()).toBe(401);
      for (const action of ["send", "revise", "archive", "duplicate", "link"]) {
        expect((await request.post(`/api/quotations/${id}/${action}`)).status(), action).toBe(401);
      }
      expect((await request.get(`/api/quotations/${id}/activity`)).status()).toBe(401);
    });
  });

  test("send finalizes: number, snapshot, token, status, activity (R-12, R-13)", async () => {
    const { projectId: p } = await newProject(tenant.request, "Send happy");
    const id = await readyDraft(tenant.request, p);

    const res = await tenant.request.post(`/api/quotations/${id}/send`);
    expect(res.status()).toBe(200);
    const sent = (await res.json()).data;
    expect(sent.quote_number).toMatch(new RegExp(`^QT-${YEAR}-\\d{3}$`));
    expect(sent.public_token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(sent.version).toBe(1);

    const q = await get(tenant.request, id);
    expect(q).toMatchObject({ status: "Sent", quote_number: sent.quote_number, public_token: sent.public_token });
    expect(q.sent_at).toBeTruthy();

    const { data: version } = await adminClient()
      .from("quotation_versions")
      .select("version, snapshot")
      .eq("quotation_id", id)
      .single();
    expect(version?.version).toBe(1);
    const snap = version?.snapshot as { quotation: Json; customer: Json; business: Json };
    expect(snap.quotation).toMatchObject({ quote_number: sent.quote_number, total_minor: 10_620_000, version: 1 });
    expect(snap.customer).toMatchObject({ name: "Send happy client" });
    // Owner-only fields never enter the client document.
    expect(snap.quotation).not.toHaveProperty("internal_notes");
    expect(snap.quotation).not.toHaveProperty("public_token");

    expect(await activityTypes(tenant.request, id)).toEqual(["created", "updated", "sent"]);

    // Project status is derived from the latest quotation (R-18).
    const project = await tenant.request.get(`/api/projects/${p}`);
    expect((await project.json()).data.status).toBe("Quoted");
  });

  test("numbers are sequential per business and independent across businesses (AC-QUOTE-003)", async () => {
    const { projectId: p } = await newProject(tenant.request, "Numbering");
    const numbers: string[] = [];
    for (let i = 0; i < 2; i++) {
      const id = await readyDraft(tenant.request, p);
      numbers.push((await (await tenant.request.post(`/api/quotations/${id}/send`)).json()).data.quote_number);
    }
    const seq = numbers.map((n) => Number(n.split("-").at(-1)));
    expect(seq[1]).toBeGreaterThan(seq[0]);
    expect(new Set(numbers).size).toBe(2);

    // A fresh business starts its own sequence at 001.
    const { projectId: otherProject } = await newProject(other.request, "Other numbering");
    const otherId = await readyDraft(other.request, otherProject);
    const otherSent = (await (await other.request.post(`/api/quotations/${otherId}/send`)).json()).data;
    expect(otherSent.quote_number).toBe(`QT-${YEAR}-001`);
  });

  test("drafts never use up numbers", async () => {
    const { data: before } = await adminClient()
      .from("quote_number_counters")
      .select("next_value")
      .eq("business_id", tenant.businessId)
      .eq("year", YEAR)
      .maybeSingle();
    await readyDraft(tenant.request, projectId);
    const { data: after } = await adminClient()
      .from("quote_number_counters")
      .select("next_value")
      .eq("business_id", tenant.businessId)
      .eq("year", YEAR)
      .maybeSingle();
    expect(after?.next_value ?? null).toBe(before?.next_value ?? null);
  });

  const notReady: [string, Json][] = [
    ["no line items", { items: [], discount_type: "none", discount_value_minor: 0 }],
    [
      "an unnamed item",
      { items: [{ name: "", pricing_model: "fixed", quantity: 1, rate_minor: 100, percent_bp: 0 }], discount_type: "none", discount_value_minor: 0 },
    ],
    ["no issue date", { issue_date: null }],
    ["no valid-until date", { valid_until: null }],
    ["a valid-until date in the past", { issue_date: isoDay(-10), valid_until: isoDay(-1) }],
    ["no title", { title: "" }],
  ];
  for (const [label, overrides] of notReady) {
    test(`send refuses a draft with ${label} (400, AC-QUOTE-002)`, async () => {
      const id = await readyDraft(tenant.request, projectId, overrides);
      const res = await tenant.request.post(`/api/quotations/${id}/send`);
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toBeTruthy();
      expect(Array.isArray(body.issues)).toBe(true);
      expect((await get(tenant.request, id)).status).toBe("Draft");
      expect((await get(tenant.request, id)).quote_number).toBeNull();
    });
  }

  test("sent quotations are frozen: no draft edits, no second send (409)", async () => {
    const id = await readyDraft(tenant.request, projectId);
    await tenant.request.post(`/api/quotations/${id}/send`);
    expect((await tenant.request.patch(`/api/quotations/${id}`, { data: draft() })).status()).toBe(409);
    expect((await tenant.request.post(`/api/quotations/${id}/send`)).status()).toBe(409);
  });

  test("snapshots don't change when the customer changes later (AC-DATA-002/003)", async () => {
    const { projectId: p, customerId: c } = await newProject(tenant.request, "Snapshot");
    const id = await readyDraft(tenant.request, p);
    await tenant.request.post(`/api/quotations/${id}/send`);

    const rename = await tenant.request.patch(`/api/customers/${c}`, { data: { name: "Renamed Client" } });
    expect(rename.status()).toBe(200);

    const { data } = await adminClient().from("quotation_versions").select("snapshot").eq("quotation_id", id).single();
    const snap = data?.snapshot as { customer: { name: string }; quotation: { total_minor: number } };
    expect(snap.customer.name).toBe("Snapshot client");
    expect(snap.quotation.total_minor).toBe(10_620_000);
  });

  test("revise → Draft v2 keeps number and link; re-send freezes v2 and keeps v1 (R-03, R-11)", async () => {
    const id = await readyDraft(tenant.request, projectId);
    const first = (await (await tenant.request.post(`/api/quotations/${id}/send`)).json()).data;

    const revise = await tenant.request.post(`/api/quotations/${id}/revise`);
    expect(revise.status()).toBe(200);
    expect((await revise.json()).data.version).toBe(2);
    const revised = await get(tenant.request, id);
    expect(revised).toMatchObject({ status: "Draft", current_version: 2, quote_number: first.quote_number, public_token: first.public_token });

    await tenant.request.patch(`/api/quotations/${id}`, {
      data: draft({ discount_type: "none", discount_value_minor: 0 }),
    });
    const second = (await (await tenant.request.post(`/api/quotations/${id}/send`)).json()).data;
    expect(second).toMatchObject({ quote_number: first.quote_number, version: 2 });

    const { data: versions } = await adminClient()
      .from("quotation_versions")
      .select("version, snapshot")
      .eq("quotation_id", id)
      .order("version");
    expect(versions?.map((v) => v.version)).toEqual([1, 2]);
    expect((versions?.[0].snapshot as { quotation: { total_minor: number } }).quotation.total_minor).toBe(10_620_000);
    expect((versions?.[1].snapshot as { quotation: { total_minor: number } }).quotation.total_minor).toBe(11_800_000);

    expect(await activityTypes(tenant.request, id)).toEqual(["created", "updated", "sent", "revised", "updated", "sent"]);
  });

  test("R-11 table: what each status allows", async () => {
    const admin = adminClient();
    const setStatus = (id: string, status: string) => admin.from("quotations").update({ status }).eq("id", id);

    // Draft: can't revise.
    const d = await readyDraft(tenant.request, projectId);
    expect((await tenant.request.post(`/api/quotations/${d}/revise`)).status()).toBe(409);

    // Viewed / Rejected / Expired can be revised.
    for (const status of ["Viewed", "Rejected", "Expired"]) {
      const id = await readyDraft(tenant.request, projectId);
      await tenant.request.post(`/api/quotations/${id}/send`);
      await setStatus(id, status);
      expect((await tenant.request.post(`/api/quotations/${id}/revise`)).status(), status).toBe(200);
    }

    // Accepted is final except archive.
    const accepted = await readyDraft(tenant.request, projectId);
    await tenant.request.post(`/api/quotations/${accepted}/send`);
    await setStatus(accepted, "Accepted");
    expect((await tenant.request.post(`/api/quotations/${accepted}/revise`)).status()).toBe(409);
    expect((await tenant.request.post(`/api/quotations/${accepted}/send`)).status()).toBe(409);
    expect((await tenant.request.post(`/api/quotations/${accepted}/archive`)).status()).toBe(200);

    // Archived is terminal.
    for (const action of ["send", "revise", "archive", "link"]) {
      expect((await tenant.request.post(`/api/quotations/${accepted}/${action}`)).status(), action).toBe(409);
    }
    expect((await tenant.request.patch(`/api/quotations/${accepted}`, { data: draft() })).status()).toBe(409);

    // A draft can be archived too.
    expect((await tenant.request.post(`/api/quotations/${d}/archive`)).status()).toBe(200);
    expect((await get(tenant.request, d)).status).toBe("Archived");
  });

  test("members can't change lifecycle fields directly (status, number, token)", async () => {
    const id = await readyDraft(tenant.request, projectId);
    const db = await userDbClient(tenant.user.email, tenant.user.password);
    for (const patch of [{ status: "Accepted" }, { quote_number: "QT-HACK-1" }, { public_token: "guessable" }, { current_version: 9 }]) {
      const { error } = await db.from("quotations").update(patch).eq("id", id);
      expect(error, JSON.stringify(patch)).not.toBeNull();
    }
    expect((await get(tenant.request, id)).status).toBe("Draft");
  });

  test("regenerating the link replaces the token (R-17)", async () => {
    const id = await readyDraft(tenant.request, projectId);
    expect((await tenant.request.post(`/api/quotations/${id}/link`)).status()).toBe(409); // not sent yet
    const sent = (await (await tenant.request.post(`/api/quotations/${id}/send`)).json()).data;
    const res = await tenant.request.post(`/api/quotations/${id}/link`);
    expect(res.status()).toBe(200);
    const token = (await res.json()).data.public_token;
    expect(token).not.toBe(sent.public_token);
    expect((await get(tenant.request, id)).public_token).toBe(token);
    expect(await activityTypes(tenant.request, id)).toContain("link_regenerated");
  });

  test("duplicate creates a fresh draft with the same content (R-03)", async () => {
    const id = await readyDraft(tenant.request, projectId);
    await tenant.request.post(`/api/quotations/${id}/send`);

    const res = await tenant.request.post(`/api/quotations/${id}/duplicate`);
    expect(res.status()).toBe(200);
    const copyId = (await res.json()).data.id;
    const copy = await get(tenant.request, copyId);
    const source = await get(tenant.request, id);
    expect(copy).toMatchObject({
      status: "Draft",
      quote_number: null,
      public_token: null,
      current_version: 1,
      title: "Website revamp (copy)",
      total_minor: source.total_minor,
      internal_notes: "Margin is thin",
    });
    expect(copy.items.map((i: Json) => i.name)).toEqual(source.items.map((i: Json) => i.name));
    expect(copy.milestones).toHaveLength(1);
    expect(copy.scope.deliverables).toEqual(["Site"]);
    expect((await activityTypes(tenant.request, copyId))[0]).toBe("duplicated");
  });

  test("another business gets 404 on every lifecycle route", async () => {
    const id = await readyDraft(tenant.request, projectId);
    for (const action of ["send", "revise", "archive", "duplicate", "link"]) {
      expect((await other.request.post(`/api/quotations/${id}/${action}`)).status(), action).toBe(404);
    }
    expect((await other.request.get(`/api/quotations/${id}/activity`)).status()).toBe(404);
    expect((await get(tenant.request, id)).status).toBe("Draft");
  });

  test("activity and versions are insert-only (AC-ACTIVITY-003)", async () => {
    const id = await readyDraft(tenant.request, projectId);
    await tenant.request.post(`/api/quotations/${id}/send`);
    const db = await userDbClient(tenant.user.email, tenant.user.password);

    const { data: act } = await db.from("quotation_activity").select("id").eq("quotation_id", id);
    expect(act?.length).toBeGreaterThan(0);
    await db.from("quotation_activity").update({ type: "accepted" }).eq("quotation_id", id);
    await db.from("quotation_activity").delete().eq("quotation_id", id);
    await db.from("quotation_versions").update({ snapshot: {} }).eq("quotation_id", id);
    await db.from("quotation_versions").delete().eq("quotation_id", id);

    expect(await activityTypes(tenant.request, id)).toEqual(["created", "updated", "sent"]);
    const { data: v } = await adminClient().from("quotation_versions").select("snapshot").eq("quotation_id", id).single();
    expect((v?.snapshot as { quotation: Json }).quotation).toHaveProperty("quote_number");

    // Another business can't read them at all.
    const otherDb = await userDbClient(other.user.email, other.user.password);
    expect((await otherDb.from("quotation_activity").select("id").eq("quotation_id", id)).data ?? []).toEqual([]);
    expect((await otherDb.from("quotation_versions").select("id").eq("quotation_id", id)).data ?? []).toEqual([]);
  });

  test("list: filters by status, search and project; only this business", async () => {
    const { projectId: p } = await newProject(tenant.request, "Listing");
    const sentId = await readyDraft(tenant.request, p, { title: "Zebra listing quote" });
    const sent = (await (await tenant.request.post(`/api/quotations/${sentId}/send`)).json()).data;
    const draftId = await readyDraft(tenant.request, p, { title: "Yak listing draft" });

    const byProject = (await (await tenant.request.get(`/api/quotations?project_id=${p}`)).json()).data.quotations;
    expect(byProject.map((q: Json) => q.id).sort()).toEqual([sentId, draftId].sort());

    const sentOnly = (await (await tenant.request.get(`/api/quotations?project_id=${p}&status=Sent`)).json()).data.quotations;
    expect(sentOnly.map((q: Json) => q.id)).toEqual([sentId]);
    expect(sentOnly[0]).toMatchObject({ quote_number: sent.quote_number, project: { name: "Listing" } });

    const byNumber = (await (await tenant.request.get(`/api/quotations?search=${sent.quote_number}`)).json()).data.quotations;
    expect(byNumber.map((q: Json) => q.id)).toContain(sentId);
    const byTitle = (await (await tenant.request.get(`/api/quotations?search=Yak listing`)).json()).data.quotations;
    expect(byTitle.map((q: Json) => q.id)).toEqual([draftId]);

    const otherList = (await (await other.request.get(`/api/quotations?search=listing`)).json()).data.quotations;
    expect(otherList).toEqual([]);

    expect((await tenant.request.get(`/api/quotations?status=Bogus`)).status()).toBe(400);
    expect((await tenant.request.get(`/api/quotations?project_id=nope`)).status()).toBe(400);
  });

  test("customer id on a new quotation comes from its project", async () => {
    const id = await readyDraft(tenant.request, projectId);
    expect((await get(tenant.request, id)).customer_id).toBe(customerId);
  });
});

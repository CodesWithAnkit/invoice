import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/api/auth";
import { fail, serverError } from "@/lib/api/respond";
import { isUuid } from "@/lib/api/validate";
import { calculateInvoiceTotals, calculateItemTotal } from "@/modules/invoice/invoice.calculator";
import type { InvoiceItem } from "@/modules/invoice/invoice.types";

function generateInvoiceFileName(customerName: string, invoiceNumber: string) {
  return `${customerName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")}-Invoice-${invoiceNumber}.pdf`;
}

type ItemInput = { name?: unknown; quantity?: unknown; price?: unknown };

function parseItems(raw: unknown): InvoiceItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: InvoiceItem[] = [];
  for (const entry of raw as ItemInput[]) {
    const quantity = Number(entry?.quantity);
    const unitPrice = Number(entry?.price);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice) || quantity < 0 || unitPrice < 0) {
      return null;
    }
    items.push({
      id: "",
      description: String(entry?.name ?? ""),
      quantity,
      unitPrice,
      total: calculateItemTotal({ quantity, unitPrice }),
    });
  }
  return items;
}

// POST /api/invoices/save (multipart: customer, invoice, items, optional pdf)
//
// Ownership comes from the session; ids in the payload must belong to the
// caller's business. Totals are recomputed here with the same calculator the
// editor uses, so client-supplied totals are never stored (C5).
export async function POST(request: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;
  const { supabase, businessId } = auth;

  try {
    const formData = await request.formData();
    const customerDataStr = formData.get("customer") as string;
    const invoiceDataStr = formData.get("invoice") as string;
    const itemsDataStr = formData.get("items") as string;
    const pdfFile = formData.get("pdf") as File | null;

    if (!customerDataStr || !invoiceDataStr || !itemsDataStr) {
      return fail("Missing required data", 400);
    }

    let customerData, invoiceData, itemsRaw;
    try {
      customerData = JSON.parse(customerDataStr);
      invoiceData = JSON.parse(invoiceDataStr);
      itemsRaw = JSON.parse(itemsDataStr);
    } catch {
      return fail("Invalid request payload", 400);
    }

    const items = parseItems(itemsRaw);
    if (!items) return fail("Line items must have a non-negative quantity and price.", 400);
    if (!customerData?.name) return fail("Customer name is required.", 400);

    const taxPercent = Number(invoiceData.tax_percent ?? 18);
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      return fail("Tax percent must be between 0 and 100.", 400);
    }
    const totals = calculateInvoiceTotals(items, taxPercent);

    // 1. Resolve the customer (and, for updates, the existing invoice).
    let customerId: string | null = null;

    if (invoiceData.id !== undefined && invoiceData.id !== null && invoiceData.id !== "") {
      if (!isUuid(invoiceData.id)) return fail("Invoice not found.", 404);
      const { data: existing, error } = await supabase
        .from("invoices")
        .select("id, customer_id")
        .eq("id", invoiceData.id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      if (!existing) return fail("Invoice not found.", 404);
      // Re-saving keeps the invoice's customer instead of creating a duplicate (D1).
      customerId = existing.customer_id;
    }

    if (!customerId && customerData.id) {
      if (!isUuid(customerData.id)) return fail("Customer not found.", 404);
      const { data: owned, error } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerData.id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      if (!owned) return fail("Customer not found.", 404);
      customerId = owned.id;
    }

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          aadhaar: customerData.aadhaar,
          company_name: customerData.companyName,
        })
        .select("id")
        .single();
      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }

    // 2. Optional PDF upload to the private bucket, under the business folder.
    let pdfPath: string | undefined;
    if (pdfFile) {
      const fileName = generateInvoiceFileName(
        customerData.name,
        invoiceData.invoice_number || `INV-${Date.now()}`
      );
      pdfPath = `${businessId}/${fileName}`;
      const buffer = new Uint8Array(await pdfFile.arrayBuffer());
      const { error: storageError } = await supabase.storage
        .from("invoice-pdfs")
        .upload(pdfPath, buffer, { contentType: "application/pdf", upsert: true });
      if (storageError) throw storageError;
    }

    // 3. Save the invoice. business_id is filled by the column default from the session.
    const invoicePayload: Record<string, unknown> = {
      invoice_number: invoiceData.invoice_number,
      customer_id: customerId,
      customer_name: customerData.name,
      invoice_type: invoiceData.invoice_type || "Standard",
      subtotal: totals.subTotal,
      sgst: totals.sgst,
      cgst: totals.cgst,
      total: totals.grandTotal,
      business_name: invoiceData.business_name,
      business_address: invoiceData.business_address,
      business_phone: invoiceData.business_phone,
      business_gstin: invoiceData.business_gstin,
      bank_name: invoiceData.bank?.bankName || "",
      account_name: invoiceData.bank?.accountName || "",
      account_number: invoiceData.bank?.accountNumber || "",
      ifsc: invoiceData.bank?.ifsc || "",
    };
    if (pdfPath) invoicePayload.pdf_url = pdfPath;

    const isUpdate = Boolean(invoiceData.id);
    const { data: savedInvoice, error: invoiceError } = isUpdate
      ? await supabase
          .from("invoices")
          .update(invoicePayload)
          .eq("id", invoiceData.id)
          .eq("business_id", businessId)
          .select()
          .single()
      : await supabase.from("invoices").insert(invoicePayload).select().single();
    if (invoiceError) throw invoiceError;

    // 4. Replace line items.
    if (isUpdate) {
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", savedInvoice.id);
      if (deleteError) throw deleteError;
    }

    const { error: itemsError } = await supabase.from("invoice_items").insert(
      items.map((item) => ({
        invoice_id: savedInvoice.id,
        product_name: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      }))
    );
    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, invoice: savedInvoice });
  } catch (error) {
    return serverError("Error saving invoice", error);
  }
}

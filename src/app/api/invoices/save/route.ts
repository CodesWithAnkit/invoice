import { NextResponse } from "next/server";
import { supabase } from "@/../lib/supabase";

function generateInvoiceFileName(customerName: string, invoiceNumber: string) {
  return `${customerName
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")}-Invoice-${invoiceNumber}.pdf`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const customerDataStr = formData.get("customer") as string;
    const invoiceDataStr = formData.get("invoice") as string;
    const itemsDataStr = formData.get("items") as string;
    const pdfFile = formData.get("pdf") as File | null;

    if (!customerDataStr || !invoiceDataStr || !itemsDataStr) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const customerData = JSON.parse(customerDataStr);
    const invoiceData = JSON.parse(invoiceDataStr);
    const itemsData = JSON.parse(itemsDataStr);

    // 1. Save or Update Customer
    let customerId = customerData.id;

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          aadhaar: customerData.aadhaar,
        })
        .select()
        .single();

      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }

    // 2. Generate PDF File Name & Upload
    let pdfUrl = "";
    if (pdfFile) {
      const fileName = generateInvoiceFileName(
        customerData.name,
        invoiceData.invoice_number || `INV-${Date.now()}`
      );

      const arrayBuffer = await pdfFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data: storageData, error: storageError } = await supabase.storage
        .from("invoice-pdfs")
        .upload(fileName, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from("invoice-pdfs")
        .getPublicUrl(fileName);

      pdfUrl = publicUrlData.publicUrl;
    }

    // 3. Save or Update Invoice
    const invoicePayload: any = {
      invoice_number: invoiceData.invoice_number,
      customer_id: customerId,
      customer_name: customerData.name,
      invoice_type: invoiceData.invoice_type || "Standard",
      subtotal: invoiceData.subtotal || 0,
      sgst: invoiceData.sgst || 0,
      cgst: invoiceData.cgst || 0,
      total: invoiceData.total || 0,
      pdf_url: pdfUrl,
      business_name: invoiceData.business_name,
      business_address: invoiceData.business_address,
      business_phone: invoiceData.business_phone,
      business_gstin: invoiceData.business_gstin,
    };

    if (invoiceData.id) {
      invoicePayload.id = invoiceData.id;
    }

    const { data: savedInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .upsert(invoicePayload)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 4. Save Invoice Items (Delete old ones if updating)
    if (invoiceData.id) {
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceData.id);
    }

    const itemsToInsert = itemsData.map((item: any) => ({
      invoice_id: savedInvoice.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.quantity * item.price,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, invoice: savedInvoice });
  } catch (error: any) {
    console.error("Error saving invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

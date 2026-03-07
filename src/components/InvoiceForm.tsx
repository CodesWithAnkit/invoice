"use client";

import { useInvoice } from "@/hooks/useInvoice";
import { usePdfParser } from "@/hooks/usePdfParser";

// Sub-components
import BusinessDetails from "./form/BusinessDetails";
import InvoiceMeta from "./form/InvoiceMeta";
import CustomerDetails from "./form/CustomerDetails";
import InvoiceItems from "./form/InvoiceItems";
import BankDetails from "./form/BankDetails";
import SignatureSection from "./form/SignatureSection";

export default function InvoiceForm() {
  const {
    invoice,
    setInvoiceField,
    addItem,
    removeItem,
    updateItem,
    recalculateTotals,
    generateInvoice,
  } = useInvoice();

  const { loading, handleFileUpload } = usePdfParser(setInvoiceField, recalculateTotals);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      {/* 0. PDF Uploader */}
      <section style={{ backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "8px", border: "1px dashed #ccc" }}>
        <h3>Auto-populate from PDF</h3>
        <input type="file" accept="application/pdf" onChange={handleFileUpload} disabled={loading} />
        {loading && <p style={{ fontSize: "0.8rem", color: "#0070f3" }}>Parsing PDF...</p>}
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
          Upload a previous invoice PDF to extract metadata.
        </p>
      </section>

      {/* 1. Business Details */}
      <BusinessDetails 
        businessName={invoice.businessName}
        phone={invoice.phone}
        gstin={invoice.gstin}
        onUpdate={setInvoiceField}
      />

      <hr />

      {/* 2. Invoice Meta */}
      <InvoiceMeta 
        invoiceNumber={invoice.meta.invoiceNumber}
        date={invoice.meta.date}
        type={invoice.meta.type}
        onUpdate={setInvoiceField}
      />

      <hr />

      {/* 3. Customer Details */}
      <CustomerDetails 
        name={invoice.customer.name}
        address={invoice.customer.address}
        fields={invoice.customer.fields}
        onUpdate={setInvoiceField}
      />

      <hr />

      {/* 4. Items List */}
      <InvoiceItems 
        items={invoice.items}
        totals={invoice.totals}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
      />

      <hr />

      {/* 5. Bank Details */}
      <BankDetails 
        bankName={invoice.bank.bankName}
        accountName={invoice.bank.accountName}
        accountNumber={invoice.bank.accountNumber}
        ifsc={invoice.bank.ifsc}
        onUpdate={setInvoiceField}
      />

      {/* Signature Section */}
      <SignatureSection 
        signature={invoice.signature}
        onUpdate={(dataURL) => setInvoiceField("signature", dataURL)}
      />

      {/* Actions */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button 
            onClick={generateInvoice}
            style={{ 
              padding: "1rem 2rem", 
              fontSize: "1.2rem", 
              cursor: "pointer",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              width: "100%"
            }}
        >
          Finalize & Preview
        </button>
      </div>
      
      {invoice.amountWords && (
        <div style={{ fontStyle: "italic", color: "#555", textAlign: "center", marginBottom: "2rem" }}>
          Amount in words: {invoice.amountWords}
        </div>
      )}
    </div>
  );
}

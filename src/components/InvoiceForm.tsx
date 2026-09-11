"use client";

import { useInvoice } from "@/hooks/useInvoice";
import { usePdfParser } from "@/hooks/usePdfParser";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";

// Sub-components
import BusinessDetails from "./form/BusinessDetails";
import InvoiceMeta from "./form/InvoiceMeta";
import CustomerDetails from "./form/CustomerDetails";
import InvoiceItems from "./form/InvoiceItems";
import BankDetails from "./form/BankDetails";
import SignatureSection from "./form/SignatureSection";
import InvoiceBusinessGenerator from "./InvoiceBusinessGenerator";
import { useInvoicePrint } from "@/hooks/useInvoicePrint";

export default function InvoiceForm() {
  const {
    invoice,
    setInvoiceField,
    addItem,
    removeItem,
    updateItem,
    recalculateTotals,
    generateInvoice,
    setInvoiceData,
  } = useInvoice();

  const { loading, handleFileUpload } = usePdfParser(setInvoiceField, recalculateTotals);
  const { printInvoice } = useInvoicePrint();

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Business Setup Generator */}
      <div className="no-print">
        <InvoiceBusinessGenerator onGenerate={setInvoiceData} />
      </div>

      {/* 0. PDF Uploader */}
      <Card className="border-dashed no-print">
        <CardHeader>
          <CardTitle>Auto-populate from PDF</CardTitle>
          <CardDescription>Upload a previous invoice PDF to extract metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileUpload} 
            disabled={loading} 
            className="max-w-md"
          />
          {loading && <p className="text-sm text-blue-600 mt-2">Parsing PDF...</p>}
        </CardContent>
      </Card>

      {/* 1. Business Details */}
      <BusinessDetails 
        businessName={invoice.businessName}
        businessAddress={invoice.businessAddress}
        phone={invoice.phone}
        gstin={invoice.gstin}
        fields={invoice.fields}
        onUpdate={setInvoiceField}
      />

      {/* 2. Invoice Meta */}
      <InvoiceMeta 
        invoiceNumber={invoice.meta.invoiceNumber}
        date={invoice.meta.date}
        type={invoice.meta.type}
        fields={invoice.meta.fields}
        onUpdate={setInvoiceField}
      />

      {/* 3. Customer Details */}
      <CustomerDetails 
        name={invoice.customer.name}
        address={invoice.customer.address}
        fields={invoice.customer.fields}
        onUpdate={setInvoiceField}
      />

      {/* 4. Items List */}
      <InvoiceItems 
        items={invoice.items}
        totals={invoice.totals}
        taxPercent={invoice.taxPercent}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        onReplaceItems={(newItems) => setInvoiceData({ items: newItems })}
      />

      {/* 5. Bank Details */}
      <BankDetails 
        bankName={invoice.bank.bankName}
        accountName={invoice.bank.accountName}
        accountNumber={invoice.bank.accountNumber}
        ifsc={invoice.bank.ifsc}
        fields={invoice.bank.fields}
        onUpdate={setInvoiceField}
      />

      {/* Signature Section */}
      <SignatureSection 
        signature={invoice.signature}
        onUpdate={(dataURL) => setInvoiceField("signature", dataURL)}
      />

      {invoice.amountWords && (
        <div className="italic text-muted-foreground text-center mt-8">
          Amount in words: {invoice.amountWords}
        </div>
      )}
    </div>
  );
}


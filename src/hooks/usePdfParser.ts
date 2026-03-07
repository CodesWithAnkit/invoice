import { useState } from "react";

export function usePdfParser(setInvoiceField: (field: string, value: any) => void, recalculateTotals: () => void) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-invoice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to parse PDF via server");
      }

      const data = await res.json();
      
      if (data && !data.error) {
        mapPdfDataToState(data);
        alert(`Extracted ${data.items?.length || 0} items and structured fields from PDF!`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse PDF. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  const mapPdfDataToState = (data: any) => {
    // Business details
    if (data.business.name) setInvoiceField("businessName", data.business.name);
    if (data.business.phone) setInvoiceField("phone", data.business.phone);
    if (data.business.gstin) setInvoiceField("gstin", data.business.gstin);

    // Meta details
    if (data.meta.quoteNo) setInvoiceField("meta.invoiceNumber", data.meta.quoteNo);
    if (data.meta.date) setInvoiceField("meta.date", data.meta.date);
    
    // Customer details
    if (data.customer.name) setInvoiceField("customer.name", data.customer.name);
    if (data.customer.address) setInvoiceField("customer.address", data.customer.address);
    
    // Merge dynamic customer fields
    if (data.customer.fields) {
      Object.entries(data.customer.fields).forEach(([key, value]) => {
        if (value) setInvoiceField(`customer.fields.${key}`, value);
      });
    }

    // Bank details
    if (data.bank.bankName) setInvoiceField("bank.bankName", data.bank.bankName);
    if (data.bank.accountName) setInvoiceField("bank.accountName", data.bank.accountName);
    if (data.bank.accountNumber) setInvoiceField("bank.accountNumber", data.bank.accountNumber);
    if (data.bank.ifsc) setInvoiceField("bank.ifsc", data.bank.ifsc);

    // Amount in words
    if (data.amountWords) setInvoiceField("amountWords", data.amountWords);

    // Items
    if (data.items && data.items.length > 0) {
      setInvoiceField("items", data.items);
      setTimeout(() => recalculateTotals(), 0);
    }
  };

  return { loading, handleFileUpload };
}

"use client";

import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";
import { useState } from "react";
import SignaturePad from "./SignaturePad";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
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
      console.log("Parsed Data:", data);
      
      if (data && !data.error) {
        // Business details mappings
        if (data.business.name) setInvoiceField("businessName", data.business.name);
        if (data.business.phone) setInvoiceField("phone", data.business.phone);
        if (data.business.gstin) setInvoiceField("gstin", data.business.gstin);

        // Meta details mappings
        if (data.meta.quoteNo) setInvoiceField("meta.invoiceNumber", data.meta.quoteNo);
        if (data.meta.date) setInvoiceField("meta.date", data.meta.date);
        
        // Customer details mappings
        if (data.customer.name) setInvoiceField("customer.name", data.customer.name);
        if (data.customer.address) setInvoiceField("customer.address", data.customer.address);
        
        // Merge dynamic customer fields
        if (data.customer.fields) {
          Object.entries(data.customer.fields).forEach(([key, value]) => {
            if (value) setInvoiceField(`customer.fields.${key}`, value);
          });
        }
        if (data.bank.bankName) setInvoiceField("bank.bankName", data.bank.bankName);
        if (data.bank.accountName) setInvoiceField("bank.accountName", data.bank.accountName);
        if (data.bank.accountNumber) setInvoiceField("bank.accountNumber", data.bank.accountNumber);
        if (data.bank.ifsc) setInvoiceField("bank.ifsc", data.bank.ifsc);

        // Amount in words
        if (data.amountWords) setInvoiceField("amountWords", data.amountWords);

        // Items and Totals
        if (data.items && data.items.length > 0) {
          setInvoiceField("items", data.items);
          // Manually trigger a totals recalculation
          setTimeout(() => recalculateTotals(), 0);
          alert(`Extracted ${data.items.length} items and structured fields from PDF!`);
        } else {
          alert("Extracted structured fields from PDF. No items found.");
        }
        
        console.log("Structured Data Extracted:", data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse PDF. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (index: number, field: "quantity" | "unitPrice", value: string) => {
    const parsed = parseFloat(value);
    updateItem(index, field, isNaN(parsed) ? 0 : parsed);
  };

  const commonInputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box" as const,
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target?.result as string;
      setInvoiceField("signature", dataURL);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      {/* 0. PDF Uploader */}
      <section style={{ backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "8px", border: "1px dashed #ccc" }}>
        <h3>Auto-populate from PDF</h3>
        <input type="file" accept="application/pdf" onChange={handleFileUpload} />
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
          Upload a previous invoice PDF to extract metadata.
        </p>
      </section>

      {/* 1. Business Details */}
      <section>
        <h2>Business Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label>Business Name</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.businessName}
              onChange={(e) => setInvoiceField("businessName", e.target.value)}
            />
          </div>
          <div>
            <label>Phone</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.phone}
              onChange={(e) => setInvoiceField("phone", e.target.value)}
            />
          </div>
          <div>
            <label>GSTIN</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.gstin}
              onChange={(e) => setInvoiceField("gstin", e.target.value)}
            />
          </div>
        </div>
      </section>

      <hr />

      {/* 2. Invoice Meta */}
      <section>
        <h2>Invoice Meta</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <div>
            <label>Invoice Number</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.meta.invoiceNumber}
              onChange={(e) => setInvoiceField("meta.invoiceNumber", e.target.value)}
            />
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              style={commonInputStyle}
              value={invoice.meta.date}
              onChange={(e) => setInvoiceField("meta.date", e.target.value)}
            />
          </div>
          <div>
            <label>Type</label>
            <select
              style={commonInputStyle}
              value={invoice.meta.type}
              onChange={(e) => setInvoiceField("meta.type", e.target.value)}
            >
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
            </select>
          </div>
        </div>
      </section>

      <hr />

      {/* 3. Customer Details */}
      <section>
        <h2>Customer Details</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label>Customer Name</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.customer.name}
              onChange={(e) => setInvoiceField("customer.name", e.target.value)}
            />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label>Mobile</label>
              <input
                type="text"
                style={commonInputStyle}
                value={invoice.customer.fields?.phone || ""}
                onChange={(e) => setInvoiceField("customer.fields.phone", e.target.value)}
              />
            </div>
            <div>
              <label>Aadhaar</label>
              <input
                type="text"
                style={commonInputStyle}
                value={invoice.customer.fields?.aadhaar || ""}
                onChange={(e) => setInvoiceField("customer.fields.aadhaar", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label>Customer Address</label>
            <textarea
              style={commonInputStyle}
              rows={3}
              value={invoice.customer.address}
              onChange={(e) => setInvoiceField("customer.address", e.target.value)}
            />
          </div>
        </div>
      </section>

      <hr />

      {/* 4. Items List */}
      <section>
        <h2>Items</h2>
        
        {/* Desktop Table View */}
        <div className="desktop-items">
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc" }}>
                <th style={{ padding: "8px" }}>Description</th>
                <th style={{ padding: "8px" }}>Qty</th>
                <th style={{ padding: "8px" }}>Price</th>
                <th style={{ padding: "8px" }}>Total</th>
                <th style={{ padding: "8px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      placeholder="Item description"
                      style={{ ...commonInputStyle, minWidth: "200px" }}
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="number"
                      style={{ ...commonInputStyle, width: "70px" }}
                      value={item.quantity}
                      onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="number"
                      style={{ ...commonInputStyle, width: "100px" }}
                      value={item.unitPrice}
                      onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>{formatINR(item.total)}</td>
                  <td style={{ padding: "8px" }}>
                    <button 
                      onClick={() => removeItem(index)} 
                      disabled={invoice.items.length <= 1}
                      style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="mobile-items">
          {invoice.items.map((item, index) => (
            <div key={item.id} className="item-card">
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", color: "#666" }}>Description</label>
                <input
                  type="text"
                  style={commonInputStyle}
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                />
              </div>
              <div className="row">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", color: "#666" }}>Qty</label>
                  <input
                    type="number"
                    style={commonInputStyle}
                    value={item.quantity}
                    onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: "12px", color: "#666" }}>Price</label>
                  <input
                    type="number"
                    style={commonInputStyle}
                    value={item.unitPrice}
                    onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: "bold", color: "#333" }}>
                  Total: {formatINR(item.total)}
                </div>
                <button 
                  onClick={() => removeItem(index)} 
                  disabled={invoice.items.length <= 1}
                  style={{ color: "red", border: "1px solid red", borderRadius: "4px", padding: "4px 8px", background: "white" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: "1rem", 
          position: "sticky", 
          bottom: "20px",
          display: "flex",
          justifyContent: "flex-start",
          zIndex: 10
        }}>
          <button 
            onClick={addItem} 
            disabled={invoice.items.length >= 15}
            style={{ 
              padding: "10px 20px", 
              borderRadius: "8px", 
              backgroundColor: "#444", 
              color: "white", 
              border: "none", 
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          >
            + Add Item {invoice.items.length >= 15 ? "(Limit Reached)" : ""}
          </button>
        </div>

        {/* Totals Section */}
        <div style={{ 
          marginTop: "20px", 
          padding: "20px", 
          backgroundColor: "#fefefe", 
          border: "1px solid #eee", 
          borderRadius: "8px",
          display: "flex", 
          flexDirection: "column", 
          alignItems: "flex-end", 
          gap: "0.5rem" 
        }}>
          <div style={{ fontSize: "14px", color: "#666" }}>Subtotal: {formatINR(invoice.totals.subTotal)}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>SGST (9%): {formatINR(invoice.totals.sgst)}</div>
          <div style={{ fontSize: "14px", color: "#666" }}>CGST (9%): {formatINR(invoice.totals.cgst)}</div>
          <div style={{ 
            fontWeight: "bold", 
            fontSize: "18px", 
            marginTop: "10px", 
            paddingTop: "10px", 
            borderTop: "1px solid #ccc",
            width: "100%",
            textAlign: "right"
          }}>
            Grand Total: {formatINR(invoice.totals.grandTotal)}
          </div>
        </div>
      </section>

      <hr />

      {/* 5. Bank Details */}
      <section>
        <h2>Bank Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label>Bank Name</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.bank.bankName}
              onChange={(e) => setInvoiceField("bank.bankName", e.target.value)}
            />
          </div>
          <div>
            <label>Account Name</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.bank.accountName}
              onChange={(e) => setInvoiceField("bank.accountName", e.target.value)}
            />
          </div>
          <div>
            <label>Account Number</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.bank.accountNumber}
              onChange={(e) => setInvoiceField("bank.accountNumber", e.target.value)}
            />
          </div>
          <div>
            <label>IFSC Code</label>
            <input
              type="text"
              style={commonInputStyle}
              value={invoice.bank.ifsc}
              onChange={(e) => setInvoiceField("bank.ifsc", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Signature Section */}
      <section style={{ marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Authorized Signatory</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Method 1: Draw Signature</label>
            <SignaturePad 
              initialValue={invoice.signature}
              onSave={(dataURL) => setInvoiceField("signature", dataURL)}
              onClear={() => setInvoiceField("signature", "")}
            />
          </div>
          
          <div style={{ padding: "1rem", border: "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#fafafa" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Method 2: Upload Signature Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleSignatureUpload}
              style={{ fontSize: "14px" }}
            />
            <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>
              Upload a clear PNG/JPG with a white or transparent background.
            </p>
          </div>
        </div>
      </section>

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

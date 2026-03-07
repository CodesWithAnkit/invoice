"use client";

import { useInvoice } from "@/hooks/useInvoice";
import { generateInvoicePDF } from "@/lib/pdf/pdfGenerator";
import { formatINR } from "@/utils/formatCurrency";

export default function InvoiceForm() {
  const {
    invoice,
    setInvoiceField,
    addItem,
    removeItem,
    updateItem,
    generateInvoice,
  } = useInvoice();

  const handleNumberChange = (index: number, field: "quantity" | "unitPrice", value: string) => {
    const parsed = parseFloat(value);
    updateItem(index, field, isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      {/* 1. Invoice Meta */}
      <section>
        <h2>Invoice Meta</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label>Invoice Number</label>
            <br />
            <input
              type="text"
              value={invoice.meta.invoiceNumber}
              onChange={(e) => setInvoiceField("meta.invoiceNumber", e.target.value)}
            />
          </div>
          <div>
            <label>Date</label>
            <br />
            <input
              type="date"
              value={invoice.meta.date}
              onChange={(e) => setInvoiceField("meta.date", e.target.value)}
            />
          </div>
          <div>
            <label>Type</label>
            <br />
            <select
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

      {/* 2. Customer Details */}
      <section>
        <h2>Customer Details</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label>Customer Name</label>
            <br />
            <input
              type="text"
              style={{ width: "100%" }}
              value={invoice.customer.name}
              onChange={(e) => setInvoiceField("customer.name", e.target.value)}
            />
          </div>
          <div>
            <label>Customer Address</label>
            <br />
            <textarea
              style={{ width: "100%" }}
              rows={3}
              value={invoice.customer.address}
              onChange={(e) => setInvoiceField("customer.address", e.target.value)}
            />
          </div>
        </div>
      </section>

      <hr />

      {/* 3. Items Table */}
      <section>
        <h2>Items Table</h2>
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>
                  <input
                    type="text"
                    style={{ width: "100%" }}
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                  />
                </td>
                <td>{formatINR(item.total)}</td>
                <td>
                  <button onClick={() => removeItem(index)} disabled={invoice.items.length <= 1}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={addItem} disabled={invoice.items.length >= 15}>
            Add Item {invoice.items.length >= 15 ? "(Limit Reached)" : ""}
          </button>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          <div>Subtotal: {formatINR(invoice.totals.subTotal)}</div>
          <div>SGST (9%): {formatINR(invoice.totals.sgst)}</div>
          <div>CGST (9%): {formatINR(invoice.totals.cgst)}</div>
          <div style={{ fontWeight: "bold" }}>Grand Total: {formatINR(invoice.totals.grandTotal)}</div>
        </div>
      </section>

      <hr />

      {/* 4. Bank Details */}
      <section>
        <h2>Bank Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label>Bank Name</label>
            <br />
            <input
              type="text"
              style={{ width: "100%" }}
              value={invoice.bank.bankName}
              onChange={(e) => setInvoiceField("bank.bankName", e.target.value)}
            />
          </div>
          <div>
            <label>Account Name</label>
            <br />
            <input
              type="text"
              style={{ width: "100%" }}
              value={invoice.bank.accountName}
              onChange={(e) => setInvoiceField("bank.accountName", e.target.value)}
            />
          </div>
          <div>
            <label>Account Number</label>
            <br />
            <input
              type="text"
              style={{ width: "100%" }}
              value={invoice.bank.accountNumber}
              onChange={(e) => setInvoiceField("bank.accountNumber", e.target.value)}
            />
          </div>
          <div>
            <label>IFSC Code</label>
            <br />
            <input
              type="text"
              style={{ width: "100%" }}
              value={invoice.bank.ifsc}
              onChange={(e) => setInvoiceField("bank.ifsc", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button 
            onClick={generateInvoice}
            style={{ padding: "1rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
        >
          Finalize Data
        </button>
        <button 
            onClick={() => generateInvoicePDF(invoice.meta.invoiceNumber)}
            style={{ padding: "1rem 2rem", fontSize: "1.2rem", cursor: "pointer", backgroundColor: "#0070f3", color: "white", border: "none" }}
        >
          Download PDF
        </button>
      </div>
      
      {invoice.amountWords && (
        <div style={{ fontStyle: "italic", color: "#555" }}>
          Amount in words: {invoice.amountWords}
        </div>
      )}
    </div>
  );
}

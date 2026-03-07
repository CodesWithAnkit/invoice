"use client";

import { useInvoice } from "@/hooks/useInvoice";

export default function InvoiceForm() {
  const {
    invoice,
    setInvoiceField,
    addItem,
    removeItem,
    updateItem,
    generateInvoice,
  } = useInvoice();

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
              <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
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
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                  />
                </td>
                <td>{item.total.toFixed(2)}</td>
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
          <button onClick={addItem}>Add Item</button>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          <div>Subtotal: {invoice.totals.subTotal.toFixed(2)}</div>
          <div>SGST (9%): {invoice.totals.sgst.toFixed(2)}</div>
          <div>CGST (9%): {invoice.totals.cgst.toFixed(2)}</div>
          <div style={{ fontWeight: "bold" }}>Grand Total: {invoice.totals.grandTotal.toFixed(2)}</div>
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

      <div style={{ marginTop: "2rem" }}>
        <button 
            onClick={generateInvoice}
            style={{ padding: "1rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
        >
          Generate Invoice / Finalize
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

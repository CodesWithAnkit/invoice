"use client";

import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";

export default function InvoicePrintLayout() {
  const { invoice } = useInvoice();
  const { meta, customer, items, totals, bank, amountWords } = invoice;
  const sortedItems = [...items].sort((a, b) => b.total - a.total);

  return (
    <div id="invoice-print-root">
      <div className="invoice-print-page">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#b30000", marginBottom: "2px" }}>
              {invoice.businessName}
            </div>
            <div style={{ whiteSpace: "pre-line", fontSize: "0.8rem", color: "#444", lineHeight: "1.2" }}>
              {invoice.businessAddress}
            </div>
            {invoice.phone && <div style={{ fontSize: "0.8rem", marginTop: "2px" }}><b>Phone:</b> {invoice.phone}</div>}
            {invoice.gstin && <div style={{ fontSize: "0.8rem" }}><b>GSTIN:</b> {invoice.gstin}</div>}
          </div>
          <div style={{ textAlign: "right", flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#333", textTransform: "uppercase" }}>
              {meta.type === "invoice" ? "TAX INVOICE" : "PRICE QUOTE"}
            </h1>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", border: "1px solid #333", padding: "8px", backgroundColor: "#fafafa" }}>
          <div style={{ flex: 1.2, borderRight: "1px solid #ddd", paddingRight: "10px" }}>
            <div style={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: "2px" }}>Billed To</div>
            <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{customer.name}</div>
            <div style={{ whiteSpace: "pre-line", fontSize: "0.8rem", marginTop: "2px" }}>{customer.address}</div>
            {Object.entries(customer.fields || {}).map(([label, value]) => (
              <div key={label} style={{ fontSize: "0.8rem" }}>
                <b>{label}:</b> {String(value)}
              </div>
            ))}
          </div>
          <div style={{ flex: 0.8, paddingLeft: "10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.8rem" }}>
              <div style={{ color: "#666", fontWeight: "600" }}>{meta.type === "invoice" ? "Invoice #" : "Quote #"}</div>
              <div style={{ fontWeight: "bold" }}>{meta.invoiceNumber}</div>
              <div style={{ color: "#666", fontWeight: "600" }}>Date:</div>
              <div style={{ fontWeight: "bold" }}>{meta.date}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="invoice-items-table" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #333", marginBottom: "0" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ padding: "8px", border: "1px solid #333", textAlign: "left", fontSize: "0.85rem" }}>Description</th>
              <th style={{ padding: "8px", border: "1px solid #333", textAlign: "center", width: "80px", fontSize: "0.85rem" }}>Qty</th>
              <th style={{ padding: "8px", border: "1px solid #333", textAlign: "right", width: "100px", fontSize: "0.85rem" }}>Unit Price</th>
              <th style={{ padding: "8px", border: "1px solid #333", textAlign: "right", width: "120px", fontSize: "0.85rem" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: "8px", border: "1px solid #333", fontSize: "0.8rem" }}>
                  <b>{item.description}</b>
                </td>
                <td style={{ padding: "8px", border: "1px solid #333", textAlign: "center", fontSize: "0.8rem" }}>{item.quantity}</td>
                <td style={{ padding: "8px", border: "1px solid #333", textAlign: "right", fontSize: "0.8rem" }}>{formatINR(item.unitPrice)}</td>
                <td style={{ padding: "8px", border: "1px solid #333", textAlign: "right", fontSize: "0.8rem", fontWeight: "bold" }}>{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: "flex", border: "1px solid #333", borderTop: "none" }} className="invoice-footer">
          <div style={{ flex: 1.4, padding: "8px", borderRight: "1px solid #333", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ fontSize: "0.7rem", color: "#666", fontWeight: "bold", textTransform: "uppercase", marginBottom: "2px" }}>Amount in Words</div>
            <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#333", textTransform: "uppercase" }}>{amountWords}</div>
          </div>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", fontSize: "0.8rem" }}>Sub Total</td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", textAlign: "right", fontWeight: "bold", fontSize: "0.8rem" }}>{formatINR(totals.subTotal)}</td>
                </tr>
                {(totals.sgst > 0) && (
                  <tr>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", fontSize: "0.75rem" }}>SGST ({(invoice.taxPercent || 18)/2}%)</td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", textAlign: "right", fontSize: "0.75rem" }}>{formatINR(totals.sgst)}</td>
                  </tr>
                )}
                {(totals.cgst > 0) && (
                  <tr>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", fontSize: "0.75rem" }}>CGST ({(invoice.taxPercent || 18)/2}%)</td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", textAlign: "right", fontSize: "0.75rem" }}>{formatINR(totals.cgst)}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <td style={{ padding: "8px", fontWeight: "bold", fontSize: "0.95rem" }}>Grand Total</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", fontSize: "1.05rem", color: "#b30000" }}>{formatINR(totals.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Footer */}
        <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between" }} className="invoice-footer">
          <div style={{ flex: 1.5 }}>
            {bank.bankName && (
              <div style={{ marginBottom: "8px" }}>
                <div style={{ fontWeight: "bold", fontSize: "0.75rem", color: "#555", textTransform: "uppercase", marginBottom: "2px" }}>Bank Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "100px auto", gap: "1px", fontSize: "0.75rem" }}>
                  <span>Bank:</span> <b>{bank.bankName}</b>
                  <span>A/C Name:</span> <b>{bank.accountName}</b>
                  <span>A/C No:</span> <b>{bank.accountNumber}</b>
                  <span>IFSC:</span> <b>{bank.ifsc}</b>
                </div>
              </div>
            )}
            <div style={{ fontSize: "0.7rem", color: "#666", lineHeight: "1.3" }}>
              <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#444" }}>Terms & Conditions</div>
              <div>1. Goods once sold will not be taken back.</div>
              <div>2. Subject to local jurisdiction.</div>
              <div>3. Finance charges applicable for delayed payments.</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
            <div style={{ textAlign: "center", width: "100%" }}>
              {invoice.signature && (
                <img src={invoice.signature} alt="Signature" style={{ maxHeight: "40px", maxWidth: "150px", marginBottom: "2px" }} />
              )}
              <div style={{ borderTop: "2px solid #333", paddingTop: "3px", fontWeight: "bold", fontSize: "0.8rem" }}>Authorized Signatory</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px", fontStyle: "italic", color: "#b30000", fontWeight: "bold", fontSize: "0.85rem" }}>
          Thank you for choosing {invoice.businessName}!
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";

export default function InvoiceTemplate() {
  const { invoice } = useInvoice();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { meta, customer, items, totals, bank, amountWords } = invoice;

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `invoice-${meta.invoiceNumber || "draft"}`,
  });

  const sortedItems = [...items].sort((a, b) => b.total - a.total);

  const rowStyle: React.CSSProperties = {
    borderBottom: "1px solid #eee",
  };

  const cellStyle: React.CSSProperties = {
    padding: "8px",
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#f0f0f0" }}>
      <div
        ref={invoiceRef}
        id="invoice-root"
        style={{
          width: "190mm",
          minHeight: "297mm",
          padding: "10mm",
          margin: "0 auto",
          border: "1px solid #ddd",
          backgroundColor: "white",
          color: "#333",
          fontFamily: "sans-serif",
          lineHeight: "1.5",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
          <div style={{ fontSize: "0.9rem" }}>
            <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "5px" }}>{invoice.businessName}</div>
            <div>Phone: {invoice.phone}</div>
            <div>GSTIN: {invoice.gstin}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: "2rem", color: "#444" }}>
              {meta.type === "invoice" ? "BILL INVOICE" : "PRICE QUOTE"}
            </h1>
          </div>
        </div>

        {/* Customer & Meta Section */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.8rem", color: "#777" }}>Bill To:</div>
            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{customer.name}</div>
            {Object.entries(customer.fields || {}).map(([label, value]) => (
              <div key={label}>
                <span style={{ fontWeight: "bold", textTransform: "capitalize" }}>{label}:</span> {value}
              </div>
            ))}
            <div style={{ whiteSpace: "pre-line" }}>{customer.address}</div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "0.9rem" }}>
              <div style={{ fontWeight: "bold", color: "#777" }}>Date:</div>
              <div>{meta.date}</div>
              <div style={{ fontWeight: "bold", color: "#777" }}>Invoice #:</div>
              <div>{meta.invoiceNumber}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9f9f9", borderBottom: "2px solid #333" }}>
              <th style={{ ...cellStyle, textAlign: "left", width: "50%" }}>Item Description</th>
              <th style={{ ...cellStyle, textAlign: "center" }}>Quantity</th>
              <th style={{ ...cellStyle, textAlign: "right" }}>Unit Price</th>
              <th style={{ ...cellStyle, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.id} style={rowStyle}>
                <td style={cellStyle}>{item.description}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>{item.quantity}</td>
                <td style={{ ...cellStyle, textAlign: "right" }}>{formatINR(item.unitPrice)}</td>
                <td style={{ ...cellStyle, textAlign: "right" }}>{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} rowSpan={4} style={{ border: "none" }}></td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold" }}>Sub Total</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatINR(totals.subTotal)}</td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, textAlign: "right" }}>SGST 9%</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatINR(totals.sgst)}</td>
            </tr>
            <tr>
              <td style={{ ...cellStyle, textAlign: "right" }}>CGST 9%</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{formatINR(totals.cgst)}</td>
            </tr>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", fontSize: "1.1rem" }}>Grand Total</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", fontSize: "1.1rem" }}>{formatINR(totals.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div style={{ marginBottom: "30px", fontSize: "0.9rem" }}>
          <span style={{ fontWeight: "bold" }}>Amount in words:</span> {amountWords}
        </div>

        {/* Bank Details */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
          <div style={{ fontSize: "0.85rem", border: "1px solid #eee", padding: "10px", borderRadius: "4px", flex: "0 1 300px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "5px", borderBottom: "1px solid #eee" }}>Bank Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2px" }}>
              <div style={{ color: "#777" }}>Bank Name:</div>
              <div style={{ fontWeight: "500" }}>{bank.bankName}</div>
              <div style={{ color: "#777" }}>Account Name:</div>
              <div style={{ fontWeight: "500" }}>{bank.accountName}</div>
              <div style={{ color: "#777" }}>Account Number:</div>
              <div style={{ fontWeight: "500" }}>{bank.accountNumber}</div>
              <div style={{ color: "#777" }}>IFSC:</div>
              <div style={{ fontWeight: "500" }}>{bank.ifsc}</div>
            </div>
          </div>
          <div style={{ textAlign: "center", alignSelf: "flex-end" }}>
            <div style={{ borderTop: "1px solid #333", paddingTop: "5px", width: "150px", fontSize: "0.9rem" }}>
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div style={{ fontSize: "0.75rem", color: "#888" }}>
          <div style={{ fontWeight: "bold", marginBottom: "3px" }}>Terms and Conditions:</div>
          <div>1. Customer will be billed after indicating acceptance of this bill.</div>
          <div>2. Payment will be due prior to delivery of service and goods.</div>
        </div>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => handlePrint()}
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

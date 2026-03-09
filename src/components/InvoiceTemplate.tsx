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
    onAfterPrint: () => {
      console.log("PDF generated");
    },
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
      <div style={{ width: "100%", overflowX: "auto" }}>
        <div style={{ transform: "scale(0.9)", transformOrigin: "top left" }}>
          <div
            ref={invoiceRef}
            id="invoice-root"
            style={{
              width: "190mm",
              height: "297mm",
              padding: "10mm",
              margin: "0 auto",
              backgroundColor: "white",
              color: "#333",
              fontFamily: "sans-serif",
              lineHeight: "1.5",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Top Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
              <div style={{ fontSize: "0.9rem" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "5px" }}>{invoice.businessName}</div>
                <div style={{ whiteSpace: "pre-line", marginBottom: "5px" }}>{invoice.businessAddress}</div>
                <div>Phone: {invoice.phone}</div>
                <div>GSTIN: {invoice.gstin}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h1 style={{ margin: 0, fontSize: "2rem", color: "#444" }}>
                  {meta.type === "invoice" ? "BILL INVOICE" : "PRICE QUOTATION"}
                </h1>
              </div>
            </div>

            {/* Customer & Meta Section */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.8rem", color: "#777" }}>
                  {meta.type === "invoice" ? "Bill To:" : "Customer Information:"}
                </div>
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
                  <div style={{ fontWeight: "bold", color: "#777" }}>
                    {meta.type === "invoice" ? "Invoice #:" : "Quotation #:"}
                  </div>
                  <div>{meta.invoiceNumber}</div>
                  {/* {meta.type === "quote" && (
                    <>
                      <div style={{ fontWeight: "bold", color: "#777" }}>Valid Until:</div>
                      <div>
                        {new Date(new Date(meta.date || Date.now()).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </>
                  )} */}
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
                  <td style={{ ...cellStyle, textAlign: "right" }}>SGST {(invoice.taxPercent ?? 18) / 2}%</td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>{formatINR(totals.sgst)}</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, textAlign: "right" }}>CGST {(invoice.taxPercent ?? 18) / 2}%</td>
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
                {invoice.signature && (
                  <img
                    src={invoice.signature}
                    alt="Signature"
                    style={{ height: "60px", marginBottom: "5px", display: "block", margin: "0 auto" }}
                  />
                )}
                <div style={{ borderTop: "1px solid #333", paddingTop: "5px", width: "150px", fontSize: "0.9rem" }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

             {/* Terms and Conditions */}
            <div style={{ fontSize: "0.75rem", color: "#888" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px" }}>Terms and Conditions:</div>
              {meta.type === "invoice" ? (
                <>
                  <div>1. Customer will be billed after indicating acceptance of this bill.</div>
                  <div>2. Payment will be due prior to delivery of service and goods.</div>
                </>
              ) : (
                <>
                  <div>1. This quotation is for informational purposes and is not a binding contract.</div>
                  <div>2. Prices are subject to change based on market conditions and availability.</div>
                  <div>3. Validity is 15 days from the date of issue.</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => {
            setTimeout(() => handlePrint(), 100);
          }}
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            margin: "0px auto 50px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";

const TotalsSection = ({ totals, taxPercent, amountWords }: { totals: any, taxPercent?: number, amountWords?: string }) => (
  <div style={{ display: "flex", border: "1px solid #333", borderTop: "none" }}>
    <div style={{ flex: 1.4, padding: "8px 10px", fontSize: "0.85rem", borderRight: "1px solid #333", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ marginBottom: "2px" }}>
        <span style={{ fontWeight: "bold" }}>Amount in Words:</span>
      </div>
      <div style={{ textTransform: "uppercase", fontSize: "0.8rem", fontWeight: "500", color: "#444", lineHeight: "1.2" }}>
        {amountWords || "Zero Rupees Only"}
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <tbody>
          <tr>
            <td style={{ padding: "4px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>Sub Total</td>
            <td style={{ padding: "4px 10px", textAlign: "right", borderBottom: "1px solid #333", fontWeight: "600" }}>{formatINR(totals.subTotal)}</td>
          </tr>
          {(totals.sgst > 0 || totals.cgst > 0) && (
            <>
              <tr>
                <td style={{ padding: "4px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>SGST ({(taxPercent ?? 18) / 2}%)</td>
                <td style={{ padding: "4px 10px", textAlign: "right", borderBottom: "1px solid #333" }}>{formatINR(totals.sgst)}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>CGST ({(taxPercent ?? 18) / 2}%)</td>
                <td style={{ padding: "4px 10px", textAlign: "right", borderBottom: "1px solid #333" }}>{formatINR(totals.cgst)}</td>
              </tr>
            </>
          )}
          <tr>
            <td style={{ padding: "8px 10px", fontWeight: "bold", textAlign: "left", fontSize: "1rem", whiteSpace: "nowrap" }}>Grand Total</td>
            <td style={{ padding: "8px 10px", fontWeight: "bold", textAlign: "right", fontSize: "1.1rem", color: "#000" }}>
              {formatINR(totals.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

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

  const cellStyle: React.CSSProperties = {
    padding: "8px",
    borderLeft: "1px solid #333",
    borderRight: "1px solid #333",
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: "#f2f2f2",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
    fontWeight: "bold",
  };

  return (
    <div style={{ padding: "10px", backgroundColor: "#f0f0f0" }}>
      <div style={{ width: "100%", overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ minWidth: "210mm", display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <div
            ref={invoiceRef}
            id="invoice-root"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "10mm",
              backgroundColor: "white",
              color: "#333",
              fontFamily: "sans-serif",
              lineHeight: "1.4",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            {/* 1. Header Section (Fixed at Top) */}
            <div style={{ flexShrink: 0, paddingBottom: "2px", marginBottom: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#b30000", marginBottom: "1px" }}>
                    {invoice.businessName}
                  </div>
                  <div style={{ whiteSpace: "pre-line", fontSize: "0.75rem", marginBottom: "1px", fontWeight: "500", color: "#555", lineHeight: "1.2" }}>
                    {invoice.businessAddress}
                  </div>
                  {invoice.phone && <div style={{ fontSize: "0.75rem", color: "#555" }}><b>Phone:</b> {invoice.phone}</div>}
                  {invoice.gstin && <div style={{ fontSize: "0.75rem", color: "#555" }}><b>GSTIN:</b> {invoice.gstin}</div>}
                </div>
                <div style={{ textAlign: "right", flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#333", textTransform: "uppercase" }}>
                    {meta.type === "invoice" ? "TAX INVOICE" : "PRICE QUOTE"}
                  </h1>
                </div>
              </div>

              {/* Customer and Document Meta */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", padding: "6px", border: "1px solid #333", backgroundColor: "#fdfdfd" }}>
                <div style={{ flex: 1, borderRight: "1px solid #ccc", paddingRight: "12px" }}>
                  <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "0.7rem", color: "#777", marginBottom: "2px" }}>
                    Customer Details
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "1rem", color: "#000" }}>{customer.name}</div>
                  <div style={{ whiteSpace: "pre-line", fontSize: "0.85rem", marginTop: "1px", lineHeight: "1.2" }}>{customer.address}</div>
                  {Object.entries(customer.fields || {}).map(([label, value]) => (
                    <div key={label} style={{ fontSize: "0.85rem", marginTop: "1px" }}>
                      <span style={{ fontWeight: "bold", textTransform: "capitalize" }}>{label}:</span> {String(value)}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 0.8, paddingLeft: "12px", alignSelf: "center" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "4px", fontSize: "0.85rem" }}>
                    <div style={{ fontWeight: "bold", color: "#555" }}>{meta.type === "invoice" ? "Invoice No:" : "Quote No:"}</div>
                    <div style={{ fontWeight: "bold" }}>{meta.invoiceNumber}</div>
                    <div style={{ fontWeight: "bold", color: "#555" }}>Date:</div>
                    <div style={{ fontWeight: "bold" }}>{meta.date}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Items Table Section */}
            <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #333" }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCellStyle, textAlign: "left", width: "45%" }}>Item Description</th>
                    <th style={{ ...headerCellStyle, textAlign: "center", width: "12%" }}>Quantity</th>
                    <th style={{ ...headerCellStyle, textAlign: "right", width: "18%" }}>Unit Price</th>
                    <th style={{ ...headerCellStyle, textAlign: "right", width: "25%" }}>Total</th>
                  </tr>
                </thead>
                <tbody style={{ verticalAlign: "top" }}>
                    {sortedItems.map((item, index) => (
                      <tr key={item.id} style={{ minHeight: "24px" }}>
                        <td style={{ ...cellStyle, borderBottom: "1px solid #333", fontSize: "0.85rem", padding: "4px 8px" }}>
                          <div style={{ fontWeight: "bold" }}>{item.description}</div>
                        </td>
                        <td style={{ ...cellStyle, borderBottom: "1px solid #333", textAlign: "center", fontSize: "0.85rem", padding: "4px 8px" }}>{item.quantity}</td>
                        <td style={{ ...cellStyle, borderBottom: "1px solid #333", textAlign: "right", fontSize: "0.85rem", padding: "4px 8px" }}>{formatINR(item.unitPrice)}</td>
                        <td style={{ ...cellStyle, borderBottom: "1px solid #333", textAlign: "right", fontSize: "0.85rem", padding: "4px 8px", fontWeight: "500" }}>{formatINR(item.total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              <TotalsSection totals={totals} taxPercent={invoice.taxPercent} amountWords={amountWords} />
            </div>

            {/* spacer to push footer to bottom */}
            <div style={{ flexGrow: 1, minHeight: "10px" }}></div>

            {/* 3. Footer Section (Pinned at Bottom) */}
            <div style={{ flexShrink: 0, marginTop: "10px" }}>
               {/* Bank Details & Terms & Signature */}
              <div style={{ borderTop: "2px solid #333", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1.5, paddingRight: "30px" }}>
                   {bank.bankName && (
                     <div style={{ marginBottom: "10px", fontSize: "0.8rem" }}>
                       <div style={{ fontWeight: "bold", marginBottom: "2px", fontSize: "0.85rem", color: "#333" }}>Bank Details</div>
                       <div style={{ display: "grid", gridTemplateColumns: "100px auto", gap: "1px", color: "#444" }}>
                         <div style={{ fontWeight: "600" }}>Bank Name:</div><div>{bank.bankName}</div>
                         <div style={{ fontWeight: "600" }}>Account Name:</div><div>{bank.accountName}</div>
                         <div style={{ fontWeight: "600" }}>Account No:</div><div>{bank.accountNumber}</div>
                         <div style={{ fontWeight: "600" }}>IFSC Code:</div><div>{bank.ifsc}</div>
                       </div>
                     </div>
                   )}
                   <div style={{ fontSize: "0.75rem", color: "#555" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "2px", color: "#333" }}>Terms & Conditions:</div>
                      <>
                        <div>1.Customer will be billed after indicating acceptance of this quote.</div>
                        <div>2. Payment will be due prior to delivery of service and goods.</div>
                       </>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                  <div style={{ width: "100%", textAlign: "center", position: "relative" }}>
                    {invoice.signature ? (
                      <img
                        src={invoice.signature}
                        alt="Signature"
                        style={{ height: "45px", maxWidth: "150px", objectFit: "contain", marginBottom: "-8px" }}
                      />
                    ) : (
                      <div style={{ height: "45px" }}></div>
                    )}
                    <div style={{ borderTop: "1px solid #333", paddingTop: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>
                       Authorized Signature
                    </div>
                  </div>
                </div>
              </div>

              {/* Thank you message */}
              <div style={{ textAlign: "center", marginTop: "15px", fontSize: "0.9rem", fontWeight: "bold", color: "#b30000", fontStyle: "italic" }}>
                Thank you for your business!
              </div>

            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }} className="no-print">
        <button
          onClick={() => {
            handlePrint();
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
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          Download PDF Document
        </button>
      </div>
    </div>
  );
}

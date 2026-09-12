"use client";

import React from "react";
import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";
import { getDocumentTitle } from "@/utils/documentType";

export default function InvoicePrintLayout() {
  const { invoice } = useInvoice();
  const { meta, customer, items, totals, bank, amountWords, fields } = invoice;
  const sortedItems = [...items].sort((a, b) => b.total - a.total);

  return (
    <div id="invoice-print-root">
      <div className="invoice-print-page">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            {invoice.businessName && (
              <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#b30000", marginBottom: "2px" }}>
                {invoice.businessName}
              </div>
            )}
            {invoice.businessAddress && (
              <div style={{ whiteSpace: "pre-line", fontSize: "0.8rem", color: "#444", lineHeight: "1.2" }}>
                {invoice.businessAddress}
              </div>
            )}
            {invoice.phone && <div style={{ fontSize: "0.8rem", marginTop: "2px" }}><b>Phone:</b> {invoice.phone}</div>}
            {invoice.gstin && <div style={{ fontSize: "0.8rem" }}><b>GSTIN:</b> {invoice.gstin}</div>}

            {/* Business Dynamic Fields */}
            {Object.entries(fields || {}).map(([label, value]) => (
              <div key={label} style={{ fontSize: "0.8rem" }}>
                <b style={{ textTransform: "capitalize" }}>{label}:</b> {String(value)}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", flex: 1 }}>
            {meta.type && (
              <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#333", textTransform: "uppercase" }}>
                {getDocumentTitle(meta.type)}
              </h1>
            )}
            {meta.type === "proforma" && meta.invoiceNumber && (
              <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#555", marginTop: "2px" }}>
                This is not a tax invoice only proforma invoice
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", border: "1px solid #333", padding: "8px", backgroundColor: "#fafafa" }}>
          <div style={{ flex: 1.2, borderRight: "1px solid #ddd", paddingRight: "10px" }}>
            <div style={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: "2px" }}>Billed To</div>
            <div style={{ fontWeight: "bold", fontSize: "1rem", textTransform: "uppercase" }}>
              {customer.fields?.companyName && customer.name ? (
                <>
                  {customer.fields.companyName}{" "}
                  <span style={{ fontWeight: "normal", textTransform: "lowercase" }}>prop.</span>{" "}
                  {customer.name}
                </>
              ) : (
                customer.fields?.companyName || customer.name
              )}
            </div>
            {customer.address && <div style={{ whiteSpace: "pre-line", fontSize: "0.8rem", marginTop: "2px" }}>{customer.address}</div>}
            {Object.entries(customer.fields || {})
              .filter(([label]) => label.toLowerCase() !== "companyname")
              .map(([label, value]) => (
                <div key={label} style={{ fontSize: "0.8rem" }}>
                  <b style={{ textTransform: "capitalize" }}>{label}:</b> {String(value)}
                </div>
              ))}
          </div>
          <div style={{ flex: 0.8, paddingLeft: "10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.8rem" }}>
              {meta.invoiceNumber && meta.type !== "proforma" && (
                <>
                  <div style={{ color: "#666", fontWeight: "600" }}>
                    {meta.type === "invoice" ? "Invoice #" : "Quote #"}
                  </div>
                  <div style={{ fontWeight: "bold" }}>{meta.invoiceNumber}</div>
                </>
              )}
              {meta.date && meta.type !== "proforma" && (
                <>
                  <div style={{ color: "#666", fontWeight: "600" }}>Date:</div>
                  <div style={{ fontWeight: "bold" }}>{meta.date}</div>
                </>
              )}

              {/* Meta Dynamic Fields */}
              {Object.entries(meta.fields || {}).map(([label, value]) => (
                <React.Fragment key={label}>
                  <div style={{ color: "#666", fontWeight: "600", textTransform: "capitalize" }}>{label}:</div>
                  <div style={{ fontWeight: "bold" }}>{String(value)}</div>
                </React.Fragment>
              ))}
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
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", fontSize: "0.75rem" }}>SGST ({(invoice.taxPercent || 18) / 2}%)</td>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", textAlign: "right", fontSize: "0.75rem" }}>{formatINR(totals.sgst)}</td>
                  </tr>
                )}
                {(totals.cgst > 0) && (
                  <tr>
                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", fontSize: "0.75rem" }}>CGST ({(invoice.taxPercent || 18) / 2}%)</td>
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
        <div style={{ marginTop: "15px" }} className="invoice-footer">

          {/* ── NON-PROFORMA footer ── */}
          {meta.type !== "proforma" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ flex: 1.5 }}>
                {(bank.bankName || bank.accountName || bank.accountNumber || bank.ifsc || Object.keys(bank.fields || {}).length > 0) && (
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.75rem", color: "#555", textTransform: "uppercase", marginBottom: "2px" }}>Bank Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "100px auto", gap: "1px", fontSize: "0.75rem" }}>
                      {bank.bankName && <><span style={{ color: "#666" }}>Bank:</span> <b>{bank.bankName}</b></>}
                      {bank.accountName && <><span style={{ color: "#666" }}>A/C Name:</span> <b>{bank.accountName}</b></>}
                      {bank.accountNumber && <><span style={{ color: "#666" }}>A/C No:</span> <b>{bank.accountNumber}</b></>}
                      {bank.ifsc && <><span style={{ color: "#666" }}>IFSC:</span> <b>{bank.ifsc}</b></>}
                      {Object.entries(bank.fields || {}).map(([label, value]) => (
                        <React.Fragment key={label}>
                          <span style={{ color: "#666", textTransform: "capitalize" }}>{label}:</span>
                          <b>{String(value)}</b>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: "0.7rem", color: "#666", lineHeight: "1.3" }}>
                  <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#444" }}>Terms &amp; Conditions</div>
                  <div>1. Goods once sold will not be taken back.</div>
                  <div>2. Subject to local jurisdiction.</div>
                  <div>3. Finance charges applicable for delayed payments.</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                <div style={{ textAlign: "center", width: "100%" }}>
                  {invoice.businessName && <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#333", marginBottom: invoice.signature ? "5px" : "40px" }}>For {invoice.businessName}</div>}
                  {invoice.signature && (
                    <img src={invoice.signature} alt="Signature" style={{ maxHeight: "80px", maxWidth: "200px", marginBottom: "5px", objectFit: "contain", margin: "0 auto" }} />
                  )}
                  <div style={{ borderTop: "2px solid #333", paddingTop: "3px", fontWeight: "bold", fontSize: "0.8rem", marginTop: invoice.signature ? "0" : "10px" }}>Proprietor / Authorized Signatory</div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFORMA footer ── */}
          {meta.type === "proforma" && (() => {
            const gt             = totals.grandTotal;
            const advance        = Math.round(gt * 0.30);
            const secondPayment  = Math.round(gt * 0.40);
            const beforeDispatch = Math.round(gt * 0.20);
            const afterInstall   = gt - advance - secondPayment - beforeDispatch;

            const boxStyle: React.CSSProperties = {
              border: "1px solid #d0d0d0",
              borderRadius: "4px",
              padding: "8px 10px",
              marginBottom: "6px",
              fontSize: "0.7rem",
            };
            const headingStyle: React.CSSProperties = {
              fontWeight: "bold",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              color: "#222",
              marginBottom: "6px",
              letterSpacing: "0.03em",
            };

            return (
              <>
                {/* T&C heading spanning full width */}
                <div style={{ fontWeight: "bold", fontSize: "0.75rem", textTransform: "uppercase", color: "#333", borderBottom: "1px solid #bbb", paddingBottom: "3px", marginBottom: "8px", letterSpacing: "0.04em" }}>
                  Terms &amp; Conditions
                </div>

                {/* Two-column boxes */}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>

                  {/* LEFT: Payment Terms + Bank Details stacked */}
                  <div style={{ flex: 1 }}>

                    {/* Payment Terms box */}
                    <div style={boxStyle}>
                      <div style={headingStyle}>Payment Terms</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "2px 10px", fontSize: "0.68rem" }}>
                        <span>Advance</span>
                        <span style={{ color: "#555" }}>30%</span>
                        <span style={{ textAlign: "right", fontFamily: "monospace" }}>{formatINR(advance)}</span>

                        <span>Second Payment</span>
                        <span style={{ color: "#555" }}>40%</span>
                        <span style={{ textAlign: "right", fontFamily: "monospace" }}>{formatINR(secondPayment)}</span>

                        <span>Before Dispatch</span>
                        <span style={{ color: "#555" }}>20%</span>
                        <span style={{ textAlign: "right", fontFamily: "monospace" }}>{formatINR(beforeDispatch)}</span>

                        <span>After Installation/Commissioning</span>
                        <span style={{ color: "#555" }}>10%</span>
                        <span style={{ textAlign: "right", fontFamily: "monospace" }}>{formatINR(afterInstall)}</span>
                      </div>
                      {gt > 0 && (
                        <div style={{ borderTop: "1px solid #ccc", marginTop: "5px", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "0.7rem" }}>
                          <span>Total</span>
                          <span style={{ fontFamily: "monospace" }}>{formatINR(gt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Bank Details box */}
                    {(bank.bankName || bank.accountName || bank.accountNumber || bank.ifsc || Object.keys(bank.fields || {}).length > 0) && (
                      <div style={boxStyle}>
                        <div style={headingStyle}>Bank Details</div>
                        <div style={{ display: "grid", gridTemplateColumns: "70px auto", gap: "2px 8px", fontSize: "0.68rem" }}>
                          {bank.bankName && <><span style={{ color: "#666" }}>Bank:</span> <b>{bank.bankName}</b></>}
                          {bank.accountName && <><span style={{ color: "#666" }}>A/C Name:</span> <b>{bank.accountName}</b></>}
                          {bank.accountNumber && <><span style={{ color: "#666" }}>A/C No:</span> <b>{bank.accountNumber}</b></>}
                          {bank.ifsc && <><span style={{ color: "#666" }}>IFSC:</span> <b>{bank.ifsc}</b></>}
                          {Object.entries(bank.fields || {}).map(([label, value]) => (
                            <React.Fragment key={label}>
                              <span style={{ color: "#666", textTransform: "capitalize" }}>{label}:</span>
                              <b>{String(value)}</b>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Delivery & Installation box */}
                  <div style={{ flex: 1 }}>
                    <div style={{ ...boxStyle, marginBottom: 0 }}>
                      <div style={headingStyle}>Delivery &amp; Installation</div>
                      {[
                        { n: 1, label: "Delivery:", text: "3–6 weeks from receipt of advance and order confirmation." },
                        { n: 2, label: "Installation:", text: "Included, subject to site readiness." },
                        { n: 3, label: "Trial Run & Operator Training:", text: "Included." },
                        { n: 4, label: "Warranty:", text: "6 months from installation, as per manufacturer\u2019s terms." },
                        { n: 5, label: "Transportation:", text: "As mutually agreed between buyer and seller." },
                        { n: 6, label: "Civil & Electrical Work:", text: "Beyond the supplied panel and site development is not included unless otherwise agreed." },
                      ].map(({ n, label, text }) => (
                        <div key={n} style={{ display: "flex", gap: "6px", marginBottom: "4px", fontSize: "0.68rem", alignItems: "flex-start" }}>
                          <span style={{ flexShrink: 0, fontWeight: "bold", background: "#e8edf5", borderRadius: "3px", padding: "0 4px", fontSize: "0.65rem", lineHeight: "1.5" }}>{n}</span>
                          <span><b>{label}</b> {text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom row: Thank you (left) + Signature (right) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px" }}>
                  <div style={{ fontStyle: "italic", color: "#b30000", fontWeight: "bold", fontSize: "0.85rem" }}>
                    Thank you for choosing {invoice.businessName || "us"}!
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {invoice.businessName && <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#333", marginBottom: invoice.signature ? "5px" : "35px" }}>For {invoice.businessName}</div>}
                    {invoice.signature && (
                      <img src={invoice.signature} alt="Signature" style={{ maxHeight: "60px", maxWidth: "160px", objectFit: "contain", marginBottom: "4px" }} />
                    )}
                    <div style={{ borderTop: "1.5px solid #333", paddingTop: "3px", fontWeight: "bold", fontSize: "0.78rem" }}>Proprietor / Authorized Signatory</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Non-proforma thank you + proforma disclaimer */}
        {meta.type !== "proforma" && (
          <div style={{ textAlign: "center", marginTop: "20px", fontStyle: "italic", color: "#b30000", fontWeight: "bold", fontSize: "0.85rem" }}>
            Thank you for choosing {invoice.businessName || "us"}!
          </div>
        )}

        {meta.type === "proforma" && (
          <div style={{ textAlign: "center", marginTop: "6px", fontStyle: "italic", color: "#666", fontSize: "0.7rem" }}>
            This document is a Proforma Invoice prepared from the uploaded Price Quote and is not a Tax Invoice.
          </div>
        )}

      </div>
    </div>
  );
}

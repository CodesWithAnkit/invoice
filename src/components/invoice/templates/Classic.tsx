"use client";

import React from "react";
import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";
import { getDocumentTitle } from "@/utils/documentType";

export default function ClassicTemplate() {
  const { invoice } = useInvoice();
  const { meta, customer, items, totals, bank, amountWords, fields } = invoice;
  const sortedItems = [...items].sort((a, b) => b.total - a.total);

  const isProforma = meta.type === "proforma";
  const taxHalf = (invoice.taxPercent ?? 18) / 2;

  const gt         = totals.grandTotal;
  const pmAdvance  = Math.round(gt * 0.30);
  const pmSecond   = Math.round(gt * 0.40);
  const pmDispatch = Math.round(gt * 0.20);
  const pmInstall  = gt - pmAdvance - pmSecond - pmDispatch;

  return (
    <div id="invoice-print-root">
      <div className="invoice-print-page" style={{ fontFamily: "Arial, sans-serif", color: "#222" }}>

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
            {Object.entries(fields || {}).map(([label, value]) => (
              <div key={label} style={{ fontSize: "0.8rem" }}>
                <b style={{ textTransform: "capitalize" }}>{label}:</b> {String(value)}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#333", textTransform: "uppercase" }}>
              {getDocumentTitle(meta.type)}
            </h1>
            {isProforma && meta.invoiceNumber && (
              <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#555", marginTop: "2px" }}>
                This is not a tax invoice — proforma only
              </div>
            )}
            {!isProforma && meta.invoiceNumber && (
              <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                <b>{meta.type === "invoice" ? "Invoice No:" : "Quote No:"}</b> {meta.invoiceNumber}
              </div>
            )}
            {!isProforma && meta.date && (
              <div style={{ fontSize: "0.8rem" }}><b>Date:</b> {meta.date}</div>
            )}
            {Object.entries(meta.fields || {}).map(([label, value]) => (
              <div key={label} style={{ fontSize: "0.8rem" }}>
                <b style={{ textTransform: "capitalize" }}>{label}:</b> {String(value)}
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", border: "1px solid #333", padding: "8px", backgroundColor: "#fafafa" }}>
          <div style={{ flex: 1.2, borderRight: "1px solid #ddd", paddingRight: "10px" }}>
            <div style={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: "2px" }}>Billed To</div>
            <div style={{ fontWeight: "bold", fontSize: "1rem", textTransform: "uppercase" }}>
              {customer.fields?.companyName && customer.name ? (
                <>{customer.fields.companyName} <span style={{ fontWeight: "normal" }}>prop.</span> {customer.name}</>
              ) : customer.fields?.companyName || customer.name}
            </div>
            {customer.address && (
              <div style={{ fontSize: "0.8rem", color: "#555", marginTop: "3px", whiteSpace: "pre-line" }}>{customer.address}</div>
            )}
            {Object.entries(customer.fields || {})
              .filter(([lbl]) => lbl.toLowerCase() !== "companyname")
              .map(([lbl, val]) => (
                <div key={lbl} style={{ fontSize: "0.8rem", color: "#555" }}>
                  <b style={{ textTransform: "capitalize" }}>{lbl}:</b>{" "}
                  {String(val) === "" ? "—" : String(val)}
                </div>
              ))}
          </div>
          {!isProforma && (
            <div style={{ flex: 0.8, paddingLeft: "10px" }}>
              <div style={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: "2px" }}>
                {meta.type === "invoice" ? "Invoice Info" : "Quote Info"}
              </div>
              {meta.invoiceNumber && (
                <div style={{ fontSize: "0.8rem" }}>
                  <b>{meta.type === "invoice" ? "Invoice #:" : "Quote #:"}</b> {meta.invoiceNumber}
                </div>
              )}
              {meta.date && <div style={{ fontSize: "0.8rem" }}><b>Date:</b> {meta.date}</div>}
            </div>
          )}
        </div>

        {/* Items Table */}
        <table className="invoice-items-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", marginBottom: "0" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0", borderTop: "2px solid #333", borderBottom: "2px solid #333" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", border: "1px solid #ccc" }}>Description</th>
              <th style={{ padding: "6px 8px", textAlign: "center", width: "50px", border: "1px solid #ccc" }}>Qty</th>
              <th style={{ padding: "6px 8px", textAlign: "right", width: "120px", border: "1px solid #ccc" }}>Unit Price</th>
              <th style={{ padding: "6px 8px", textAlign: "right", width: "120px", border: "1px solid #ccc" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #ddd", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "5px 8px", border: "1px solid #ddd" }}>{item.description}</td>
                <td style={{ padding: "5px 8px", textAlign: "center", border: "1px solid #ddd" }}>{item.quantity}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", border: "1px solid #ddd" }}>{formatINR(item.unitPrice)}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "bold", border: "1px solid #ddd" }}>{formatINR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0", borderTop: "2px solid #333" }}>
          <div style={{ flex: 1, padding: "8px", borderRight: "1px solid #ddd" }}>
            <div style={{ fontSize: "0.7rem", color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: "4px" }}>Amount in Words</div>
            <div style={{ fontWeight: "bold", fontSize: "0.85rem", textTransform: "uppercase" }}>{amountWords}</div>
          </div>
          <div style={{ width: "250px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "4px 8px", color: "#555" }}>Sub Total</td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>{formatINR(totals.subTotal)}</td>
                </tr>
                {totals.sgst > 0 && (
                  <tr style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "4px 8px", color: "#555" }}>SGST ({taxHalf}%)</td>
                    <td style={{ padding: "4px 8px", textAlign: "right" }}>{formatINR(totals.sgst)}</td>
                  </tr>
                )}
                {totals.cgst > 0 && (
                  <tr style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "4px 8px", color: "#555" }}>CGST ({taxHalf}%)</td>
                    <td style={{ padding: "4px 8px", textAlign: "right" }}>{formatINR(totals.cgst)}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: "#fff3f3", borderTop: "2px solid #b30000" }}>
                  <td style={{ padding: "6px 8px", fontWeight: "bold", fontSize: "0.9rem", color: "#b30000" }}>Grand Total</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontSize: "1rem", color: "#b30000" }}>
                    {formatINR(totals.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer" style={{ marginTop: "12px" }}>

          {/* NON-PROFORMA footer */}
          {!isProforma && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ flex: 1.5 }}>
                {(bank.bankName || bank.accountName || bank.accountNumber || bank.ifsc) && (
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.75rem", color: "#555", textTransform: "uppercase", marginBottom: "2px" }}>Bank Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "100px auto", gap: "1px", fontSize: "0.75rem" }}>
                      {bank.bankName && <><span style={{ color: "#666" }}>Bank:</span><b>{bank.bankName}</b></>}
                      {bank.accountName && <><span style={{ color: "#666" }}>A/C Name:</span><b>{bank.accountName}</b></>}
                      {bank.accountNumber && <><span style={{ color: "#666" }}>A/C No:</span><b>{bank.accountNumber}</b></>}
                      {bank.ifsc && <><span style={{ color: "#666" }}>IFSC:</span><b>{bank.ifsc}</b></>}
                      {Object.entries(bank.fields || {}).map(([lbl, val]) => (
                        <React.Fragment key={lbl}>
                          <span style={{ color: "#666", textTransform: "capitalize" }}>{lbl}:</span>
                          <b>{String(val)}</b>
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
                  {invoice.businessName && (
                    <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#333", marginBottom: invoice.signature ? "5px" : "40px" }}>
                      For {invoice.businessName}
                    </div>
                  )}
                  {invoice.signature && (
                    <img src={invoice.signature} alt="Signature" style={{ maxHeight: "80px", maxWidth: "200px", objectFit: "contain", margin: "0 auto" }} />
                  )}
                  <div style={{ borderTop: "2px solid #333", paddingTop: "3px", fontWeight: "bold", fontSize: "0.8rem", marginTop: invoice.signature ? "0" : "10px" }}>
                    Proprietor / Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFORMA footer */}
          {isProforma && (
            <>
              <div style={{ fontWeight: "bold", fontSize: "0.72rem", textTransform: "uppercase", color: "#444", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "7px" }}>
                Terms &amp; Conditions
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ border: "1px solid #d0d0d0", borderRadius: "4px", padding: "8px 10px", marginBottom: "6px", fontSize: "0.7rem" }}>
                    <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#444", marginBottom: "5px", fontSize: "0.68rem" }}>Payment Terms</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "2px 10px", fontSize: "0.67rem" }}>
                      <span>Advance</span><span style={{ color: "#888" }}>30%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmAdvance)}</span>
                      <span>Second Payment</span><span style={{ color: "#888" }}>40%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmSecond)}</span>
                      <span>Before Dispatch</span><span style={{ color: "#888" }}>20%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmDispatch)}</span>
                      <span>After Installation/Commissioning</span><span style={{ color: "#888" }}>10%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmInstall)}</span>
                    </div>
                    {gt > 0 && (
                      <div style={{ borderTop: "1px solid #ccc", marginTop: "5px", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "0.67rem" }}>
                        <span>Total</span><span style={{ fontFamily: "monospace" }}>{formatINR(gt)}</span>
                      </div>
                    )}
                  </div>
                  {(bank.bankName || bank.accountName || bank.accountNumber || bank.ifsc) && (
                    <div style={{ border: "1px solid #d0d0d0", borderRadius: "4px", padding: "8px 10px", fontSize: "0.7rem" }}>
                      <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#444", marginBottom: "5px", fontSize: "0.68rem" }}>Bank Details</div>
                      <div style={{ display: "grid", gridTemplateColumns: "65px 1fr", gap: "2px 8px", fontSize: "0.67rem" }}>
                        {bank.bankName && <><span style={{ color: "#666" }}>Bank:</span><b>{bank.bankName}</b></>}
                        {bank.accountName && <><span style={{ color: "#666" }}>A/C Name:</span><b>{bank.accountName}</b></>}
                        {bank.accountNumber && <><span style={{ color: "#666" }}>A/C No:</span><b>{bank.accountNumber}</b></>}
                        {bank.ifsc && <><span style={{ color: "#666" }}>IFSC:</span><b>{bank.ifsc}</b></>}
                        {Object.entries(bank.fields || {}).map(([lbl, val]) => (
                          <React.Fragment key={lbl}>
                            <span style={{ color: "#666", textTransform: "capitalize" }}>{lbl}:</span>
                            <b>{String(val)}</b>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ border: "1px solid #d0d0d0", borderRadius: "4px", padding: "8px 10px", fontSize: "0.7rem" }}>
                    <div style={{ fontWeight: "bold", textTransform: "uppercase", color: "#444", marginBottom: "5px", fontSize: "0.68rem" }}>Delivery &amp; Installation</div>
                    {([
                      { label: "Delivery:", text: "3–6 weeks from receipt of advance and order confirmation." },
                      { label: "Installation:", text: "Included, subject to site readiness." },
                      { label: "Trial Run & Operator Training:", text: "Included." },
                      { label: "Warranty:", text: "6 months from installation, as per manufacturer's terms." },
                      { label: "Transportation:", text: "As mutually agreed between buyer and seller." },
                      { label: "Civil & Electrical Work:", text: "Beyond the supplied panel and site development is not included unless otherwise agreed." },
                    ] as { label: string; text: string }[]).map(({ label, text }, i) => (
                      <div key={i} style={{ display: "flex", gap: "5px", marginBottom: "3px", fontSize: "0.67rem", alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, fontWeight: "bold", color: "#444", minWidth: "12px" }}>{i + 1}.</span>
                        <span><b>{label}</b> {text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "10px" }}>
                <div style={{ fontStyle: "italic", color: "#b30000", fontWeight: "bold", fontSize: "0.82rem" }}>
                  Thank you for choosing {invoice.businessName || "us"}!
                </div>
                <div style={{ textAlign: "center" }}>
                  {invoice.businessName && (
                    <div style={{ fontWeight: "bold", fontSize: "0.8rem", marginBottom: invoice.signature ? "4px" : "26px" }}>
                      For {invoice.businessName}
                    </div>
                  )}
                  {invoice.signature && (
                    <img src={invoice.signature} alt="Signature" style={{ maxHeight: "60px", maxWidth: "150px", objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
                  )}
                  <div style={{ borderTop: "1.5px solid #333", paddingTop: "3px", fontSize: "0.7rem", fontWeight: "bold" }}>
                    Proprietor / Authorized Signatory
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Thank you */}
        {!isProforma && (
          <div style={{ textAlign: "center", marginTop: "16px", fontStyle: "italic", color: "#b30000", fontWeight: "bold", fontSize: "0.85rem" }}>
            Thank you for choosing {invoice.businessName || "us"}!
          </div>
        )}

        {/* Proforma disclaimer */}
        {isProforma && (
          <div style={{ textAlign: "center", marginTop: "8px", fontStyle: "italic", color: "#999", fontSize: "0.62rem" }}>
            This document is a Proforma Invoice prepared from the uploaded Price Quote and is not a Tax Invoice.
          </div>
        )}
      </div>
    </div>
  );
}

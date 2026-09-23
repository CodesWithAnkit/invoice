"use client";

import React from "react";
import { useInvoice } from "@/hooks/useInvoice";
import { formatINR } from "@/utils/formatCurrency";
import { getDocumentTitle } from "@/utils/documentType";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const ACCENT = "#1b3a6b";
const ACCENT_LITE = "#edf0f7";
const BORDER = "#d4d8e2";
const MUTED = "#6b7280";
const DARK = "#111827";
const RED = "#b30000";

export default function ModernTemplate() {
  const { invoice } = useInvoice();
  const { meta, customer, items, totals, bank, amountWords, fields } = invoice;

  const isProforma = meta.type === "proforma";
  const taxHalf = (invoice.taxPercent ?? 18) / 2;

  const gt = totals.grandTotal;
  const pmAdvance = Math.round(gt * 0.30);
  const pmSecond = Math.round(gt * 0.40);
  const pmDispatch = Math.round(gt * 0.20);
  const pmInstall = gt - pmAdvance - pmSecond - pmDispatch;

  const sortedItems = [...items].sort((a, b) => b.total - a.total);

  const sectionLabel: React.CSSProperties = {
    fontSize: "0.58rem",
    fontWeight: 700,
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    marginBottom: "5px",
  };

  return (
    <div id="invoice-print-root">
      <div
        className="invoice-print-page"
        style={{
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          color: DARK,
          backgroundColor: "#fff",
          lineHeight: 1.4,
          // Proforma's footer (payment terms + delivery/installation block)
          // is taller than Invoice/Quote's; at the shared 0.85 zoom it can
          // overflow to a 2nd page once a signature image + 15 items are
          // present (confirmed in a real browser print dialog, not just
          // headless rendering). Scale it down a bit more — scoped to this
          // template+type only via inline style (overrides the shared
          // `.invoice-print-page { zoom }` rule) — so Invoice/Quote here
          // and Classic's own handling are unaffected.
          ...(isProforma ? { zoom: 0.84 } : {}),
        }}
      >

        {/* 1. HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 24px 14px", borderBottom: `3px solid ${ACCENT}` }}>
          <div style={{ flex: 1 }}>
            {invoice.businessName && (
              <div style={{ fontWeight: 800, fontSize: "1.35rem", color: ACCENT, letterSpacing: "-0.01em", marginBottom: "3px" }}>
                {invoice.businessName}
              </div>
            )}
            {invoice.businessAddress && (
              <div style={{ fontSize: "0.7rem", color: MUTED, whiteSpace: "pre-line", lineHeight: 1.45 }}>
                {invoice.businessAddress}
              </div>
            )}
            {invoice.phone && <div style={{ fontSize: "0.7rem", color: MUTED, marginTop: "2px" }}>{invoice.phone}</div>}
            {invoice.gstin && <div style={{ fontSize: "0.7rem", color: MUTED }}>GSTIN: {invoice.gstin}</div>}
            {Object.entries(fields || {}).map(([label, value]) => (
              <div key={label} style={{ fontSize: "0.7rem", color: MUTED }}>
                <span style={{ textTransform: "capitalize" }}>{label}:</span> {String(value)}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", paddingLeft: "20px" }}>
            <div style={{ fontWeight: 800, fontSize: "1.55rem", color: ACCENT, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {getDocumentTitle(meta.type)}
            </div>
            {isProforma && (
              <div style={{ fontSize: "0.6rem", color: MUTED, marginTop: "2px", fontStyle: "italic" }}>
                This is not a tax invoice — proforma only
              </div>
            )}
            {!isProforma && (
              <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "auto auto", columnGap: "16px", rowGap: "2px", fontSize: "0.75rem", textAlign: "left" }}>
                {/* {meta.date && (
                  <>
                    <span style={{ color: MUTED }}>Date</span>
                    <span style={{ fontWeight: 700 }}>{meta.date}</span>
                  </>
                )} */}
                {Object.entries(meta.fields || {}).map(([label, value]) => (
                  <React.Fragment key={label}>
                    <span style={{ color: MUTED, textTransform: "capitalize" }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{String(value)}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. CUSTOMER / QUOTE INFORMATION */}
        <div style={{ display: "flex", margin: "10px 24px", border: `1px solid ${BORDER}`, borderRadius: "5px", overflow: "hidden" }}>
          <div style={{ flex: 1.4, padding: "10px 14px", borderRight: `1px solid ${BORDER}` }}>
            <div style={sectionLabel}>Billed To</div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", color: DARK, lineHeight: 1.3, marginBottom: "4px" }}>
              {customer.fields?.companyName && customer.name
                ? <>{customer.fields.companyName} <span style={{ fontWeight: 400, textTransform: "none" }}>prop.</span> {customer.name}</>
                : customer.fields?.companyName || customer.name}
            </div>
            {customer.address && (
              <div style={{ fontSize: "0.68rem", color: MUTED, whiteSpace: "pre-line", lineHeight: 1.45, marginBottom: "2px" }}>
                {customer.address}
              </div>
            )}
            {Object.entries(customer.fields || {})
              .filter(([lbl]) => lbl.toLowerCase() !== "companyname")
              .map(([lbl, val]) => (
                <div key={lbl} style={{ fontSize: "0.68rem", color: MUTED }}>
                  <span style={{ textTransform: "capitalize" }}>{lbl}:</span>{" "}
                  {String(val) === "" ? <span style={{ color: "#ccc" }}>—</span> : <span style={{ color: DARK }}>{String(val)}</span>}
                </div>
              ))}
          </div>
          {!isProforma && (
            <div style={{ flex: "0 0 auto", minWidth: "160px", padding: "10px 14px", backgroundColor: ACCENT_LITE }}>
              <div style={sectionLabel}>{meta.type === "invoice" ? "Invoice Information" : "Quote Information"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto auto", columnGap: "16px", rowGap: "4px", fontSize: "0.72rem" }}>
                {meta.invoiceNumber && (
                  <>
                    <span style={{ color: MUTED }}>{meta.type === "invoice" ? "Invoice #" : "Quote #"}</span>
                    <span style={{ fontWeight: 700 }}>{meta.invoiceNumber}</span>
                  </>
                )}

              </div>
            </div>
          )}
        </div>

        {/* 3. PRODUCT TABLE */}
        <div style={{ margin: "0 24px" }}>
          <table className="invoice-items-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ backgroundColor: ACCENT_LITE, borderTop: `2px solid ${ACCENT}`, borderBottom: `1px solid ${BORDER}` }}>
                {(["#", "Description", "Qty", "Unit Price (₹)", "Amount (₹)"] as const).map((col, i) => (
                  <th
                    key={col}
                    style={{
                      padding: "6px 8px",
                      fontWeight: 700,
                      fontSize: "0.62rem",
                      color: ACCENT,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: i === 0 ? "center" : i === 1 ? "left" : i === 2 ? "center" : "right",
                      width: i === 0 ? "28px" : i === 2 ? "44px" : i === 3 || i === 4 ? "110px" : undefined,
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: idx % 2 === 1 ? "#f9fafc" : "#fff" }}>
                  <td style={{ padding: "4px 8px", textAlign: "center", color: MUTED, fontSize: "0.65rem" }}>{idx + 1}</td>
                  <td style={{ padding: "4px 8px", color: DARK }}>{item.description}</td>
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: MUTED }}>{formatINR(item.unitPrice)}</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, color: DARK }}>{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. TOTALS */}
        <div style={{ display: "flex", margin: "0 24px", borderTop: `2px solid ${ACCENT}`, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, padding: "9px 12px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ ...sectionLabel, marginBottom: "3px" }}>Amount in Words</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: DARK, lineHeight: 1.35 }}>
              {amountWords}
            </div>
          </div>
          <div style={{ flexShrink: 0, width: "260px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.73rem" }}>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "5px 14px", color: MUTED }}>Sub Total</td>
                  <td style={{ padding: "5px 14px", textAlign: "right", fontWeight: 600 }}>₹ {formatINR(totals.subTotal)}</td>
                </tr>
                {totals.sgst > 0 && (
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "5px 14px", color: MUTED }}>SGST ({taxHalf}%)</td>
                    <td style={{ padding: "5px 14px", textAlign: "right" }}>₹ {formatINR(totals.sgst)}</td>
                  </tr>
                )}
                {totals.cgst > 0 && (
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "5px 14px", color: MUTED }}>CGST ({taxHalf}%)</td>
                    <td style={{ padding: "5px 14px", textAlign: "right" }}>₹ {formatINR(totals.cgst)}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: ACCENT_LITE }}>
                  <td style={{ padding: "7px 14px", fontWeight: 700, fontSize: "0.82rem", color: ACCENT }}>Grand Total</td>
                  <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 800, fontSize: "0.92rem", color: ACCENT }}>
                    ₹ {formatINR(totals.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. BOTTOM INFORMATION AREA */}
        <div className="invoice-footer" style={{ margin: "8px 24px 0" }}>

          {/* NON-PROFORMA: 3-column compact footer */}
          {!isProforma && (
            <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: "5px", overflow: "hidden" }}>
              {/* Col 1 — Bank Details */}
              <div style={{ flex: 1, padding: "9px 12px", borderRight: `1px solid ${BORDER}` }}>
                <div style={sectionLabel}>Bank Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "58px 1fr", columnGap: "8px", rowGap: "3px", fontSize: "0.67rem" }}>
                  {bank.bankName && <><span style={{ color: MUTED }}>Bank:</span><span style={{ fontWeight: 600 }}>{bank.bankName}</span></>}
                  {bank.accountName && <><span style={{ color: MUTED }}>A/C Name:</span><span style={{ fontWeight: 600 }}>{bank.accountName}</span></>}
                  {bank.accountNumber && <><span style={{ color: MUTED }}>A/C No:</span><span style={{ fontWeight: 600 }}>{bank.accountNumber}</span></>}
                  {bank.ifsc && <><span style={{ color: MUTED }}>IFSC:</span><span style={{ fontWeight: 600 }}>{bank.ifsc}</span></>}
                  {Object.entries(bank.fields || {}).map(([lbl, val]) => (
                    <React.Fragment key={lbl}>
                      <span style={{ color: MUTED, textTransform: "capitalize" }}>{lbl}:</span>
                      <span style={{ fontWeight: 600 }}>{String(val)}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {/* Col 2 — Terms & Conditions */}
              <div style={{ flex: 1, padding: "9px 12px", borderRight: `1px solid ${BORDER}` }}>
                <div style={sectionLabel}>Terms &amp; Conditions</div>
                {[
                  "Goods once sold will not be taken back.",
                  "Subject to local jurisdiction.",
                  "Finance charges applicable for delayed payments.",
                ].map((term, i) => (
                  <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px", fontSize: "0.66rem", color: MUTED, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, fontWeight: 700, color: ACCENT, minWidth: "10px" }}>{i + 1}</span>
                    <span>{term}</span>
                  </div>
                ))}
              </div>
              {/* Col 3 — Authorization */}
              <div style={{ flex: 1, padding: "9px 12px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                <div style={{ textAlign: "center", width: "100%" }}>
                  {invoice.businessName && (
                    <div style={{ fontWeight: 600, fontSize: "0.72rem", color: DARK, marginBottom: invoice.signature ? "4px" : "28px" }}>
                      For {invoice.businessName}
                    </div>
                  )}
                  {invoice.signature && (
                    <img src={invoice.signature} alt="Signature" style={{ maxHeight: "48px", maxWidth: "130px", objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
                  )}
                  <div style={{ borderTop: `1.5px solid ${DARK}`, paddingTop: "3px", fontSize: "0.65rem", fontWeight: 600, color: DARK }}>
                    Proprietor / Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFORMA: Payment Terms + Bank (left) | Delivery & Installation (right) */}
          {isProforma && (
            <>
              <div style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", color: ACCENT, borderBottom: `2px solid ${ACCENT}`, paddingBottom: "3px", marginBottom: "7px", letterSpacing: "0.06em" }}>
                Terms &amp; Conditions
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                {/* LEFT: Payment Terms + Bank Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "8px 10px", marginBottom: "6px" }}>
                    <div style={sectionLabel}>Payment Terms</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", columnGap: "10px", rowGap: "3px", fontSize: "0.66rem" }}>
                      <span>Advance</span><span style={{ color: MUTED }}>30%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmAdvance)}</span>
                      <span>Second Payment</span><span style={{ color: MUTED }}>40%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmSecond)}</span>
                      <span>Before Dispatch</span><span style={{ color: MUTED }}>20%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmDispatch)}</span>
                      <span>After Installation/Commissioning</span><span style={{ color: MUTED }}>10%</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>{formatINR(pmInstall)}</span>
                    </div>
                    {gt > 0 && (
                      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: "5px", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.67rem" }}>
                        <span>Total</span><span style={{ fontFamily: "monospace" }}>{formatINR(gt)}</span>
                      </div>
                    )}
                  </div>
                  {(bank.bankName || bank.accountName || bank.accountNumber || bank.ifsc || Object.keys(bank.fields || {}).length > 0) && (
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "8px 10px" }}>
                      <div style={sectionLabel}>Bank Details</div>
                      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", columnGap: "8px", rowGap: "3px", fontSize: "0.66rem" }}>
                        {bank.bankName && <><span style={{ color: MUTED }}>Bank:</span><span style={{ fontWeight: 600 }}>{bank.bankName}</span></>}
                        {bank.accountName && <><span style={{ color: MUTED }}>A/C Name:</span><span style={{ fontWeight: 600 }}>{bank.accountName}</span></>}
                        {bank.accountNumber && <><span style={{ color: MUTED }}>A/C No:</span><span style={{ fontWeight: 600 }}>{bank.accountNumber}</span></>}
                        {bank.ifsc && <><span style={{ color: MUTED }}>IFSC:</span><span style={{ fontWeight: 600 }}>{bank.ifsc}</span></>}
                        {Object.entries(bank.fields || {}).map(([lbl, val]) => (
                          <React.Fragment key={lbl}>
                            <span style={{ color: MUTED, textTransform: "capitalize" }}>{lbl}:</span>
                            <span style={{ fontWeight: 600 }}>{String(val)}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* RIGHT: Delivery & Installation */}
                <div style={{ flex: 1 }}>
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "8px 10px" }}>
                    <div style={sectionLabel}>Delivery &amp; Installation</div>
                    {([
                      { label: "Delivery:", text: "3\u20136 weeks from receipt of advance and order confirmation." },
                      { label: "Installation:", text: "Included, subject to site readiness." },
                      { label: "Trial Run & Operator Training:", text: "Included." },
                      { label: "Warranty:", text: "6 months from installation, as per manufacturer\u2019s terms." },
                      { label: "Transportation:", text: "As mutually agreed between buyer and seller." },
                      { label: "Civil & Electrical Work:", text: "Beyond the supplied panel and site development is not included unless otherwise agreed." },
                    ] as { label: string; text: string }[]).map(({ label, text }, i) => (
                      <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px", fontSize: "0.66rem", alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, fontWeight: 700, color: ACCENT, background: ACCENT_LITE, borderRadius: "3px", padding: "0 4px", fontSize: "0.6rem", lineHeight: "1.6" }}>{i + 1}</span>
                        <span style={{ color: MUTED }}><b style={{ color: DARK }}>{label}</b> {text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Proforma bottom: Thank you + Signature */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "10px" }}>
                <div style={{ fontStyle: "italic", color: RED, fontWeight: 700, fontSize: "0.82rem" }}>
                  Thank you for choosing {invoice.businessName || "us"}!
                </div>
                <div style={{ textAlign: "center" }}>
                  {invoice.businessName && (
                    <div style={{ fontWeight: 600, fontSize: "0.72rem", color: DARK, marginBottom: invoice.signature ? "4px" : "26px" }}>
                      For {invoice.businessName}
                    </div>
                  )}
                  {invoice.signature && (
                    <img src={invoice.signature} alt="Signature" style={{ maxHeight: "48px", maxWidth: "130px", objectFit: "contain", display: "block", margin: "0 auto 4px" }} />
                  )}
                  <div style={{ borderTop: `1.5px solid ${DARK}`, paddingTop: "3px", fontSize: "0.65rem", fontWeight: 600 }}>
                    Proprietor / Authorized Signatory
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 6. THANK YOU (non-proforma) */}
        {!isProforma && (
          <div style={{ textAlign: "center", marginTop: "10px", fontStyle: "italic", color: RED, fontWeight: 700, fontSize: "0.82rem" }}>
            Thank you for choosing {invoice.businessName || "us"}!
          </div>
        )}

        {/* 7. LEGAL DISCLAIMER (proforma only) */}
        {isProforma && (
          <div style={{ textAlign: "center", marginTop: "8px", fontStyle: "italic", color: "#9ca3af", fontSize: "0.6rem" }}>
            This document is a Proforma Invoice prepared from the uploaded Price Quote and is not a Tax Invoice.
          </div>
        )}
      </div>
    </div>
  );
}

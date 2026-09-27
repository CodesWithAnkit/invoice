import * as React from "react";
import type { QuotationDocument } from "@/modules/quotation/quotation.document";
import { formatBp, formatMinor } from "@/modules/quotation/quotation.money";

// The quotation "paper": preview on screen and the one-page A4 PDF via browser
// print (R-15, R-15a). Same visual family as the Modern invoice template, with
// fixed paper colours on purpose — it is a printed document, not themed UI.
// It renders the document's stored values only and never recalculates
// (AC-PREVIEW-002, AC-PDF-003).

const ACCENT = "#1b3a6b";
const ACCENT_LITE = "#edf0f7";
const BORDER = "#d4d8e2";
const MUTED = "#4b5563";
const DARK = "#111827";

const label: React.CSSProperties = {
  fontSize: "0.58rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: ACCENT,
  marginBottom: "3px",
};

const cell: React.CSSProperties = { padding: "3px 6px", borderBottom: `1px solid ${BORDER}`, verticalAlign: "top" };
const num: React.CSSProperties = { ...cell, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div style={label}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "0.66rem", lineHeight: 1.4, listStyleType: "disc" }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function QuotationDocumentView({
  document: doc,
  measuring = false,
}: {
  document: QuotationDocument;
  /** Off-screen copy for the one-page check: no test ids, no duplicates. */
  measuring?: boolean;
}) {
  const tid = (id: string) => (measuring ? undefined : id);
  const { business, customer, project, quotation: q } = doc;
  const money = (minor: number) => formatMinor(minor, q.currency);
  const scopeLists = [
    { title: "Deliverables", items: q.scope.deliverables },
    { title: "Included", items: q.scope.included },
    { title: "Not included", items: q.scope.excluded },
    { title: "Assumptions", items: q.scope.assumptions },
  ].filter((l) => l.items.length > 0);
  const hasScope = !!q.scope.overview || scopeLists.length > 0 || !!q.scope.revision_policy;

  return (
    <div
      className="quotation-doc"
      data-testid={tid("quotation-document")}
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: DARK,
        backgroundColor: "#fff",
        lineHeight: 1.4,
        fontSize: "0.7rem",
        // Long unbroken words (URLs, codes) must wrap inside the page, never widen it.
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        // Same approach as the invoice templates (`.invoice-print-page { zoom: 0.85 }`):
        // scale the whole document so a complete quotation fits one A4 page. Set
        // here, not in print CSS, so the one-page measurer sees the same size.
        zoom: 0.88,
      }}
    >
      {/* 1. Header: business + quotation meta */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          padding: "0 0 10px",
          borderBottom: `3px solid ${ACCENT}`,
        }}
      >
        <div style={{ display: "flex", gap: "10px", minWidth: 0, flex: 1 }}>
          {business.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- printed document; next/image adds wrappers that break print layout
            <img src={business.logo_url} alt="" style={{ height: "44px", width: "auto", objectFit: "contain" }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "1.25rem", color: ACCENT, lineHeight: 1.2 }}>
              {business.name || "Your business"}
            </div>
            {business.address && <div style={{ color: MUTED, whiteSpace: "pre-line" }}>{business.address}</div>}
            <div style={{ color: MUTED }}>
              {[business.phone, business.email, business.website].filter(Boolean).join(" · ")}
            </div>
            {business.tax_id && <div style={{ color: MUTED }}>Tax ID: {business.tax_id}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{ fontWeight: 800, fontSize: "1.4rem", color: ACCENT, textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            Quotation
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              columnGap: "12px",
              rowGap: "1px",
              marginTop: "4px",
              textAlign: "left",
            }}
          >
            <span style={{ color: MUTED }}>Quote #</span>
            <span style={{ fontWeight: 700 }} data-testid={tid("doc-quote-number")}>
              {q.quote_number ?? "Draft"}
            </span>
            <span style={{ color: MUTED }}>Date</span>
            <span style={{ fontWeight: 700 }}>{formatDate(q.issue_date)}</span>
            <span style={{ color: MUTED }}>Valid until</span>
            <span style={{ fontWeight: 700 }}>{formatDate(q.valid_until)}</span>
            {q.version > 1 && (
              <>
                <span style={{ color: MUTED }}>Version</span>
                <span style={{ fontWeight: 700 }}>{q.version}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Customer + project */}
      <div style={{ display: "flex", margin: "8px 0", border: `1px solid ${BORDER}`, borderRadius: "5px", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, padding: "7px 10px", borderRight: `1px solid ${BORDER}` }}>
          <div style={label}>Prepared for</div>
          {customer ? (
            <>
              <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{customer.company_name || customer.name}</div>
              {customer.company_name && <div>{customer.name}</div>}
              {customer.address && <div style={{ color: MUTED, whiteSpace: "pre-line" }}>{customer.address}</div>}
              <div style={{ color: MUTED }}>{[customer.phone, customer.email].filter(Boolean).join(" · ")}</div>
              {customer.tax_id && <div style={{ color: MUTED }}>Tax ID: {customer.tax_id}</div>}
            </>
          ) : (
            <div style={{ color: MUTED }}>—</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "7px 10px", backgroundColor: ACCENT_LITE }}>
          <div style={label}>Project</div>
          <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{q.title || project?.name}</div>
          {project && q.title !== project.name && <div>{project.name}</div>}
          {project?.description && <div style={{ color: MUTED }}>{project.description}</div>}
        </div>
      </div>

      {/* 3. Line items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ backgroundColor: ACCENT, color: "#fff" }}>
            <th style={{ ...cell, width: "30px", textAlign: "left" }}>#</th>
            <th style={{ ...cell, textAlign: "left" }}>Item</th>
            <th style={{ ...num, width: "70px" }}>Qty</th>
            <th style={{ ...num, width: "90px" }}>Rate</th>
            <th style={{ ...num, width: "95px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((item, i) => {
            const isPercent = item.pricing_model === "percentage";
            return (
              <tr key={item.id ?? i}>
                <td style={cell}>{i + 1}</td>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  {item.description && <div style={{ color: MUTED, fontSize: "0.62rem" }}>{item.description}</div>}
                </td>
                <td style={num}>
                  {isPercent ? formatBp(item.percent_bp) : `${Number(item.quantity)}${item.unit ? ` ${item.unit}` : ""}`}
                </td>
                <td style={num}>{isPercent ? "of items" : money(item.rate_minor)}</td>
                <td style={num}>{money(item.amount_minor)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 4. Totals (stored values only) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
        <table style={{ borderCollapse: "collapse", minWidth: "230px", fontSize: "0.7rem" }}>
          <tbody>
            <tr>
              <td style={{ padding: "2px 6px", color: MUTED }}>Subtotal</td>
              <td style={{ ...num, borderBottom: 0, padding: "2px 6px" }}>{money(q.subtotal_minor)}</td>
            </tr>
            {q.discount_minor > 0 && (
              <tr>
                <td style={{ padding: "2px 6px", color: MUTED }}>
                  Discount{q.discount_type === "percent" ? ` (${formatBp(q.discount_bp)})` : ""}
                </td>
                <td style={{ ...num, borderBottom: 0, padding: "2px 6px" }}>−{money(q.discount_minor)}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "2px 6px", color: MUTED }}>Taxable amount</td>
              <td style={{ ...num, borderBottom: 0, padding: "2px 6px" }}>{money(q.taxable_minor)}</td>
            </tr>
            <tr>
              <td style={{ padding: "2px 6px", color: MUTED }}>
                {q.tax_name || "Tax"} {formatBp(q.tax_rate_bp)}
              </td>
              <td style={{ ...num, borderBottom: 0, padding: "2px 6px" }}>{money(q.tax_minor)}</td>
            </tr>
            <tr style={{ backgroundColor: ACCENT, color: "#fff" }}>
              <td style={{ padding: "5px 6px", fontWeight: 800 }}>Total</td>
              <td
                style={{ ...num, borderBottom: 0, padding: "5px 6px", fontWeight: 800, fontSize: "0.82rem" }}
                data-testid={tid("doc-total")}
              >
                {money(q.total_minor)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Scope */}
      {hasScope && (
        <div style={{ marginTop: "10px", borderTop: `1px solid ${BORDER}`, paddingTop: "8px" }}>
          <div style={{ ...label, fontSize: "0.64rem" }}>Scope of work</div>
          {q.scope.overview && <p style={{ margin: "0 0 6px", whiteSpace: "pre-line" }}>{q.scope.overview}</p>}
          {scopeLists.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "6px 16px" }}>
              {scopeLists.map((l) => (
                <Bullets key={l.title} title={l.title} items={l.items} />
              ))}
            </div>
          )}
          {q.scope.revision_policy && (
            <p style={{ margin: "6px 0 0" }}>
              <span style={{ fontWeight: 700 }}>Revisions: </span>
              {q.scope.revision_policy}
            </p>
          )}
        </div>
      )}

      {/* 6. Timeline */}
      {q.milestones.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ ...label, fontSize: "0.64rem" }}>Timeline</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.66rem", tableLayout: "fixed" }}>
            <tbody>
              {q.milestones.map((m, i) => (
                <tr key={m.id ?? i}>
                  <td style={{ ...cell, width: "30%", fontWeight: 600 }}>{m.name}</td>
                  <td style={{ ...cell, width: "22%", color: MUTED }}>
                    {[m.start_label, m.end_label].filter(Boolean).join(" – ") || "—"}
                  </td>
                  <td style={cell}>{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. Terms and notes */}
      {(q.terms.length > 0 || q.notes) && (
        <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: q.terms.length > 0 && q.notes ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: "16px" }}>
          <Bullets title="Terms" items={q.terms} />
          {q.notes && (
            <div>
              <div style={label}>Notes</div>
              <p style={{ margin: 0, whiteSpace: "pre-line", fontSize: "0.66rem" }}>{q.notes}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "12px", paddingTop: "6px", borderTop: `1px solid ${BORDER}`, color: MUTED, fontSize: "0.6rem", textAlign: "center" }}>
        Thank you for the opportunity. This quotation is valid until {formatDate(q.valid_until)}.
      </div>
    </div>
  );
}

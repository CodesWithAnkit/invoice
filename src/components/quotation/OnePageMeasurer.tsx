"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { QuotationDocumentView } from "@/components/quotation/QuotationDocumentView";
import type { QuotationDocument } from "@/modules/quotation/quotation.document";

// R-15a: "fits on one page" is decided by measuring the real document, not by
// counting items. The document is rendered off-screen at the printable width
// of an A4 page with 10mm margins (190mm, see quotation-print.css) and compared
// with the printable height (277mm). The server can't lay out text, so this is
// a client-side check; tests/quotation-lifecycle.spec.ts proves the PDF result.

export type PageFit = { fits: boolean; usedPercent: number } | null;

export function useOnePageFit() {
  const [fit, setFit] = useState<PageFit>(null);
  return { fit, onMeasure: setFit };
}

export function OnePageMeasurer({
  document,
  onMeasure,
}: {
  document: QuotationDocument;
  onMeasure: (fit: PageFit) => void;
}) {
  const docRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const docEl = docRef.current;
    const pageEl = pageRef.current;
    if (!docEl || !pageEl) return;
    const measure = () => {
      const available = pageEl.getBoundingClientRect().height;
      const used = docEl.getBoundingClientRect().height;
      if (available > 0) onMeasure({ fits: used <= available, usedPercent: Math.round((used / available) * 100) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(docEl);
    return () => observer.disconnect();
  }, [document, onMeasure]);

  return (
    <div
      aria-hidden="true"
      className="no-print"
      style={{ position: "absolute", left: -10_000, top: 0, width: "190mm", visibility: "hidden", pointerEvents: "none" }}
    >
      <div ref={pageRef} style={{ height: "277mm", position: "absolute", width: 1 }} />
      <div ref={docRef}>
        <QuotationDocumentView document={document} measuring />
      </div>
    </div>
  );
}

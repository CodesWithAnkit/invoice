"use client";

import { useState, useEffect, useCallback } from "react";

export type InvoiceTemplate = "classic" | "modern";

const STORAGE_KEY = "invoice_template";
const DEFAULT: InvoiceTemplate = "modern";

// Singleton so all hooks share state
let _template: InvoiceTemplate = DEFAULT;
let _listeners: Array<(t: InvoiceTemplate) => void> = [];

function setTemplate(t: InvoiceTemplate) {
  _template = t;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, t);
  }
  _listeners.forEach((fn) => fn(t));
}

// Hydrate from storage once
if (typeof window !== "undefined") {
  const stored = localStorage.getItem(STORAGE_KEY) as InvoiceTemplate | null;
  if (stored === "classic" || stored === "modern") {
    _template = stored;
  }
}

export function useInvoiceTemplate() {
  const [template, setLocal] = useState<InvoiceTemplate>(_template);

  useEffect(() => {
    const listener = (t: InvoiceTemplate) => setLocal(t);
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  const changeTemplate = useCallback((t: InvoiceTemplate) => {
    setTemplate(t);
  }, []);

  return { template, changeTemplate };
}

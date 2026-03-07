"use client";

import { useState, useEffect, useCallback } from "react";
import { InvoiceData, InvoiceItem } from "@/modules/invoice/invoice.types";
import { calculateInvoiceTotals, calculateItemTotal } from "@/modules/invoice/invoice.calculator";
import { saveToStorage, getFromStorage } from "@/lib/storage/localStorage";
import { amountToWords } from "@/utils/amountToWords";

const STORAGE_KEY = "invoice_draft";

const INITIAL_STATE: InvoiceData = {
  businessAddress: "",
  phone: "",
  gstin: "",
  meta: {
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    type: "invoice",
  },
  customer: {
    name: "",
    address: "",
  },
  items: [
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, total: 0 }
  ],
  totals: {
    subTotal: 0,
    sgst: 0,
    cgst: 0,
    grandTotal: 0,
  },
  bank: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
  },
  amountWords: "",
};

// Singleton state management without an external library
let globalState: InvoiceData = INITIAL_STATE;
let listeners: Array<(state: InvoiceData) => void> = [];

const setGlobalState = (newState: InvoiceData | ((prev: InvoiceData) => InvoiceData)) => {
  if (typeof newState === "function") {
    globalState = newState(globalState);
  } else {
    globalState = newState;
  }
  listeners.forEach((listener) => listener(globalState));
  saveToStorage(STORAGE_KEY, globalState);
};

// Initialize from storage immediately (if in browser)
if (typeof window !== "undefined") {
  const saved = getFromStorage<InvoiceData>(STORAGE_KEY);
  if (saved) {
    globalState = saved;
  }
}

export const useInvoice = () => {
  const [state, setState] = useState<InvoiceData>(globalState);

  useEffect(() => {
    const listener = (newState: InvoiceData) => setState(newState);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const setInvoiceField = useCallback((path: string, value: any) => {
    setGlobalState((prev) => {
      const keys = path.split(".");
      const newInvoice = { ...prev };
      let current: any = newInvoice;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newInvoice;
    });
  }, []);

  const recalculateTotals = useCallback(() => {
    setGlobalState((prev) => {
      const newTotals = calculateInvoiceTotals(prev.items);
      return { ...prev, totals: newTotals };
    });
  }, []);

  const addItem = useCallback(() => {
    if (globalState.items.length >= 15) return;
    setGlobalState((prev) => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setGlobalState((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
    recalculateTotals();
  }, [recalculateTotals]);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setGlobalState((prev) => {
      const newItems = [...prev.items];
      const updatedItem = { ...newItems[index], [field]: value };
      
      if (field === "quantity" || field === "unitPrice") {
        updatedItem.total = calculateItemTotal(updatedItem);
      }
      
      newItems[index] = updatedItem;
      return { ...prev, items: newItems };
    });
    recalculateTotals();
  }, [recalculateTotals]);

  const generateInvoice = useCallback(() => {
    setGlobalState((prev) => {
      const newTotals = calculateInvoiceTotals(prev.items);
      const newAmountWords = amountToWords(newTotals.grandTotal);
      return {
        ...prev,
        totals: newTotals,
        amountWords: newAmountWords,
      };
    });
  }, []);

  return {
    invoice: state,
    setInvoiceField,
    addItem,
    removeItem,
    updateItem,
    recalculateTotals,
    generateInvoice,
  };
};

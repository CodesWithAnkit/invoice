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
    { description: "", quantity: 1, unitPrice: 0, total: 0 }
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

export const useInvoice = () => {
  const [invoice, setInvoice] = useState<InvoiceData>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on init
  useEffect(() => {
    const saved = getFromStorage<InvoiceData>(STORAGE_KEY);
    if (saved) {
      setInvoice(saved);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever invoice changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEY, invoice);
    }
  }, [invoice, isLoaded]);

  const setInvoiceField = useCallback((path: string, value: any) => {
    setInvoice((prev) => {
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
    setInvoice((prev) => {
      const newTotals = calculateInvoiceTotals(prev.items);
      return { ...prev, totals: newTotals };
    });
  }, []);

  const addItem = useCallback(() => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setInvoice((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
    recalculateTotals();
  }, [recalculateTotals]);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice((prev) => {
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
    setInvoice((prev) => {
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
    invoice,
    setInvoice,
    setInvoiceField,
    addItem,
    removeItem,
    updateItem,
    recalculateTotals,
    generateInvoice,
  };
};

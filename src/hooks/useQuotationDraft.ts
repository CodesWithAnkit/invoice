"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import {
  emptyItem,
  emptyMilestone,
  formValuesToDraft,
  previewTotals,
  recordToFormValues,
  type ItemFormValues,
  type MilestoneFormValues,
  type QuotationFormValues,
  type ScopeListKey,
} from "@/modules/quotation/quotation.form";
import type { QuotationRecord, QuotationTotals } from "@/modules/quotation/quotation.types";

// Estimate-builder state (R-02): one grouped `values` object, auto-saved to
// PATCH /api/quotations/:id after a pause in typing. The server is the source
// of truth for totals; the preview runs the same calculator for instant feedback.

export type SaveStatus = "saved" | "unsaved" | "saving" | "invalid" | "error";

const AUTOSAVE_DELAY_MS = 800;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

export function useQuotationDraft(initial: QuotationRecord) {
  const [values, setValues] = useState<QuotationFormValues>(() => recordToFormValues(initial));
  const [lastSavedJson, setLastSavedJson] = useState(() => JSON.stringify(values));
  const [inFlight, setInFlight] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [serverTotals, setServerTotals] = useState<QuotationTotals>(initial);
  const [savedAt, setSavedAt] = useState<string>(initial.updated_at);

  const requestSeq = useRef(0);

  const parsed = useMemo(() => formValuesToDraft(values), [values]);
  const preview = useMemo(() => (parsed.ok ? previewTotals(parsed.draft) : null), [parsed]);
  const errors = parsed.ok ? {} : parsed.errors;
  const calcError = preview && !preview.ok ? preview.error : null;

  const json = JSON.stringify(values);
  const dirty = json !== lastSavedJson;
  const invalid = !parsed.ok || !preview?.ok;
  const status: SaveStatus = inFlight
    ? "saving"
    : !dirty
      ? "saved"
      : invalid
        ? "invalid"
        : saveError
          ? "error"
          : "unsaved";

  const save = useCallback(
    async (snapshot: QuotationFormValues) => {
      const result = formValuesToDraft(snapshot);
      if (!result.ok || !previewTotals(result.draft).ok) return;

      const seq = ++requestSeq.current;
      setInFlight(true);
      try {
        const saved = await apiFetch<QuotationRecord>(`/api/quotations/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.draft),
        });
        if (seq !== requestSeq.current) return; // a newer save superseded this one
        setLastSavedJson(JSON.stringify(snapshot));
        setServerTotals(saved);
        setSavedAt(saved.updated_at);
        setSaveError(null);
      } catch (error) {
        if (seq !== requestSeq.current) return;
        setSaveError(error instanceof Error ? error.message : "Could not save the draft.");
      } finally {
        if (seq === requestSeq.current) setInFlight(false);
      }
    },
    [initial.id]
  );

  // Debounced auto-save (AC-QUOTE-001): a pause in typing saves valid changes.
  useEffect(() => {
    if (!dirty || invalid) return;
    const timer = setTimeout(() => void save(values), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [values, dirty, invalid, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // ─── Mutators (all go through the single grouped state) ───────────────────

  const setField = useCallback(
    <K extends keyof QuotationFormValues>(name: K, value: QuotationFormValues[K]) =>
      setValues((prev) => ({ ...prev, [name]: value })),
    []
  );

  const updateItem = useCallback(
    (index: number, patch: Partial<ItemFormValues>) =>
      setValues((prev) => ({
        ...prev,
        items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      })),
    []
  );

  const addItem = useCallback(() => setValues((prev) => ({ ...prev, items: [...prev.items, emptyItem()] })), []);
  const removeItem = useCallback(
    (index: number) => setValues((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })),
    []
  );
  const moveItem = useCallback(
    (index: number, to: number) => setValues((prev) => ({ ...prev, items: move(prev.items, index, to) })),
    []
  );

  const setScopeText = useCallback(
    (name: "overview" | "revision_policy", value: string) =>
      setValues((prev) => ({ ...prev, scope: { ...prev.scope, [name]: value } })),
    []
  );
  const setScopeList = useCallback(
    (name: ScopeListKey, list: string[]) => setValues((prev) => ({ ...prev, scope: { ...prev.scope, [name]: list } })),
    []
  );

  const updateMilestone = useCallback(
    (index: number, patch: Partial<MilestoneFormValues>) =>
      setValues((prev) => ({
        ...prev,
        milestones: prev.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m)),
      })),
    []
  );
  const addMilestone = useCallback(
    () => setValues((prev) => ({ ...prev, milestones: [...prev.milestones, emptyMilestone()] })),
    []
  );
  const removeMilestone = useCallback(
    (index: number) => setValues((prev) => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) })),
    []
  );
  const moveMilestone = useCallback(
    (index: number, to: number) => setValues((prev) => ({ ...prev, milestones: move(prev.milestones, index, to) })),
    []
  );

  return {
    values,
    /** The validated draft, or null while any field is invalid. */
    parsedDraft: parsed.ok ? parsed.draft : null,
    errors,
    calcError,
    preview: preview && preview.ok ? preview.result : null,
    serverTotals,
    status,
    saveError,
    savedAt,
    saveNow: () => save(values),
    setField,
    updateItem,
    addItem,
    removeItem,
    moveItem,
    setScopeText,
    setScopeList,
    updateMilestone,
    addMilestone,
    removeMilestone,
    moveMilestone,
  };
}

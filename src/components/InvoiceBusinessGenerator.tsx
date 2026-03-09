"use client";

import { useState } from "react";
import { commonInputStyle } from "../constants/styles";
import { InvoiceData, InvoiceItem } from "@/modules/invoice/invoice.types";
import { businessTemplates } from "@/lib/businessTemplates";

interface InvoiceBusinessGeneratorProps {
  onGenerate: (data: Partial<InvoiceData>, taxPercent: number) => void;
}

type Tab = "FORM" | "PROMPT";

export default function InvoiceBusinessGenerator({ onGenerate }: InvoiceBusinessGeneratorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("FORM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    industryType: "atta_chakki_mill",
    businessName: "",
    budget: 1000000,
    gstPercent: 18,
    budgetIncludesGST: true,
    setupMode: "standard",
  });

  // Prompt State
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const payload = activeTab === "FORM" ? { form } : { prompt };

    try {
      const response = await fetch("/api/business-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate invoice.");
      }

      const items: InvoiceItem[] = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.quantity * item.price,
      }));

      onGenerate(
        {
          customer: {
            name: data.businessName || "",
            address: "",
            fields: {},
          },
          items,
          taxPercent: data.taxPercent || 18,
        },
        data.taxPercent || 18
      );
      
      if (activeTab === "PROMPT") setPrompt("");
    } catch (err: any) {
      setError(err.message || "Could not generate invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ 
      marginBottom: "2rem", 
      padding: "1.5rem", 
      backgroundColor: "#f8fafc", 
      borderRadius: "12px", 
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>
        Hybrid Business Invoice Generator
      </h3>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
        <button 
          onClick={() => setActiveTab("FORM")}
          style={{
            padding: "0.5rem 1rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "FORM" ? "2px solid #2563eb" : "none",
            color: activeTab === "FORM" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          FORM
        </button>
        <button 
          onClick={() => setActiveTab("PROMPT")}
          style={{
            padding: "0.5rem 1rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "PROMPT" ? "2px solid #2563eb" : "none",
            color: activeTab === "PROMPT" ? "#2563eb" : "#64748b",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          PROMPT
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {activeTab === "FORM" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>Industry Type</label>
              <select 
                style={commonInputStyle}
                value={form.industryType}
                onChange={(e) => setForm({ ...form, industryType: e.target.value })}
              >
                {Object.entries(businessTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.industryName}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>Business Name</label>
              <input 
                style={commonInputStyle}
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. My Awesome Shop"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>Budget</label>
              <input 
                style={commonInputStyle}
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>GST %</label>
              <input 
                style={commonInputStyle}
                type="number"
                value={form.gstPercent}
                onChange={(e) => setForm({ ...form, gstPercent: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input 
                type="checkbox"
                id="budgetIncludesGST"
                checked={form.budgetIncludesGST}
                onChange={(e) => setForm({ ...form, budgetIncludesGST: e.target.checked })}
              />
              <label htmlFor="budgetIncludesGST" style={{ fontSize: "0.875rem", color: "#475569" }}>Budget includes GST</label>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>Setup Mode</label>
              <select 
                style={commonInputStyle}
                value={form.setupMode}
                onChange={(e) => setForm({ ...form, setupMode: e.target.value })}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>Describe your setup</label>
            <textarea
              style={{ 
                ...commonInputStyle, 
                height: "120px", 
                resize: "vertical",
                fontFamily: "inherit"
              }}
              placeholder='Example: "Create invoice for cafe setup with 500000 budget including 18% GST"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>
        )}
        
        <button
          onClick={handleGenerate}
          disabled={loading || (activeTab === "PROMPT" && !prompt.trim())}
          style={{
            marginTop: "1rem",
            padding: "12px 24px",
            backgroundColor: loading ? "#94a3b8" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
          }}
        >
          {loading ? "Generating..." : "Generate Invoice"}
        </button>
        
        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", fontWeight: 500, marginTop: "0.5rem" }}>
            ⚠️ {error}
          </p>
        )}
      </div>
    </section>
  );
}

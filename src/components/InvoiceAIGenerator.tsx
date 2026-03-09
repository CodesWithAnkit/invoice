"use client";

import { useState } from "react";
import { commonInputStyle } from "../constants/styles";
import { InvoiceData, InvoiceItem } from "@/modules/invoice/invoice.types";

interface InvoiceAIGeneratorProps {
  onGenerate: (data: Partial<InvoiceData>, taxPercent: number) => void;
}

export default function InvoiceAIGenerator({ onGenerate }: InvoiceAIGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI could not understand the invoice.");
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
            name: data.customerName || "",
            address: "",
            fields: {},
          },
          items,
          taxPercent: data.taxPercent || 18,
          businessType: data.businessType || null,
        },
        data.taxPercent || 18
      );
      
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "AI could not understand the invoice. Please edit manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ 
      marginBottom: "2rem", 
      padding: "1.5rem", 
      backgroundColor: "#f9fafb", 
      borderRadius: "12px", 
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem", fontWeight: 600 }}>
        Generate Invoice From Text (AI)
      </h3>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
        Describe your invoice details below and let AI populate the form for you.
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <textarea
          style={{ 
            ...commonInputStyle, 
            height: "100px", 
            resize: "vertical",
            fontFamily: "inherit"
          }}
          placeholder="Example: Create invoice for Rahul, 2 MacBook chargers ₹2000 each, GST 18%, due in 15 days"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            alignSelf: "flex-start"
          }}
        >
          {loading ? "AI is processing..." : "Generate Invoice"}
        </button>
        
        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

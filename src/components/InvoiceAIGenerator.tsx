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
    <section className="mb-8 p-6 bg-card border rounded-xl shadow-sm text-card-foreground">
      <h3 className="mb-2 mt-0 text-lg font-bold">
        Generate Invoice From Text (AI)
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Describe your invoice details below and let AI populate the form for you.
      </p>
      
      <div className="flex flex-col gap-4">
        <textarea
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-inherit"
          placeholder="Example: Create invoice for Rahul, 2 MacBook chargers ₹2000 each, GST 18%, due in 15 days"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className={`self-start px-5 py-2.5 rounded-md font-semibold transition-colors ${
            loading || !prompt.trim() 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          }`}
        >
          {loading ? "AI is processing..." : "Generate Invoice"}
        </button>
        
        {error && (
          <p className="text-destructive text-sm mt-2">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

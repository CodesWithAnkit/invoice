import { useState, useEffect } from "react";
import { commonInputStyle } from "../constants/styles";
import { InvoiceData, InvoiceItem } from "@/modules/invoice/invoice.types";

const TEMPLATES_URL = "/api/templates/list";

interface InvoiceBusinessGeneratorProps {
  onGenerate: (data: Partial<InvoiceData>, taxPercent: number) => void;
}

type Tab = "FORM" | "PROMPT";

export default function InvoiceBusinessGenerator({ onGenerate }: InvoiceBusinessGeneratorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("FORM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistentTemplates, setPersistentTemplates] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    industryType: "",
    businessName: "",
    budget: 1000000,
    gstPercent: 18,
    budgetIncludesGST: true,
    setupMode: "standard",
  });

  // Prompt State
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(TEMPLATES_URL);
      if (response.ok) {
        const data = await response.json();
        const templates = data.templates || [];
        setPersistentTemplates(templates);
        if (templates.length > 0 && !form.industryType) {
          setForm(prev => ({ ...prev, industryType: templates[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch persistent templates:", err);
    }
  };

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
      
      if (activeTab === "PROMPT") {
        setPrompt("");
        // Give a small delay for GitHub to reflect changes, then refresh
        setTimeout(fetchTemplates, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Could not generate invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-8 p-6 bg-card border rounded-xl shadow-sm text-card-foreground">
      <h3 className="mb-4 text-xl font-bold tracking-tight mt-0">
        Hybrid Business Invoice Generator
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button 
          onClick={() => setActiveTab("FORM")}
          className={`px-4 py-2 font-semibold -mb-px border-b-2 transition-colors ${activeTab === "FORM" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          FORM
        </button>
        <button 
          onClick={() => setActiveTab("PROMPT")}
          className={`px-4 py-2 font-semibold -mb-px border-b-2 transition-colors ${activeTab === "PROMPT" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          PROMPT
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {activeTab === "FORM" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Industry Type</label>
                <button 
                  onClick={fetchTemplates}
                  title="Refresh Templates"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Refresh 🔄
                </button>
              </div>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.industryType}
                onChange={(e) => setForm({ ...form, industryType: e.target.value })}
              >
                {persistentTemplates.length === 0 && <option value="">Loading templates...</option>}
                {persistentTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Business Name</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. My Awesome Shop"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Budget</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">GST %</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                type="number"
                value={form.gstPercent}
                onChange={(e) => setForm({ ...form, gstPercent: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="budgetIncludesGST"
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                checked={form.budgetIncludesGST}
                onChange={(e) => setForm({ ...form, budgetIncludesGST: e.target.checked })}
              />
              <label htmlFor="budgetIncludesGST" className="text-sm text-foreground cursor-pointer">Budget includes GST</label>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Setup Mode</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Describe your setup</label>
            <textarea
              className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="e.g. Create a quotation for a Medical Store with a budget of 10 Lakhs including 18% GST"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground items-center">
              <span className="font-bold text-foreground">Try:</span>
              {[
                "Medical Store setup for 10 Lakhs including 18% GST",
                "Bakery shop with 5 Lakhs budget and 12% GST",
                "Textile business setup cost 15 Lakhs"
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={handleGenerate}
          disabled={loading || (activeTab === "PROMPT" && !prompt.trim())}
          className={`mt-4 px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${
            loading || (activeTab === "PROMPT" && !prompt.trim()) 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {loading ? "Generating..." : "Generate Invoice"}
        </button>
        
        {error && (
          <p className="text-destructive text-sm font-medium mt-2">
            ⚠️ {error}
          </p>
        )}
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/DataTable";
import { columns, ProductRow } from "./columns";
import { useDebounce } from "@/hooks/useDebounce";
import { FormDialog } from "@/components/ui/form-dialog";
import { ProductForm } from "./ProductForm";

const tabs = ["All Items", "Products", "Services"] as const;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All Items");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tab === "Products") params.set("kind", "product");
      if (tab === "Services") params.set("kind", "service");
      // Fetch all so we see active and inactive
      params.set("active", "false"); 

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const formatted: ProductRow[] = data.data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
        pricing_model: p.pricing_model,
        unit: p.unit,
        default_rate_minor: p.default_rate_minor,
        default_percent_bp: p.default_percent_bp,
        is_active: p.is_active,
        currency: data.data.currency, // Add currency to the row
      }));

      setProducts(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, tab]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-muted-foreground">Manage your catalog items.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormDialog
            isOpen={isNewOpen}
            onOpenChange={setIsNewOpen}
            title="Add Item"
            className="sm:max-w-xl"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            }
          >
            <ProductForm 
              onSuccess={() => {
                setIsNewOpen(false);
                fetchProducts();
              }} 
              onCancel={() => setIsNewOpen(false)}
            />
          </FormDialog>
        </div>
      </div>

      <div className="flex rounded-lg border border-border p-1 bg-background w-max mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md font-medium transition-colors",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
      />
    </div>
  );
}

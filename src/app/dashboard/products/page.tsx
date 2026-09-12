"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { MockProduct } from "@/lib/mockData";

const tabs = ["All Items", "Physical", "Services", "Digital"] as const;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All Items");
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        
        // Map database product fields to UI MockProduct interface if necessary
        const fetchedProducts = (json.products || []).map((p: any) => ({
          id: p.id || p.sku || Math.random().toString(),
          name: p.name || "Unnamed Product",
          sku: p.sku || "N/A",
          category: p.category || "Physical",
          taxRate: p.taxRate || "0%",
          status: p.status || "ACTIVE",
          price: p.price ? `$${p.price}` : "$0.00"
        }));
        
        setProducts(fetchedProducts);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesTab =
      tab === "All Items" ||
      (tab === "Services" && p.category === "Service") ||
      p.category === tab;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by item name, SKU, category..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-border p-1 bg-background">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md font-medium transition-colors",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Button onClick={() => toast.info("Adding products is coming soon.")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product / Service
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Product / Service</TableHead>
              <TableHead>SKU Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tax Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rate / Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center p-0">
                  <EmptyState
                    title="No matching products"
                    description="Adjust your filters or search for a different item."
                    icon={<Package className="h-6 w-6" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">B2B Automated Ledger Item</p>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{product.taxRate}</TableCell>
                  <TableCell>
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{product.price}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

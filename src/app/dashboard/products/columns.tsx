"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDialog } from "@/components/ui/form-dialog";
import { ProductForm, ProductFormValues } from "./ProductForm";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type ProductRow = {
  id: string;
  name: string;
  kind: "product" | "service";
  pricing_model: "fixed" | "hourly" | "daily" | "quantity" | "percentage";
  unit: string | null;
  default_rate_minor: number | null;
  default_percent_bp: number | null;
  is_active: boolean;
  currency?: string;
};

// Reusable formatters
const formatCurrency = (minor: number, currencyCode: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(minor / 100);
};
const formatPercent = (bp: number) => `${(bp / 100).toFixed(2)}%`;

const ActionCell = ({ product }: { product: ProductRow }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const handleDeactivate = async () => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`${product.name} deactivated`);
      router.refresh();
      // Normally we would use a context to trigger re-fetch, but here we can just reload the page or rely on router.refresh() if the parent component listens to it.
      // We will let the parent handle the refresh via router.refresh() intercept or simple reload.
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate");
    }
  };

  const handleActivate = async () => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`${product.name} activated`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate");
    }
  };

  const initialValues: Partial<ProductFormValues> = {
    name: product.name,
    kind: product.kind,
    pricing_model: product.pricing_model,
    unit: product.unit || "",
    default_rate_minor: product.default_rate_minor ? product.default_rate_minor.toString() : "",
    default_percent_bp: product.default_percent_bp ? product.default_percent_bp.toString() : "",
    is_active: product.is_active,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          {product.is_active ? (
            <DropdownMenuItem onClick={handleDeactivate} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleActivate}>
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={`Edit ${product.kind === "service" ? "Service" : "Product"}`}
        className="sm:max-w-xl"
      >
        <ProductForm 
          initialValues={initialValues}
          productId={product.id}
          onSuccess={() => {
            setIsEditOpen(false);
            window.location.reload();
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </FormDialog>
    </>
  );
};

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div>
          <p className="font-semibold text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{p.kind}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "pricing_model",
    header: "Pricing Model",
    cell: ({ row }) => <span className="capitalize">{row.original.pricing_model}</span>,
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.unit || "—"}</span>,
  },
  {
    accessorKey: "rate",
    header: () => <div className="text-right">Rate / Percent</div>,
    cell: ({ row }) => {
      const p = row.original;
      let display = "—";
      if (p.pricing_model === "percentage" && p.default_percent_bp != null) {
        display = formatPercent(p.default_percent_bp);
      } else if (p.default_rate_minor != null) {
        display = formatCurrency(p.default_rate_minor, p.currency);
      }
      return <div className="text-right font-mono">{display}</div>;
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <div className="flex justify-end">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell product={row.original} />,
  },
];

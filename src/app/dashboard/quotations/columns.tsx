"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge, toneForQuotationStatus } from "@/components/ui/status-badge";
import { formatMinor } from "@/modules/quotation/quotation.money";
import type { QuotationListRow } from "@/modules/quotation/quotation.types";

export const columns: ColumnDef<QuotationListRow>[] = [
  {
    accessorKey: "quote_number",
    header: "Quotation",
    cell: ({ row }) => {
      const q = row.original;
      return (
        <Link href={`/dashboard/quotations/${q.id}`} className="block">
          <p className="font-mono text-sm font-semibold text-foreground hover:underline">{q.quote_number ?? "Draft"}</p>
          <p className="text-xs text-muted-foreground">{q.title || "Untitled quotation"}</p>
        </Link>
      );
    },
  },
  {
    id: "customer",
    header: "Customer / project",
    cell: ({ row }) => (
      <div className="text-sm">
        <p className="text-foreground">{row.original.customer?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{row.original.project?.name ?? "—"}</p>
      </div>
    ),
  },
  {
    accessorKey: "valid_until",
    header: "Valid until",
    cell: ({ row }) => {
      const d = row.original.valid_until;
      return <span className="font-mono text-xs text-muted-foreground">{d ? format(new Date(d), "dd MMM yyyy") : "—"}</span>;
    },
  },
  {
    accessorKey: "total_minor",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">{formatMinor(row.original.total_minor, row.original.currency)}</div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <StatusBadge status={row.original.status} tone={toneForQuotationStatus(row.original.status)} />
      </div>
    ),
  },
];

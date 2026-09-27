"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusBadge, toneForProjectStatus } from "@/components/ui/status-badge";
import { format } from "date-fns";

export type ProjectRow = {
  id: string;
  name: string;
  customer_name: string;
  status: string;
  created_at: string;
  expected_end_date: string | null;
};

export const columns: ColumnDef<ProjectRow>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <Link href={`/dashboard/projects/${project.id}`} className="block">
          <p className="font-semibold text-foreground hover:underline">{project.name}</p>
          <p className="text-xs text-muted-foreground">{project.customer_name}</p>
        </Link>
      );
    },
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.customer_name}</span>
    ),
  },
  {
    accessorKey: "expected_end_date",
    header: "Due",
    cell: ({ row }) => {
      const d = row.original.expected_end_date;
      return (
        <span className="text-muted-foreground font-mono text-xs">
          {d ? format(new Date(d), "dd MMM yyyy") : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <div className="flex justify-end">
          <StatusBadge status={s} tone={toneForProjectStatus(s)} />
        </div>
      );
    },
  },
];

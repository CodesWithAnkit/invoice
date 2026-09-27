"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "archived";
  invoiceCount: number;
};

export const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <Link href={`/dashboard/customers/${customer.id}`} className="block">
          <p className="font-semibold text-foreground hover:underline">{customer.name}</p>
          {customer.email && (
            <p className="text-xs text-muted-foreground">{customer.email}</p>
          )}
        </Link>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      return <span className="text-muted-foreground">{row.original.phone || "—"}</span>;
    },
  },
  {
    accessorKey: "invoiceCount",
    header: () => <div className="text-right">Invoices</div>,
    cell: ({ row }) => {
      return <div className="text-right font-mono">{row.original.invoiceCount}</div>;
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-right">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex justify-end">
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
      );
    },
  },
];

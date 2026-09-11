"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockCustomers } from "@/lib/mockData";

// Static/mock detail view — see context/redesign_implementation_plan.md Phase 5.
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customer = mockCustomers.find((c) => c.id === params?.id);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-foreground">
        <h2 className="text-xl font-bold mb-4">Customer Not Found</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customers
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{customer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-border text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ACH Target Node</span>
                <span className="font-mono">{customer.achTargetNode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jurisdiction</span>
                <span>{customer.jurisdiction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax Identification</span>
                <span className="font-mono">{customer.taxId}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Settled Volume YTD
            </p>
            <p className="font-mono text-2xl font-bold">
              ${customer.settledVolumeYtd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Outstanding Disbursements
            </p>
            <p className="font-mono text-2xl font-bold">
              ${customer.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-border bg-card overflow-hidden h-fit">
          <p className="font-semibold text-foreground p-5 pb-4">Disbursement Ledger History</p>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Settled Date</TableHead>
                <TableHead className="text-right">Settled Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.ledgerHistory.map((entry) => (
                <TableRow key={entry.invoiceId}>
                  <TableCell className="font-mono font-semibold">{entry.invoiceId}</TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.settledDate}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    ${entry.settledAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

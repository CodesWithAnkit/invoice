"use client";

import { useState } from "react";
import Link from "next/link";
import { SquareArrowOutUpRight } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SparklineChart } from "@/components/dashboard/SparklineChart";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { mockRecentInvoices, mockRevenueTrend } from "@/lib/mockData";

// NOTE: this entire page is static/mock data — there is no backend for
// dashboard-level KPIs, trends, or a "recent invoices" widget yet. The real
// invoice list lives at /dashboard/invoices and reads from Supabase.
// See context/redesign_implementation_plan.md (Phase 2).

const kpis = [
  { label: "Total Revenue YTD", value: "$12,482,900.50", trend: "+18.4%", trendTone: "success" as const, helperText: "Automated batch calculations" },
  { label: "Outstanding Invoices", value: "$1,402,890.12", trend: "+4.2%", trendTone: "success" as const, helperText: "Awaiting reconciliation" },
  { label: "Paid This Period", value: "$4,892,104.50", trend: "+24.1%", trendTone: "success" as const, helperText: "Settled within 15 days" },
  { label: "Overdue Balance", value: "$104,200.00", trend: "-12.5%", trendTone: "danger" as const, helperText: "Past grace timelines" },
];

export default function OverviewPage() {
  const [range, setRange] = useState<"monthly" | "weekly">("monthly");

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-foreground">Revenue &amp; Disbursement Trends</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={range === "monthly" ? "default" : "outline"}
                onClick={() => setRange("monthly")}
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant={range === "weekly" ? "default" : "outline"}
                onClick={() => setRange("weekly")}
              >
                Weekly
              </Button>
            </div>
          </div>
          <div className="h-56 rounded-lg border border-border/60 p-3">
            <SparklineChart data={mockRevenueTrend[range]} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-semibold text-foreground mb-4">Invoice Resolution Status</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reconciled</span>
              <span className="font-mono font-semibold">82%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Awaiting Payment</span>
              <span className="font-mono font-semibold">14%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed / Disputed</span>
              <span className="font-mono font-semibold">4%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-4">
          <p className="font-semibold text-foreground">Recent Active Invoices</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/invoices">
              <SquareArrowOutUpRight className="mr-2 h-3.5 w-3.5" />
              View Full Register
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-border">
          {mockRecentInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{invoice.customer}</p>
                <p className="text-xs text-muted-foreground font-mono">{invoice.id}</p>
              </div>
              <span className="hidden sm:block text-muted-foreground shrink-0">{invoice.date}</span>
              <StatusBadge status={invoice.status} className="shrink-0" />
              <span className="font-mono font-semibold shrink-0 w-28 text-right">
                ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

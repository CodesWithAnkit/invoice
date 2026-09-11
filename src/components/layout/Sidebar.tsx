"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  FileText,
  Users,
  Package,
  CreditCard,
  Receipt,
  FileClock,
  BarChart3,
  RefreshCcw,
  Wallet,
  Percent,
  ScrollText,
  Workflow,
  Landmark,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNavItems = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
];

// These modules are explicitly out-of-scope (see context/project_overview.md)
// and have no backend today — they render as static, disabled entries so the
// sidebar matches the Northstar design without implying functionality that
// doesn't exist yet.
const automatedModules = [
  { name: "Payments", icon: CreditCard },
  { name: "Expenses", icon: Receipt },
  { name: "Estimates", icon: FileClock },
  { name: "Reports", icon: BarChart3 },
  { name: "Subscriptions", icon: RefreshCcw },
  { name: "Payroll", icon: Wallet },
  { name: "Tax Engine", icon: Percent },
  { name: "Audit Log", icon: ScrollText },
  { name: "Workflows", icon: Workflow },
  { name: "Treasury", icon: Landmark },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-screen w-64 flex-col fixed inset-y-0 z-50 bg-background border-r border-border no-print">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4 lg:h-15 lg:px-6">
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground">
          <Compass className="h-3.5 w-3.5" />
        </div>
        <span className="font-bold tracking-tight text-sm">NORTHSTAR</span>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <div className="px-4 lg:px-6 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Primary Operating Register
          </p>
        </div>
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition-all",
                  isActive
                    ? "border-border bg-card text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 lg:px-6 mt-6 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Automated Modules ({automatedModules.length} total)
          </p>
        </div>
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {automatedModules.map((item) => (
            <span
              key={item.name}
              title="Coming soon"
              aria-disabled="true"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground/50 cursor-not-allowed select-none"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </span>
          ))}
        </nav>
      </div>

      <div className="border-t border-border p-3 space-y-1">
        <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed select-none">
          <HelpCircle className="h-4 w-4" />
          Help &amp; System Status
        </span>
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            pathname.startsWith("/dashboard/settings")
              ? "bg-card text-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          System Settings
        </Link>
        <div className="mt-2 rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">Acme Corp</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
      </div>
    </div>
  );
}

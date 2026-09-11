"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Clients", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 flex md:hidden border-t border-border bg-background no-print">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}

import {
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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const primaryNavItems: NavItem[] = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
];

export const automatedModules: NavItem[] = [
  { name: "Payments", icon: CreditCard, disabled: true },
  { name: "Expenses", icon: Receipt, disabled: true },
  { name: "Estimates", icon: FileClock, disabled: true },
  { name: "Reports", icon: BarChart3, disabled: true },
  { name: "Subscriptions", icon: RefreshCcw, disabled: true },
  { name: "Payroll", icon: Wallet, disabled: true },
  { name: "Tax Engine", icon: Percent, disabled: true },
  { name: "Audit Log", icon: ScrollText, disabled: true },
  { name: "Workflows", icon: Workflow, disabled: true },
  { name: "Treasury", icon: Landmark, disabled: true },
];

export const routeTitles: { href: string; eyebrow: string; title: string }[] = [
  { href: "/dashboard/overview", eyebrow: "Core Dashboard", title: "Financial Operations" },
  { href: "/dashboard/invoices", eyebrow: "Billing Center", title: "Invoice Registry" },
  { href: "/dashboard/customers", eyebrow: "Directories", title: "Customer Profiles" },
  { href: "/dashboard/products", eyebrow: "Product Operations", title: "Registry Catalog" },
  { href: "/dashboard/settings", eyebrow: "System Configuration", title: "Global Workspace Settings" },
];

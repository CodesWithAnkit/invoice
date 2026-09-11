// Static/mock data for design-only surfaces that have no backend yet
// (see context/redesign_implementation_plan.md for scope notes).

export const mockRecentInvoices = [
  { id: "INV-90204", customer: "Stripe Inc.", date: "Mar 18, 2026", status: "RECONCILED", amount: 42500.0 },
  { id: "INV-90203", customer: "Linear Orbit", date: "Mar 17, 2026", status: "DUE", amount: 8120.0 },
  { id: "INV-90202", customer: "Retool Corp", date: "Mar 16, 2026", status: "RECONCILED", amount: 124000.5 },
  { id: "INV-90201", customer: "Supabase PBC", date: "Mar 15, 2026", status: "FAILED PAYOUT", amount: 15250.0 },
];

export const mockRevenueTrend = {
  monthly: [42, 55, 48, 63, 58, 71, 66, 80, 74, 88, 82, 95],
  weekly: [60, 65, 58, 70, 68, 74, 72],
};

export const mockResolutionStatus = [
  { label: "Reconciled", value: 82 },
  { label: "Awaiting Payment", value: 14 },
  { label: "Failed / Disputed", value: 4 },
];

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  ledgerCount: number;
  outstanding: number;
  settledVolumeYtd: number;
  lastEvent: string;
  achTargetNode: string;
  jurisdiction: string;
  taxId: string;
  ledgerHistory: { invoiceId: string; status: string; settledDate: string; settledAmount: number }[];
}

export const mockCustomers: MockCustomer[] = [
  {
    id: "acme-corp",
    name: "Acme Corp Ltd.",
    email: "reconcile@acme.co.uk",
    ledgerCount: 12,
    outstanding: 24500.0,
    settledVolumeYtd: 2480900.0,
    lastEvent: "10m ago",
    achTargetNode: "****4471",
    jurisdiction: "United Kingdom",
    taxId: "GB-778210044",
    ledgerHistory: [
      { invoiceId: "INV-90188", status: "RECONCILED", settledDate: "Mar 02, 2026", settledAmount: 12500.0 },
    ],
  },
  {
    id: "vercel-inc",
    name: "Vercel Inc",
    email: "billing@vercel.com",
    ledgerCount: 48,
    outstanding: 812000.0,
    settledVolumeYtd: 1892104.5,
    lastEvent: "1h ago",
    achTargetNode: "****2201",
    jurisdiction: "United States",
    taxId: "US-556210044",
    ledgerHistory: [
      { invoiceId: "INV-90177", status: "RECONCILED", settledDate: "Feb 22, 2026", settledAmount: 82000.0 },
    ],
  },
  {
    id: "supabase-pbc",
    name: "Supabase PBC",
    email: "finance@supabase.io",
    ledgerCount: 32,
    outstanding: 124009.5,
    settledVolumeYtd: 912044.11,
    lastEvent: "3h ago",
    achTargetNode: "****9081",
    jurisdiction: "United States",
    taxId: "US-901248902",
    ledgerHistory: [
      { invoiceId: "INV-90201", status: "FAILED PAYOUT", settledDate: "Mar 15, 2026", settledAmount: 15250.0 },
    ],
  },
  {
    id: "stripe-inc",
    name: "Stripe Inc.",
    email: "settlements@stripe.com",
    ledgerCount: 11,
    outstanding: 0.0,
    settledVolumeYtd: 4892104.5,
    lastEvent: "1d ago",
    achTargetNode: "****8904",
    jurisdiction: "United States",
    taxId: "US-901248902",
    ledgerHistory: [
      { invoiceId: "INV-90204", status: "RECONCILED", settledDate: "Mar 18, 2026", settledAmount: 42500.0 },
      { invoiceId: "INV-90180", status: "RECONCILED", settledDate: "Feb 18, 2026", settledAmount: 38400.0 },
      { invoiceId: "INV-90165", status: "RECONCILED", settledDate: "Jan 18, 2026", settledAmount: 40112.5 },
    ],
  },
];

export interface MockProduct {
  id: string;
  name: string;
  sku: string;
  category: "Physical" | "Service" | "Digital";
  taxRate: string;
  status: string;
  price: string;
}

export const mockProducts: MockProduct[] = [
  { id: "1", name: "SaaS Enterprise Integration SLA", sku: "SRV-SLA-001", category: "Service", taxRate: "0% (Exempt)", status: "ACTIVE", price: "$2,500.00 / mo" },
  { id: "2", name: "Automated Reconciliation Terminal", sku: "HW-TRM-902", category: "Physical", taxRate: "8.25%", status: "ACTIVE", price: "$899.00" },
  { id: "3", name: "Northstar Core Engine API Kit", sku: "LIC-CORE-Y", category: "Digital", taxRate: "0% (Exempt)", status: "ACTIVE", price: "$12,400.00 / yr" },
  { id: "4", name: "Legacy DB Migration Pipeline Setup", sku: "SRV-MIG-12", category: "Service", taxRate: "8.25%", status: "ACTIVE", price: "$450.00 / hr" },
  { id: "5", name: "Hardware Secure HSM Server V2", sku: "HW-HSM-50", category: "Physical", taxRate: "8.25%", status: "BACKORDERED", price: "$5,200.00" },
  { id: "6", name: "Custom Billing Module Deployment", sku: "SRV-CUST-BL", category: "Service", taxRate: "8.25%", status: "DEPRECATED", price: "$180.00 / hr" },
  { id: "7", name: "Multi-Region VAT Rule Pack", sku: "LIC-VAT-GL", category: "Digital", taxRate: "0% (Exempt)", status: "ACTIVE", price: "$1,200.00 / yr" },
];

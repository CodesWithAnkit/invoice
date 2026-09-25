"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { fetchCustomersWithInvoiceStats } from "@/modules/invoice/invoice.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { MockCustomer } from "@/lib/mockData";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { customers: customerRows, invoiceStats } = await fetchCustomersWithInvoiceStats();

        const customerStats = new Map<string, { count: number; outstanding: number; settled: number }>();

        invoiceStats.forEach((inv) => {
          const stats = customerStats.get(inv.customer_id) || { count: 0, outstanding: 0, settled: 0 };
          stats.count += 1;
          if (inv.pdf_url) {
            stats.settled += (inv.total || 0);
          } else {
            stats.outstanding += (inv.total || 0);
          }
          customerStats.set(inv.customer_id, stats);
        });

        const formatted: MockCustomer[] = customerRows.map(c => {
          const stats = customerStats.get(c.id) || { count: 0, outstanding: 0, settled: 0 };
          return {
            id: c.id,
            name: c.name || "Unknown",
            email: c.phone || "No phone", // Reusing email field for phone since the UI uses it for subtext
            ledgerCount: stats.count,
            outstanding: stats.outstanding,
            settledVolumeYtd: stats.settled,
            lastEvent: "Active", // simplified
            achTargetNode: "",
            jurisdiction: "",
            taxId: c.aadhaar || "",
            ledgerHistory: []
          };
        });
        
        setCustomers(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer directories..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => toast.info("Adding customer records is coming soon.")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Customer Record
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Corporate Entity / Primary Routing</TableHead>
              <TableHead className="text-right">Ledger Count</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Settled Volume YTD</TableHead>
              <TableHead className="text-right">Last Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center p-0">
                  <EmptyState
                    title="No matching customers"
                    description="Adjust your search to find a customer record."
                    icon={<Users className="h-6 w-6" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/dashboard/customers/${customer.id}`} className="block">
                      <p className="font-semibold text-foreground hover:underline">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {customer.ledgerCount} Invoices
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    ${customer.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    ${customer.settledVolumeYtd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{customer.lastEvent}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

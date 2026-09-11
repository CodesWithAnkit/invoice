"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
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
import { mockCustomers } from "@/lib/mockData";

// Static/mock directory — a real `customers` table already exists in
// Supabase (used when saving invoices), but this list isn't wired to it yet.
// See context/redesign_implementation_plan.md Phase 5.
export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockCustomers.filter(
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

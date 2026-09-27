"use client";

import { useState, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { DataTable } from "@/components/DataTable";
import { columns, CustomerRow } from "./columns";
import { useDebounce } from "@/hooks/useDebounce";
import { FormDialog } from "@/components/ui/form-dialog";
import { CustomerForm } from "./CustomerForm";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch customers");

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const customerRows = data.data.customers;
      const invoiceStats = data.data.invoiceStats;

      const customerStats = new Map<string, { count: number }>();
      invoiceStats.forEach((inv: any) => {
        const stats = customerStats.get(inv.customer_id) || { count: 0 };
        stats.count += 1;
        customerStats.set(inv.customer_id, stats);
      });

      const formatted: CustomerRow[] = customerRows.map((c: any) => ({
        id: c.id,
        name: c.name || "Unknown",
        email: c.email || null,
        phone: c.phone || null,
        status: c.status || "active",
        invoiceCount: customerStats.get(c.id)?.count || 0,
      }));

      setCustomers(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [debouncedSearch]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your client directory.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormDialog
            isOpen={isNewCustomerOpen}
            onOpenChange={setIsNewCustomerOpen}
            title="New Customer"
            className="sm:max-w-xl"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            }
          >
            <CustomerForm 
              onSuccess={() => {
                setIsNewCustomerOpen(false);
                fetchData();
              }} 
              onCancel={() => setIsNewCustomerOpen(false)}
            />
          </FormDialog>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        isLoading={loading}
      />
    </div>
  );
}

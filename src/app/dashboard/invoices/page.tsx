"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/../lib/supabase";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { InvoiceActionsMenu } from "@/components/dashboard/InvoiceActionsMenu";

export default function InvoiceDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    fetchInvoices();
  }, [search, filterType, sortOrder]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let query = supabase.from("invoices").select("*");

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`);
      }

      if (filterType !== "all") {
        query = query.eq("invoice_type", filterType);
      }

      if (sortOrder === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortOrder === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sortOrder === "highest") {
        query = query.order("total", { ascending: false });
      } else if (sortOrder === "lowest") {
        query = query.order("total", { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      await supabase.from("invoices").delete().eq("id", id);
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Invoice Management"
        description="Manage, search, and organize your invoices."
        action={
          <Button asChild>
            <Link href="/">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer or invoice #..."
            className="pl-8 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 sm:w-auto w-full">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Proforma">Proforma</SelectItem>
              <SelectItem value="Tax">Tax</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
              <SelectItem value="lowest">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center p-0">
                  <EmptyState
                    title="No invoices found"
                    description="You don't have any invoices matching your current filters."
                    icon={<FileText className="h-6 w-6" />}
                    action={
                      <Button asChild variant="outline" className="mt-4">
                        <Link href="/">Create your first invoice</Link>
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="group transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {invoice.invoice_type || "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{invoice.total?.toLocaleString() || "0.00"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(invoice.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <InvoiceActionsMenu 
                      invoiceId={invoice.id} 
                      pdfUrl={invoice.pdf_url} 
                      onDelete={handleDelete} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

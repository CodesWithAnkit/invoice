"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileBadge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch } from "@/lib/api/client";
import { QUOTATION_STATUSES, type QuotationListRow } from "@/modules/quotation/quotation.types";
import { columns } from "./columns";

export default function QuotationsPage() {
  const [filters, setFilters] = useState({ search: "", status: "All" });
  const debouncedSearch = useDebounce(filters.search, 300);
  const [rows, setRows] = useState<QuotationListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.status !== "All") params.set("status", filters.status);
      const data = await apiFetch<{ quotations: QuotationListRow[] }>(`/api/quotations?${params.toString()}`);
      setRows(data.quotations);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = debouncedSearch || filters.status !== "All";

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">Create quotations from a project; they appear here once started.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Search number or title…"
          className="max-w-xs flex-1"
          aria-label="Search quotations"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          {QUOTATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={loading}
        emptyState={
          <EmptyState
            icon={<FileBadge className="h-10 w-10" />}
            title={filtered ? "No matching quotations" : "No quotations yet"}
            description={
              filtered ? "Try a different search or status." : "Open a project and choose “Create quotation” to start one."
            }
            action={
              filtered ? undefined : (
                <Button asChild>
                  <Link href="/dashboard/projects">Go to projects</Link>
                </Button>
              )
            }
          />
        }
      />
    </div>
  );
}

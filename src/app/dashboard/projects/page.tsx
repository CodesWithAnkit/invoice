"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { DataTable } from "@/components/DataTable";
import { columns, ProjectRow } from "./columns";
import { useDebounce } from "@/hooks/useDebounce";
import { FormDialog } from "@/components/ui/form-dialog";
import { ProjectForm } from "./ProjectForm";
import { EmptyState } from "@/components/EmptyState";

const ALL_STATUSES = [
  "All",
  "Draft",
  "Estimating",
  "Quoted",
  "Accepted",
  "Rejected",
  "Expired",
  "Completed",
  "Archived",
];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("All");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const rows: ProjectRow[] = data.data.projects.map(
        (p: {
          id: string;
          name: string;
          status: string;
          created_at: string;
          expected_end_date: string | null;
          customers?: { name: string } | null;
        }) => ({
          id: p.id,
          name: p.name,
          customer_name: p.customers?.name ?? "—",
          status: p.status,
          created_at: p.created_at,
          expected_end_date: p.expected_end_date,
        })
      );
      setProjects(rows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by status"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>
        </div>

        <FormDialog
          isOpen={isNewProjectOpen}
          onOpenChange={setIsNewProjectOpen}
          title="New Project"
          description="Create a new project and link it to a customer."
          trigger={
            <Button id="new-project-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          }
        >
          <ProjectForm
            onSuccess={() => {
              setIsNewProjectOpen(false);
              fetchData();
            }}
            onCancel={() => setIsNewProjectOpen(false)}
          />
        </FormDialog>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        isLoading={loading}
        emptyState={
          <EmptyState
            icon={<FolderKanban className="w-10 h-10" />}
            title="No projects yet"
            description="Create a project and link it to a customer to start building quotations."
            action={
              <Button onClick={() => setIsNewProjectOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            }
          />
        }
      />
    </div>
  );
}

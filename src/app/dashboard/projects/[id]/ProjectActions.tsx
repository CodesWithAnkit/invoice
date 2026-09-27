"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectForm, ProjectFormValues } from "../ProjectForm";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  status: string;
  start_date?: string | null;
  expected_end_date?: string | null;
  customers?: Customer | null;
}

interface ProjectActionsProps {
  project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const initialValues: Partial<ProjectFormValues> = {
    name: project.name,
    customer_id: project.customers?.id || "",
    description: project.description || "",
    notes: project.notes || "",
    start_date: project.start_date || "",
    expected_end_date: project.expected_end_date || "",
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Project archived");
      router.push("/dashboard/projects");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to archive");
    } finally {
      setArchiving(false);
      setArchiveOpen(false);
    }
  };

  return (
    <div className="flex gap-2">
      <FormDialog
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Project"
        trigger={
          <Button variant="outline" size="sm" id="edit-project-btn">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        }
      >
        <ProjectForm
          initialValues={initialValues}
          projectId={project.id}
          onSuccess={() => {
            setEditOpen(false);
            router.refresh();
          }}
          onCancel={() => setEditOpen(false)}
        />
      </FormDialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive Project"
        description="This will archive the project. Existing quotations will be preserved. You can find archived projects by filtering by 'Archived' status."
        confirmLabel={archiving ? "Archiving…" : "Archive"}
        onConfirm={handleArchive}
        trigger={
          <Button variant="outline" size="sm" id="archive-project-btn">
            <Trash2 className="w-4 h-4 mr-2" />
            Archive
          </Button>
        }
      />
    </div>
  );
}

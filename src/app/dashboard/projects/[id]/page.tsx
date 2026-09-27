import { requireBusiness } from "@/lib/api/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, User } from "lucide-react";
import { StatusBadge, toneForProjectStatus, toneForQuotationStatus } from "@/components/ui/status-badge";
import { ActivityTimeline, TimelineEvent } from "@/components/ActivityTimeline";
import { ProjectActions } from "./ProjectActions";
import { CreateQuotationButton } from "./CreateQuotationButton";
import { formatMinor } from "@/modules/quotation/quotation.money";
import { format } from "date-fns";
import { deriveProjectStatus } from "@/modules/project/project.status";

type QuotationRow = {
  id: string;
  status: string;
  title: string;
  quote_number: string | null;
  total_minor: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireBusiness();
  if (!auth.ok) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    return null;
  }

  const { id } = await params;
  const { supabase, businessId } = auth;

  const res = await supabase
    .from("projects")
    .select(`
      *,
      customers ( id, name, email, phone ),
      quotations ( id, status, title, quote_number, total_minor, currency, created_at, updated_at )
    `)
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (res.error || !res.data) {
    notFound();
  }

  const project = res.data;
  const customer = project.customers as { id: string; name: string; email?: string | null; phone?: string | null } | null;
  const quotations = (project.quotations as QuotationRow[]) || [];

  // Derive display status (R-18)
  const displayStatus = deriveProjectStatus(project.status as string, quotations);

  // Build activity timeline from timestamps
  const activityEvents: TimelineEvent[] = [
    {
      id: "created",
      title: "Project Created",
      date: format(new Date(project.created_at as string), "dd MMM yyyy"),
      time: format(new Date(project.created_at as string), "HH:mm"),
    },
    ...quotations.map((q) => ({
      id: q.id,
      title: `Quotation — ${q.status}`,
      date: format(new Date(q.updated_at), "dd MMM yyyy"),
      time: format(new Date(q.updated_at), "HH:mm"),
      description: `Status: ${q.status}`,
    })),
  ].sort((a, b) => {
    // Sort by raw date for correct timeline order
    return 0; // already in insert order from above
  });

  const projectForActions = {
    id: project.id as string,
    name: project.name as string,
    description: project.description as string | null | undefined,
    notes: project.notes as string | null | undefined,
    status: displayStatus,
    start_date: project.start_date as string | null | undefined,
    expected_end_date: project.expected_end_date as string | null | undefined,
    customers: customer,
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{project.name as string}</h1>
            <StatusBadge status={displayStatus} tone={toneForProjectStatus(displayStatus)} />
          </div>
          {(project.description as string | null) && (
            <p className="text-muted-foreground mt-1 max-w-2xl">{project.description as string}</p>
          )}
        </div>
        <ProjectActions project={projectForActions} />
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer
          </h2>
          {customer ? (
            <div className="space-y-2 text-sm">
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className="font-semibold text-foreground hover:underline block"
              >
                {customer.name}
              </Link>
              {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
              {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No customer linked</p>
          )}
        </div>

        {/* Timeline card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Schedule
          </h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Start</p>
              <p>
                {(project.start_date as string | null)
                  ? format(new Date(project.start_date as string), "dd MMM yyyy")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Due</p>
              <p>
                {(project.expected_end_date as string | null)
                  ? format(new Date(project.expected_end_date as string), "dd MMM yyyy")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-foreground">Quotations</h2>
            <span className="text-xs text-muted-foreground">{quotations.length} total</span>
          </div>
          <CreateQuotationButton projectId={project.id as string} disabled={project.status === "Archived"} />
        </div>
        {quotations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No quotations yet. Create one to start estimating.
          </p>
        ) : (
          <div className="space-y-2">
            {quotations.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <Link
                  href={`/dashboard/quotations/${q.id}`}
                  className="min-w-0 truncate text-sm font-medium text-foreground hover:underline"
                >
                  {q.quote_number ? `${q.quote_number} · ` : ""}
                  {q.title || "Untitled quotation"}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">{formatMinor(q.total_minor, q.currency)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(q.created_at), "dd MMM yyyy")}
                  </span>
                  <StatusBadge status={q.status} tone={toneForQuotationStatus(q.status)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground border-b border-border pb-2">Activity</h2>
        <ActivityTimeline events={activityEvents} />
      </div>

      {/* Internal notes */}
      {(project.notes as string | null) && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h2 className="font-semibold text-foreground border-b border-border pb-2">
            Internal Notes
          </h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{project.notes as string}</p>
        </div>
      )}
    </div>
  );
}

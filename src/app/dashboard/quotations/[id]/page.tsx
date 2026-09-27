import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import "@/styles/quotation-print.css";
import { requireBusiness } from "@/lib/api/auth";
import { isUuid } from "@/lib/api/validate";
import { ActivityTimeline, type TimelineEvent } from "@/components/ActivityTimeline";
import { StatusBadge, toneForQuotationStatus } from "@/components/ui/status-badge";
import { QuotationDocumentView } from "@/components/quotation/QuotationDocumentView";
import { formatMinor } from "@/modules/quotation/quotation.money";
import { getQuotation, getQuotationDocument, listActivity } from "@/modules/quotation/quotation.service";
import type { QuotationActivityRecord } from "@/modules/quotation/quotation.types";
import { QuotationActions } from "./QuotationActions";

const ACTIVITY_TITLES: Record<QuotationActivityRecord["type"], string> = {
  created: "Created",
  updated: "Updated",
  sent: "Sent",
  viewed: "Viewed by client",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  revised: "Revision started",
  archived: "Archived",
  duplicated: "Created as a copy",
  link_regenerated: "Client link replaced",
};

function toEvent(a: QuotationActivityRecord, currency: string): TimelineEvent {
  const p = a.payload ?? {};
  const details: string[] = [];
  if (a.version) details.push(`Version ${a.version}`);
  if (typeof p.quote_number === "string") details.push(p.quote_number);
  if (typeof p.total_minor === "number") details.push(formatMinor(p.total_minor, currency));
  if (typeof p.from_quote_number === "string") details.push(`from ${p.from_quote_number}`);
  if (a.actor !== "owner") details.push(`by ${a.actor}`);
  const at = new Date(a.created_at);
  return {
    id: a.id,
    title: ACTIVITY_TITLES[a.type] ?? a.type,
    date: format(at, "dd MMM yyyy"),
    time: format(at, "HH:mm"),
    description: details.join(" · ") || undefined,
  };
}

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBusiness();
  if (!auth.ok) redirect("/login");

  const { id } = await params;
  if (!isUuid(id)) notFound();

  const record = await getQuotation(auth.supabase, auth.businessId, id);
  if (!record) notFound();

  const [{ document, source }, activity] = await Promise.all([
    getQuotationDocument(auth.supabase, auth.businessId, record),
    listActivity(auth.supabase, auth.businessId, id),
  ]);

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const clientLink = record.public_token ? `${origin}/public/quote/${record.public_token}` : null;

  return (
    <div className="quotation-detail w-full space-y-6">
      <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href={`/dashboard/projects/${record.project_id}`}
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {record.project?.name ?? "project"}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{record.quote_number ?? "Draft quotation"}</h1>
            <StatusBadge status={record.status} tone={toneForQuotationStatus(record.status)} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">
            {record.title} · {record.customer?.name ?? "No customer"} ·{" "}
            <span className="font-mono">{formatMinor(record.total_minor, record.currency)}</span>
            {record.current_version > 1 && ` · Version ${record.current_version}`}
          </p>
          {source === "snapshot" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Showing the version sent on {record.sent_at ? format(new Date(record.sent_at), "dd MMM yyyy, HH:mm") : "—"}.
            </p>
          )}
        </div>
        <div className="w-full lg:max-w-md">
          <QuotationActions
            id={record.id}
            status={record.status}
            clientLink={clientLink}
            draftDocument={record.status === "Draft" ? document : null}
          />
        </div>
      </div>

      <div className="quotation-layout grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section id="quotation-print-root" aria-label="Quotation preview" className="min-w-0">
          <div
            className="quotation-scroll overflow-x-auto rounded-xl border border-border bg-muted/40 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
            tabIndex={0}
            role="region"
            aria-label="Quotation document"
          >
            <div className="quotation-paper shadow-sm">
              <QuotationDocumentView document={document} />
            </div>
          </div>
        </section>

        <aside className="no-print space-y-4" aria-label="Quotation activity">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 border-b border-border pb-2 font-semibold">Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ActivityTimeline events={activity.map((a) => toEvent(a, record.currency))} />
            )}
          </div>
          {record.internal_notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 border-b border-border pb-2 font-semibold">Internal notes</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{record.internal_notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

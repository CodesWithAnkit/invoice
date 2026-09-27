"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Archive, Copy, Download, FilePen, Files, Link2, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { OnePageMeasurer, useOnePageFit } from "@/components/quotation/OnePageMeasurer";
import { allowedActions, type QuotationDocument } from "@/modules/quotation/quotation.document";
import type { QuotationStatus } from "@/modules/quotation/quotation.types";

type Dialog = "send" | "revise" | "archive" | "link" | null;

async function post<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "POST" });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body.data as T;
}

// Owner actions per the R-11 status table. The server enforces the same rules.
export function QuotationActions({
  id,
  status,
  clientLink: link,
  draftDocument,
}: {
  id: string;
  status: QuotationStatus;
  /** Absolute public URL, built on the server (null until first send). */
  clientLink: string | null;
  /** Drafts only: measured before Send so only one-page quotations go out (R-15a). */
  draftDocument: QuotationDocument | null;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const can = allowedActions(status);
  const { fit, onMeasure } = useOnePageFit();
  const tooLong = fit?.fits === false;

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
      setDialog(null);
    }
  };

  const send = () =>
    run(async () => {
      const data = await post<{ quote_number: string }>(`/api/quotations/${id}/send`);
      toast.success(`Quotation ${data.quote_number} is ready to share`);
      router.refresh();
    });

  const revise = () =>
    run(async () => {
      await post(`/api/quotations/${id}/revise`);
      router.push(`/dashboard/quotations/${id}/edit`);
    });

  const archive = () =>
    run(async () => {
      await post(`/api/quotations/${id}/archive`);
      toast.success("Quotation archived");
      router.refresh();
    });

  const duplicate = () =>
    run(async () => {
      const data = await post<{ id: string }>(`/api/quotations/${id}/duplicate`);
      toast.success("Copy created");
      router.push(`/dashboard/quotations/${data.id}/edit`);
    });

  const regenerate = () =>
    run(async () => {
      await post(`/api/quotations/${id}/link`);
      toast.success("New link created. The old link no longer works.");
      router.refresh();
    });

  const openDialog = (name: Dialog) => (open: boolean) => setDialog(open ? name : null);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {can.edit && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/quotations/${id}/edit`}>
              <FilePen className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        )}
        {can.send && (
          <ConfirmationDialog
            isOpen={dialog === "send"}
            onOpenChange={openDialog("send")}
            trigger={
              <Button size="sm" disabled={busy || tooLong || (draftDocument !== null && fit === null)}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            }
            title="Send this quotation?"
            description="This finalizes it: it gets its quote number, this version is frozen, and a client link is created. To change it later you'll create a new revision."
            confirmText="Send quotation"
            onConfirm={send}
          />
        )}
        {can.revise && (
          <ConfirmationDialog
            isOpen={dialog === "revise"}
            onOpenChange={openDialog("revise")}
            trigger={
              <Button variant="outline" size="sm" disabled={busy}>
                <FilePen className="mr-2 h-4 w-4" />
                Revise
              </Button>
            }
            title="Start a new revision?"
            description="The quotation goes back to draft as a new version. The sent version stays on record, and the quote number and client link stay the same."
            confirmText="Revise"
            onConfirm={revise}
          />
        )}
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        {can.duplicate && (
          <Button variant="outline" size="sm" onClick={duplicate} disabled={busy}>
            <Files className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
        )}
        {can.archive && (
          <ConfirmationDialog
            isOpen={dialog === "archive"}
            onOpenChange={openDialog("archive")}
            trigger={
              <Button variant="outline" size="sm" disabled={busy}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            }
            title="Archive this quotation?"
            description="Archived quotations can't be edited, sent or revised. You can still view and duplicate them."
            confirmText="Archive"
            destructive
            onConfirm={archive}
          />
        )}
      </div>

      {draftDocument && <OnePageMeasurer document={draftDocument} onMeasure={onMeasure} />}
      {tooLong && (
        <p role="status" className="flex items-start gap-1.5 text-sm text-foreground" data-testid="too-long-notice">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          Too long for one page ({fit?.usedPercent}% of the page). Shorten it in the editor before sending.
        </p>
      )}

      {link && can.regenerateLink && (
        <div className="rounded-lg border border-border bg-card p-3">
          <label htmlFor="client-link" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Link2 className="h-4 w-4" />
            Client link
          </label>
          <div className="flex gap-2">
            <Input id="client-link" readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
            <Button variant="outline" size="sm" onClick={copyLink} aria-label="Copy client link">
              <Copy className="h-4 w-4" />
            </Button>
            <ConfirmationDialog
              isOpen={dialog === "link"}
              onOpenChange={openDialog("link")}
              trigger={
                <Button variant="outline" size="sm" disabled={busy} aria-label="Regenerate client link">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              }
              title="Create a new client link?"
              description="The current link stops working immediately. Share the new link with your client."
              confirmText="Create new link"
              destructive
              onConfirm={regenerate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

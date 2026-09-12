"use client";

import { PageHeader } from "@/components/PageHeader";
import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoiceToolbar from "@/components/invoice/InvoiceToolbar";
import InvoiceLiveSummary from "@/components/invoice/InvoiceLiveSummary";

interface InvoiceWorkspaceShellProps {
  title: string;
  description: string;
  onOpenPreview: () => void;
}

// Shared page body for the three invoice workspace pages (create, edit, copy):
// a sticky title+actions header (kept visible while the long form scrolls)
// plus the main editor column and a live-totals sidebar. Used identically by
// all three so the layout only needs to change in one place.
export default function InvoiceWorkspaceShell({
  title,
  description,
  onOpenPreview,
}: InvoiceWorkspaceShellProps) {
  return (
    <>
      <div className="no-print sticky top-14 sm:top-18 lg:top-19 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-background border-b border-border py-4 [&>div]:mb-0">
        <PageHeader
          title={title}
          description={description}
          action={<InvoiceToolbar onOpenPreview={onOpenPreview} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start pt-4">
        <div className="xl:col-span-2 no-print min-w-0">
          <InvoiceEditor />
        </div>
        <div className="xl:sticky xl:top-40">
          <InvoiceLiveSummary />
        </div>
      </div>
    </>
  );
}

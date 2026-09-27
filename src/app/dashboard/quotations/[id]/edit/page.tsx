import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireBusiness } from "@/lib/api/auth";
import { isUuid } from "@/lib/api/validate";
import { EstimateBuilder } from "@/components/quotation/EstimateBuilder";
import { getQuotation, listCatalogOptions } from "@/modules/quotation/quotation.service";

export default async function QuotationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBusiness();
  if (!auth.ok) redirect("/login");

  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [quotation, catalog] = await Promise.all([
    getQuotation(auth.supabase, auth.businessId, id),
    listCatalogOptions(auth.supabase, auth.businessId),
  ]);
  if (!quotation) notFound();

  if (quotation.status !== "Draft") {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">This quotation can no longer be edited</h1>
        <p className="text-sm text-muted-foreground">Only draft quotations can be changed. Its status is {quotation.status}.</p>
        <Link href={`/dashboard/projects/${quotation.project_id}`} className="text-sm font-medium underline">
          Back to project
        </Link>
      </div>
    );
  }

  return <EstimateBuilder quotation={quotation} catalog={catalog} />;
}

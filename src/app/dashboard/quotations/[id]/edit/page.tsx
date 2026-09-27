import { notFound, redirect } from "next/navigation";
import { requireBusiness } from "@/lib/api/auth";
import { isUuid } from "@/lib/api/validate";
import { EstimateBuilder } from "@/components/quotation/EstimateBuilder";
import { buildLiveDocument, getQuotation, listCatalogOptions } from "@/modules/quotation/quotation.service";

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

  // Only drafts are editable (R-11); everything else is viewed on the detail page.
  if (quotation.status !== "Draft") redirect(`/dashboard/quotations/${quotation.id}`);

  const baseDocument = await buildLiveDocument(auth.supabase, auth.businessId, quotation);
  return <EstimateBuilder quotation={quotation} catalog={catalog} baseDocument={baseDocument} />;
}

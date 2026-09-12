"use client";

import { useInvoiceTemplate } from "@/hooks/useInvoiceTemplate";
import ClassicTemplate from "./templates/Classic";
import ModernTemplate from "./templates/Modern";

export default function InvoicePrintLayout() {
  const { template } = useInvoiceTemplate();
  return template === "classic" ? <ClassicTemplate /> : <ModernTemplate />;
}

export type DocumentType = "invoice" | "quote" | "proforma";

const TITLES: Record<DocumentType, string> = {
  invoice: "TAX INVOICE",
  quote: "PRICE QUOTE",
  proforma: "PROFORMA INVOICE",
};

const NUMBER_LABELS: Record<DocumentType, string> = {
  invoice: "Invoice No:",
  quote: "Quote No:",
  proforma: "Proforma Invoice No:",
};

export const getDocumentTitle = (type: string) => TITLES[type as DocumentType] ?? TITLES.invoice;

export const getDocumentNumberLabel = (type: string) => NUMBER_LABELS[type as DocumentType] ?? NUMBER_LABELS.invoice;

export const isProforma = (type: string) => type === "proforma";

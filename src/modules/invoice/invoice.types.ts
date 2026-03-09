export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomerData {
  name: string;
  address: string;
  fields: Record<string, string>;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
}

export interface InvoiceMeta {
  invoiceNumber: string;
  date: string;
  type: "invoice" | "quote";
}

export interface InvoiceTotals {
  subTotal: number;
  sgst: number;
  cgst: number;
  grandTotal: number;
}

export interface InvoiceData {
  businessName: string;
  businessAddress: string;
  phone: string;
  gstin: string;
  meta: InvoiceMeta;
  customer: CustomerData;
  items: InvoiceItem[];
  taxPercent?: number;
  businessType?: string;
  totals: InvoiceTotals;
  bank: BankDetails;
  amountWords: string;
  signature: string;
}

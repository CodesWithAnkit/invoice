export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomerDetails {
  name: string;
  address: string;
  mobile: string;
  aadhaar: string;
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
  customer: CustomerDetails;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  bank: BankDetails;
  amountWords: string;
}

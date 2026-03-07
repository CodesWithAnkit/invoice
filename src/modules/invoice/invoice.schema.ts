import { z } from "zod";

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be at least 0"),
  total: z.number().min(0, "Total must be at least 0"),
});

export const CustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  address: z.string().min(1, "Customer address is required"),
});

export const BankSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifsc: z.string().min(1, "IFSC code is required"),
});

export const InvoiceMetaSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["invoice", "quote"]),
});

export const InvoiceTotalsSchema = z.object({
  subTotal: z.number().min(0),
  sgst: z.number().min(0),
  cgst: z.number().min(0),
  grandTotal: z.number().min(0),
});

export const InvoiceSchema = z.object({
  businessAddress: z.string().min(1, "Business address is required"),
  phone: z.string().min(1, "Phone number is required"),
  gstin: z.string().min(1, "GSTIN is required"),
  meta: InvoiceMetaSchema,
  customer: CustomerSchema,
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
  totals: InvoiceTotalsSchema,
  bank: BankSchema,
  amountWords: z.string().min(1, "Amount in words is required"),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

export const validateInvoice = (data: unknown) => {
  return InvoiceSchema.safeParse(data);
};

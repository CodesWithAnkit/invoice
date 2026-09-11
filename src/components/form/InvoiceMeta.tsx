import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import DynamicFieldManager from "./DynamicFieldManager";

interface InvoiceMetaProps {
  invoiceNumber: string;
  date: string;
  type: string;
  fields?: Record<string, string>;
  onUpdate: (field: string, value: any) => void;
}

export default function InvoiceMeta({
  invoiceNumber,
  date,
  type,
  fields = {},
  onUpdate,
}: InvoiceMetaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Invoice Meta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 relative">
            <label className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Invoice Number</span>
              {invoiceNumber && (
                <button onClick={() => onUpdate("meta.invoiceNumber", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              type="text"
              value={invoiceNumber}
              onChange={(e) => onUpdate("meta.invoiceNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Date</span>
              {date && (
                <button onClick={() => onUpdate("meta.date", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => onUpdate("meta.date", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Type</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={type}
              onChange={(e) => onUpdate("meta.type", e.target.value)}
            >
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
            </select>
          </div>
        </div>

        <DynamicFieldManager 
          fields={fields} 
          onUpdate={(newFields) => onUpdate("meta.fields", newFields)} 
        />
      </CardContent>
    </Card>
  );
}

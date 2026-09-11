import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import DynamicFieldManager from "./DynamicFieldManager";

interface BankDetailsProps {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  fields?: Record<string, string>;
  onUpdate: (field: string, value: any) => void;
}

export default function BankDetails({
  bankName,
  accountName,
  accountNumber,
  ifsc,
  fields = {},
  onUpdate,
}: BankDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Bank Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 relative">
            <label htmlFor="bankName" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Bank Name</span>
              {bankName && (
                <button onClick={() => onUpdate("bank.bankName", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="bankName"
              type="text"
              value={bankName}
              onChange={(e) => onUpdate("bank.bankName", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label htmlFor="accountName" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Account Name</span>
              {accountName && (
                <button onClick={() => onUpdate("bank.accountName", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="accountName"
              type="text"
              value={accountName}
              onChange={(e) => onUpdate("bank.accountName", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label htmlFor="accountNumber" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Account Number</span>
              {accountNumber && (
                <button onClick={() => onUpdate("bank.accountNumber", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="accountNumber"
              type="text"
              value={accountNumber}
              onChange={(e) => onUpdate("bank.accountNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label htmlFor="ifsc" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>IFSC Code</span>
              {ifsc && (
                <button onClick={() => onUpdate("bank.ifsc", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="ifsc"
              type="text"
              value={ifsc}
              onChange={(e) => onUpdate("bank.ifsc", e.target.value)}
            />
          </div>
        </div>

        <DynamicFieldManager 
          fields={fields} 
          onUpdate={(newFields) => onUpdate("bank.fields", newFields)} 
        />
      </CardContent>
    </Card>
  );
}

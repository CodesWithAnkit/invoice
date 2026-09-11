import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import DynamicFieldManager from "./DynamicFieldManager";

interface BusinessDetailsProps {
  businessName: string;
  businessAddress: string;
  phone: string;
  gstin: string;
  fields?: Record<string, string>;
  onUpdate: (field: string, value: any) => void;
}

export default function BusinessDetails({
  businessName,
  businessAddress,
  phone,
  gstin,
  fields = {},
  onUpdate,
}: BusinessDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Business Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2 relative">
            <label htmlFor="businessName" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Business Name</span>
              {businessName && (
                <button onClick={() => onUpdate("businessName", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => onUpdate("businessName", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label htmlFor="phone" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Phone</span>
              {phone && (
                <button onClick={() => onUpdate("phone", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => onUpdate("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <label htmlFor="gstin" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>GSTIN</span>
              {gstin && (
                <button onClick={() => onUpdate("gstin", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <Input
              id="gstin"
              type="text"
              value={gstin}
              onChange={(e) => onUpdate("gstin", e.target.value)}
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 relative">
            <label htmlFor="businessAddress" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Business Address</span>
              {businessAddress && (
                <button onClick={() => onUpdate("businessAddress", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <textarea
              id="businessAddress"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={businessAddress}
              onChange={(e) => onUpdate("businessAddress", e.target.value)}
            />
          </div>
        </div>

        <DynamicFieldManager 
          fields={fields} 
          onUpdate={(newFields) => onUpdate("fields", newFields)} 
        />
      </CardContent>
    </Card>
  );
}

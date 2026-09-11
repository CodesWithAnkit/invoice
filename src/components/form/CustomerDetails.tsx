import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import DynamicFieldManager from "./DynamicFieldManager";

interface CustomerDetailsProps {
  name: string;
  address: string;
  fields?: {
    phone?: string;
    aadhaar?: string;
    companyName?: string;
    [key: string]: string | undefined;
  };
  onUpdate: (field: string, value: any) => void;
}

export default function CustomerDetails({
  name,
  address,
  fields = {},
  onUpdate,
}: CustomerDetailsProps) {

  const customFields = Object.keys(fields).reduce((acc, key) => {
    if (!["companyName", "phone", "aadhaar"].includes(key)) {
      acc[key] = fields[key] as string;
    }
    return acc;
  }, {} as Record<string, string>);

  const handleCustomFieldUpdate = (newCustomFields: Record<string, string>) => {
    const updatedFields = { ...fields };
    
    // Remove custom fields that were deleted
    Object.keys(updatedFields).forEach((k) => {
      if (!["companyName", "phone", "aadhaar"].includes(k) && !(k in newCustomFields)) {
        delete updatedFields[k];
      }
    });

    // Add/Update new custom fields
    Object.entries(newCustomFields).forEach(([k, v]) => {
      updatedFields[k] = v;
    });

    onUpdate("customer.fields", updatedFields);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Customer Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative">
              <label htmlFor="companyName" className="text-sm font-medium leading-none flex justify-between items-center">
                <span>Company Name</span>
                {fields?.companyName && (
                  <button onClick={() => onUpdate("customer.fields.companyName", "")} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
              <Input
                id="companyName"
                type="text"
                value={fields?.companyName || ""}
                onChange={(e) => onUpdate("customer.fields.companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2 relative">
              <label htmlFor="customerName" className="text-sm font-medium leading-none flex justify-between items-center">
                <span>Customer Name</span>
                {name && (
                  <button onClick={() => onUpdate("customer.name", "")} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
              <Input
                id="customerName"
                type="text"
                value={name}
                onChange={(e) => onUpdate("customer.name", e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative">
              <label htmlFor="mobile" className="text-sm font-medium leading-none flex justify-between items-center">
                <span>Mobile</span>
                {fields?.phone && (
                  <button onClick={() => onUpdate("customer.fields.phone", "")} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
              <Input
                id="mobile"
                type="text"
                value={fields?.phone || ""}
                onChange={(e) => onUpdate("customer.fields.phone", e.target.value)}
              />
            </div>
            <div className="space-y-2 relative">
              <label htmlFor="aadhaar" className="text-sm font-medium leading-none flex justify-between items-center">
                <span>Aadhaar</span>
                {fields?.aadhaar && (
                  <button onClick={() => onUpdate("customer.fields.aadhaar", "")} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
              <Input
                id="aadhaar"
                type="text"
                value={fields?.aadhaar || ""}
                onChange={(e) => onUpdate("customer.fields.aadhaar", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <label htmlFor="customerAddress" className="text-sm font-medium leading-none flex justify-between items-center">
              <span>Customer Address</span>
              {address && (
                <button onClick={() => onUpdate("customer.address", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
            <textarea
              id="customerAddress"
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              rows={3}
              value={address}
              onChange={(e) => onUpdate("customer.address", e.target.value)}
            />
          </div>

          <DynamicFieldManager 
            fields={customFields}
            onUpdate={handleCustomFieldUpdate}
          />
        </div>
      </CardContent>
    </Card>
  );
}

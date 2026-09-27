"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { CustomerForm } from "../CustomerForm";

interface EditCustomerDialogProps {
  customer: any;
}

export function EditCustomerDialog({ customer }: EditCustomerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <FormDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Edit Customer"
      description={`Update details for ${customer.name}.`}
      className="sm:max-w-xl"
      trigger={
        <Button variant="outline">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      }
    >
      <CustomerForm 
        customerId={customer.id} 
        initialValues={{
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          notes: customer.notes || "",
          tax_id: customer.tax_id || customer.aadhaar || "",
          company_name: customer.company_name || "",
          status: customer.status,
        }}
        onSuccess={() => {
          setIsOpen(false);
          router.refresh(); // refresh the server component data
        }}
        onCancel={() => setIsOpen(false)}
      />
    </FormDialog>
  );
}

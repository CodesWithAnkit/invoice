import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="w-full">
      <PageHeader title="Customers" description="Manage your customer directory." />
      <EmptyState
        title="Coming Soon"
        description="The customer management module is currently under development."
        icon={<Users className="h-6 w-6" />}
      />
    </div>
  );
}

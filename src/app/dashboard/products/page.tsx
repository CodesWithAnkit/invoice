import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="w-full">
      <PageHeader title="Products" description="Manage your product catalog." />
      <EmptyState
        title="Coming Soon"
        description="The product management module is currently under development."
        icon={<Package className="h-6 w-6" />}
      />
    </div>
  );
}

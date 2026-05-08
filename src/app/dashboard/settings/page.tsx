import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="w-full">
      <PageHeader title="Settings" description="Configure your application preferences." />
      <EmptyState
        title="Coming Soon"
        description="The settings module is currently under development."
        icon={<Settings className="h-6 w-6" />}
      />
    </div>
  );
}

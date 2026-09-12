"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Settings as SettingsIcon } from "lucide-react";

const sections = [
  "Company Profile",
  "Invoice Customization",
  "Tax Compliance Rails",
  "Payment Gateways",
  "Notifications & Alerts",
  "Users & Permissions",
  "Connected Integrations",
  "Visual Appearance",
  "API Configuration",
] as const;

type Section = (typeof sections)[number];

function VisualAppearancePanel() {
  const { theme, setTheme } = useTheme();
  const [draftTheme, setDraftTheme] = useState(theme ?? "system");
  const [tabularNums, setTabularNums] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(false);

  const presets: { key: "dark" | "light" | "system"; label: string }[] = [
    { key: "dark", label: "Dark Theme" },
    { key: "light", label: "Light Theme" },
    { key: "system", label: "System Match" },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Visual Appearance Settings</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Configure the theme modes, typography registers, and graphic layouts across the app.
      </p>

      <div className="border-t border-border my-5" />

      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        System Theme Presets
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => setDraftTheme(preset.key)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              draftTheme === preset.key ? "border-primary" : "border-border"
            )}
          >
            <div className="h-10 rounded-md bg-muted mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{preset.label}</span>
              <span
                className={cn(
                  "h-4 w-4 rounded-full border flex items-center justify-center",
                  draftTheme === preset.key ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}
              >
                {draftTheme === preset.key && <Check className="h-3 w-3" />}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-border my-5" />

      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Accessibility &amp; Ledger Density Options
      </p>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={tabularNums}
            onChange={(e) => setTabularNums(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Enforce strict lining tabular figures on ledger balances for precision scanning.
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={pdfPreview}
            onChange={(e) => setPdfPreview(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Display invoice PDF previews directly inside side-panel overlays on table selection.
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => setDraftTheme(theme ?? "system")}>
          Discard Changes
        </Button>
        <Button onClick={() => setTheme(draftTheme)}>Apply Appearance</Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>("Visual Appearance");

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
          Workspace Settings
        </p>
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActive(section)}
            className={cn(
              "w-full text-left rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active === section
                ? "border-border bg-card text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
        {active === "Visual Appearance" ? (
          <VisualAppearancePanel />
        ) : (
          <EmptyState
            title="Coming Soon"
            description={`The "${active}" settings module is currently under development.`}
            icon={<SettingsIcon className="h-6 w-6" />}
          />
        )}
      </div>
    </div>
  );
}

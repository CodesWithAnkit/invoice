"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Short bullet list (deliverables, included, excluded, assumptions, terms),
// capped for the one-page quotation (R-15a).
export function BulletListEditor({
  label,
  items,
  max,
  maxChars,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  items: string[];
  max: number;
  maxChars: number;
  placeholder?: string;
  error?: string;
  onChange: (items: string[]) => void;
}) {
  const atCap = items.length >= max;
  const set = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)));

  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-center justify-between text-sm font-medium text-foreground">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}/{max}
        </span>
      </legend>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <Input
                aria-label={`${label} ${i + 1}`}
                value={item}
                maxLength={maxChars}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-body-sm font-medium text-foreground">{error}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={atCap}
        onClick={() => onChange([...items, ""])}
        aria-label={`Add ${label.toLowerCase()}`}
      >
        <Plus className="mr-1 h-4 w-4" />
        {atCap ? `Limit of ${max} reached` : "Add"}
      </Button>
    </fieldset>
  );
}

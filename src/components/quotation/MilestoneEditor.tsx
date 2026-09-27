"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import type { FormErrors, MilestoneFormValues } from "@/modules/quotation/quotation.form";
import { QUOTATION_CAPS } from "@/modules/quotation/quotation.schema";

// AC-TIMELINE-001: name, description, start and end (a date or a relative
// period such as "Week 1"), stored as short labels.
export function MilestoneEditor({
  milestones,
  errors,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: {
  milestones: MilestoneFormValues[];
  errors: FormErrors;
  onChange: (index: number, patch: Partial<MilestoneFormValues>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, to: number) => void;
}) {
  const atCap = milestones.length >= QUOTATION_CAPS.milestones;

  return (
    <div className="space-y-3">
      {milestones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No milestones yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {milestones.map((m, i) => {
            const n = i + 1;
            const err = (field: string) => errors[`milestones.${i}.${field}`];
            return (
              <li
                key={m.key}
                className="rounded-lg border border-border bg-background p-4"
                data-testid="milestone"
                aria-label={`Milestone ${n}`}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <FormField label={`Milestone ${n} name`} error={err("name")} className="md:col-span-4">
                    {(field) => (
                      <Input
                        {...field}
                        value={m.name}
                        maxLength={QUOTATION_CAPS.milestoneNameChars}
                        placeholder="e.g. Design"
                        onChange={(e) => onChange(i, { name: e.target.value })}
                      />
                    )}
                  </FormField>
                  <FormField label={`Milestone ${n} start`} error={err("start_label")} className="md:col-span-2">
                    {(field) => (
                      <Input
                        {...field}
                        value={m.start_label}
                        maxLength={QUOTATION_CAPS.milestoneLabelChars}
                        placeholder="Week 1"
                        onChange={(e) => onChange(i, { start_label: e.target.value })}
                      />
                    )}
                  </FormField>
                  <FormField label={`Milestone ${n} end`} error={err("end_label")} className="md:col-span-2">
                    {(field) => (
                      <Input
                        {...field}
                        value={m.end_label}
                        maxLength={QUOTATION_CAPS.milestoneLabelChars}
                        placeholder="Week 2"
                        onChange={(e) => onChange(i, { end_label: e.target.value })}
                      />
                    )}
                  </FormField>
                  <div className="flex items-end justify-end gap-1 md:col-span-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move milestone ${n} up`}
                      disabled={i === 0}
                      onClick={() => onMove(i, i - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move milestone ${n} down`}
                      disabled={i === milestones.length - 1}
                      onClick={() => onMove(i, i + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove milestone ${n}`}
                      onClick={() => onRemove(i)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <FormField label={`Milestone ${n} description`} error={err("description")} className="md:col-span-12">
                    {(field) => (
                      <Input
                        {...field}
                        value={m.description}
                        maxLength={QUOTATION_CAPS.milestoneDescriptionChars}
                        placeholder="Optional"
                        onChange={(e) => onChange(i, { description: e.target.value })}
                      />
                    )}
                  </FormField>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {errors["milestones"] && <p className="text-body-sm font-medium text-foreground">{errors["milestones"]}</p>}
      <Button type="button" variant="outline" size="sm" disabled={atCap} onClick={onAdd}>
        <Plus className="mr-1 h-4 w-4" />
        {atCap ? `Limit of ${QUOTATION_CAPS.milestones} reached` : "Add milestone"}
      </Button>
    </div>
  );
}

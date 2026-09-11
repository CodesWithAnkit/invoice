import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, X } from "lucide-react";

interface DynamicFieldManagerProps {
  fields: Record<string, string>;
  onUpdate: (newFields: Record<string, string>) => void;
  title?: string;
}

export default function DynamicFieldManager({
  fields,
  onUpdate,
  title = "Custom Fields",
}: DynamicFieldManagerProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddField = () => {
    if (!newKey.trim()) return;
    const key = newKey.trim();
    onUpdate({ ...fields, [key]: newValue });
    setNewKey("");
    setNewValue("");
  };

  const handleRemoveField = (keyToRemove: string) => {
    const updatedFields = { ...fields };
    delete updatedFields[keyToRemove];
    onUpdate(updatedFields);
  };

  const handleFieldChange = (key: string, value: string) => {
    onUpdate({ ...fields, [key]: value });
  };

  const fieldEntries = Object.entries(fields || {});

  return (
    <div className="mt-6 space-y-4 border-t pt-4">
      <div className="text-sm font-semibold text-muted-foreground">{title}</div>
      
      {fieldEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fieldEntries.map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium leading-none capitalize flex justify-between items-center">
                <span>{key}</span>
                <button 
                  onClick={() => handleRemoveField(key)}
                  className="text-muted-foreground hover:text-destructive"
                  title={`Remove ${key}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </label>
              <Input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-muted/30 p-3 rounded-md border border-dashed">
        <Input
          placeholder="Field Name (e.g. PAN)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1 bg-background h-8 text-sm min-w-[120px]"
        />
        <Input
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddField()}
          className="flex-[2] bg-background h-8 text-sm min-w-[150px]"
        />
        <Button onClick={handleAddField} size="sm" variant="secondary" className="h-8">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

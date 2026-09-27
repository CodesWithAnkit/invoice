# Reusable Confirmation Dialog

**Status**: Accepted

## Summary
The codebase currently uses standard Shadcn `Dialog` primitives ad-hoc for confirmations (e.g. duplicating an invoice). This spec introduces a cross-cutting `ConfirmationDialog` pattern using Shadcn's `AlertDialog` to standardize confirmation flows, reduce boilerplate, and enforce a consistent UX for actions like delete or copy.

## Context
Various user actions require confirmation (e.g., deleting a customer, duplicating a document, signing out of the application). Currently, developers build one-off popups by importing `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, etc. This leads to:
- Inconsistent terminology (Cancel vs Close).
- Mixed button styles (destructive actions not always red).
- Duplicate boilerplate code across pages.

## Options considered
1. **Ad-hoc Shadcn Dialogs**: Continue building per-use-case dialogs. *Pros*: Maximum flexibility. *Cons*: High boilerplate, inconsistent UX.
2. **Context-based global dialog (`useConfirm`)**: A single provider at the root that renders the dialog, triggered by a hook. *Pros*: Very clean caller code. *Cons*: Loses React rendering context if not careful, harder to pass complex React nodes as children.
3. **Reusable `ConfirmationDialog` component (Recommended)**: A wrapper around Shadcn `AlertDialog` that takes props for state and actions, imported and mounted locally by the caller. *Pros*: React-idiomatic, type-safe, simple to implement, handles 90% of confirmation cases. *Cons*: Still requires mounting in the component tree.

## Rationale
We chose the **Reusable `ConfirmationDialog` component** because it perfectly balances developer experience and flexibility. It relies on the robust accessibility of Radix `AlertDialog` (via Shadcn) which is strictly meant for confirmations (unlike `Dialog` which is for arbitrary content). This keeps the component API simple and enforces the correct semantic HTML role (`alertdialog`).

## Standard definition

**Canonical pattern**:
```tsx
// src/components/ui/confirmation-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | ReactNode;
  description: string | ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Continue",
  cancelText = "Cancel",
  destructive = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault(); // Prevent immediate close if needed, but here we just call onConfirm
              onConfirm();
              onOpenChange(false);
            }}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Usage**:
```tsx
<ConfirmationDialog
  isOpen={showDelete}
  onOpenChange={setShowDelete}
  title="Delete Customer"
  description="Are you sure? This cannot be undone."
  confirmText="Delete"
  destructive={true}
  onConfirm={handleDelete}
/>
```

**Replaces**:
- Ad-hoc usage of `Dialog` for simple Yes/No or action confirmations.

**Enforcement**:
Code review convention.

**Rollout**:
Enforce immediately for new code. Existing ad-hoc dialogs (like the one in `src/app/dashboard/invoices/[id]/copy/page.tsx`) can be migrated progressively or during their next touch.

**Exceptions**:
When a popup requires complex forms, inputs, or multi-step workflows, use the standard `Dialog` component instead. `ConfirmationDialog` is strictly for textual confirmations.

## Build plan
1. Add the Shadcn `alert-dialog` primitive: `npx shadcn@latest add alert-dialog`.
2. Create `src/components/ui/confirmation-dialog.tsx` following the canonical pattern.
3. Replace the `Dialog` in `src/app/dashboard/invoices/[id]/copy/page.tsx` with the new `ConfirmationDialog` (or keep it as a `Dialog` if the input field is required—actually, the copy page *does* use an `<Input />`, so it is an **exception** to this standard and should remain a `Dialog`).
4. Implement the sign out confirmation using `ConfirmationDialog` in the navigation/sidebar component where sign out is triggered.

## Consequences
- **Positive**: Less boilerplate for standard confirmations like deletions. Guaranteed accessible `alertdialog` roles.
- **Negative**: Adds a layer of abstraction over Shadcn primitives, which might hide some underlying props (e.g., custom button variants), requiring prop drilling if needs expand.

## Follow-up
- None.

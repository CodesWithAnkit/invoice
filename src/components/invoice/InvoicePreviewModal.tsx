import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvoicePreview from "./InvoicePreview";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoicePreviewModal({ isOpen, onOpenChange }: InvoicePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-250 max-h-[90vh] overflow-y-auto w-full p-4 sm:p-6 no-print bg-white dark:bg-slate-950 dark:text-white border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center w-full mt-4">
          <InvoicePreview />
        </div>
      </DialogContent>
    </Dialog>
  );
}

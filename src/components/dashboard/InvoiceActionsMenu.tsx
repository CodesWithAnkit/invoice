import { MoreHorizontal, Eye, FileEdit, Copy, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceActionsMenuProps {
  invoiceId: string;
  pdfUrl?: string;
  onDelete: (id: string) => void;
}

export function InvoiceActionsMenu({ invoiceId, pdfUrl, onDelete }: InvoiceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 w-8 p-0 bg-white">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[200px] bg-white border shadow-lg z-50">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/invoices/${invoiceId}`} className="cursor-pointer flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/invoices/${invoiceId}/edit`} className="cursor-pointer flex items-center">
            <FileEdit className="mr-2 h-4 w-4" />
            Edit invoice
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/invoices/${invoiceId}/copy`} className="cursor-pointer flex items-center">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Link>
        </DropdownMenuItem>
        {pdfUrl && (
          <DropdownMenuItem asChild>
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="cursor-pointer flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(invoiceId)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer flex items-center">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete invoice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

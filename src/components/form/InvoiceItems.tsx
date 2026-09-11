import { formatINR } from "../../utils/formatCurrency";
import { InvoiceItem } from "@/modules/invoice/invoice.types";
import ProductSearchDropdown from "./ProductSearchDropdown";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface InvoiceItemsProps {
  items: InvoiceItem[];
  totals: {
    subTotal: number;
    sgst: number;
    cgst: number;
    grandTotal: number;
  };
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof InvoiceItem, value: any) => void;
  onReplaceItems?: (items: InvoiceItem[]) => void;
  taxPercent?: number;
}

export default function InvoiceItems({
  items,
  totals,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onReplaceItems,
  taxPercent = 18,
}: InvoiceItemsProps) {
  const halfTax = taxPercent / 2;
  const handleNumberChange = (index: number, field: "quantity" | "unitPrice", value: string) => {
    const parsed = parseFloat(value);
    onUpdateItem(index, field, isNaN(parsed) ? 0 : parsed);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!onReplaceItems) return;
    const text = e.clipboardData.getData("text");
    if (!text) return;

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    
    if (lines.some(l => l.includes("|") || l.includes("\t"))) {
      const newItems: InvoiceItem[] = [];
      
      for (const line of lines) {
        if (line.includes("---") || 
            line.toLowerCase().match(/subtotal|gst|कुल|total|मशीन\/उपकरण|price/)) {
          continue;
        }

        const parts = line.includes("|") 
          ? line.split("|").map(p => p.trim()).filter(Boolean)
          : line.split("\t").map(p => p.trim()).filter(Boolean);

        if (parts.length >= 2) {
          let desc = parts[0].replace(/\*\*/g, "").trim();
          let priceStr = parts[parts.length - 1].replace(/[^0-9.]/g, "");
          const price = parseFloat(priceStr);

          if (desc && !isNaN(price)) {
            newItems.push({
              id: crypto.randomUUID(),
              description: desc,
              quantity: 1,
              unitPrice: price,
              total: price
            });
          }
        }
      }

      if (newItems.length > 0) {
        e.preventDefault();
        onReplaceItems(newItems);
      }
    }
  };

  return (
    <Card onPaste={handlePaste} className="overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-center bg-muted/30 pb-4">
        <CardTitle className="text-xl">Items</CardTitle>
        <span className="text-xs text-muted-foreground italic">
          💡 Tip: You can paste a Markdown table or Excel rows here to auto-fill items.
        </span>
      </CardHeader>
      
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead className="w-[15%]">Qty</TableHead>
              <TableHead className="w-[20%]">Price</TableHead>
              <TableHead className="w-[15%]">Total</TableHead>
              <TableHead className="w-[10%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ProductSearchDropdown
                    value={item.description}
                    placeholder="Item description"
                    onSelect={(name, price) => {
                      onUpdateItem(index, "description", name);
                      if (price != null) {
                        onUpdateItem(index, "unitPrice", price);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                  />
                </TableCell>
                <TableCell className="font-medium">{formatINR(item.total)}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onRemoveItem(index)} 
                    disabled={items.length <= 1}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4 p-4">
        {items.map((item, index) => (
          <Card key={item.id} className="border bg-card shadow-sm">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Description</label>
                <ProductSearchDropdown
                  value={item.description}
                  placeholder="Item description"
                  onSelect={(name, price) => {
                    onUpdateItem(index, "description", name);
                    if (price != null) {
                      onUpdateItem(index, "unitPrice", price);
                    }
                  }}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-muted-foreground">Qty</label>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="flex-2 space-y-2">
                  <label className="text-xs text-muted-foreground">Price</label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="font-bold text-foreground">
                  Total: {formatINR(item.total)}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive border-destructive"
                  onClick={() => onRemoveItem(index)} 
                  disabled={items.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-background/95 backdrop-blur z-10">
        <Button 
          onClick={onAddItem} 
          disabled={items.length >= 15}
          className="w-full md:w-auto"
        >
          + Add Item {items.length >= 15 ? "(Limit Reached)" : ""}
        </Button>
      </div>

      {/* Totals Section */}
      <CardFooter className="bg-muted/10 flex flex-col items-end gap-2 p-6 border-t">
        <div className="text-sm text-muted-foreground flex justify-between w-full md:w-64">
          <span>Subtotal:</span>
          <span>{formatINR(totals.subTotal)}</span>
        </div>
        <div className="text-sm text-muted-foreground flex justify-between w-full md:w-64">
          <span>SGST ({halfTax}%):</span>
          <span>{formatINR(totals.sgst)}</span>
        </div>
        <div className="text-sm text-muted-foreground flex justify-between w-full md:w-64">
          <span>CGST ({halfTax}%):</span>
          <span>{formatINR(totals.cgst)}</span>
        </div>
        <div className="font-bold text-xl mt-4 pt-4 border-t w-full flex justify-between md:justify-end md:gap-8">
          <span>Grand Total:</span>
          <span>{formatINR(totals.grandTotal)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

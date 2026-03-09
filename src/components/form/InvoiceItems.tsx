import { formatINR } from "../../utils/formatCurrency";
import { commonInputStyle } from "../../constants/styles";
import { InvoiceItem } from "@/modules/invoice/invoice.types";

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
  taxPercent?: number;
}

export default function InvoiceItems({
  items,
  totals,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  taxPercent = 18,
}: InvoiceItemsProps) {
  const halfTax = taxPercent / 2;
  const handleNumberChange = (index: number, field: "quantity" | "unitPrice", value: string) => {
    const parsed = parseFloat(value);
    onUpdateItem(index, field, isNaN(parsed) ? 0 : parsed);
  };

  return (
    <section>
      <h2>Items</h2>
      
      {/* Desktop Table View */}
      <div className="desktop-items">
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ padding: "8px" }}>Description</th>
              <th style={{ padding: "8px" }}>Qty</th>
              <th style={{ padding: "8px" }}>Price</th>
              <th style={{ padding: "8px" }}>Total</th>
              <th style={{ padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>
                  <input
                    type="text"
                    placeholder="Item description"
                    style={{ ...commonInputStyle, minWidth: "200px" }}
                    value={item.description}
                    onChange={(e) => onUpdateItem(index, "description", e.target.value)}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    style={{ ...commonInputStyle, width: "70px" }}
                    value={item.quantity}
                    onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    style={{ ...commonInputStyle, width: "100px" }}
                    value={item.unitPrice}
                    onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                  />
                </td>
                <td style={{ padding: "8px" }}>{formatINR(item.total)}</td>
                <td style={{ padding: "8px" }}>
                  <button 
                    onClick={() => onRemoveItem(index)} 
                    disabled={items.length <= 1}
                    style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-items">
        {items.map((item, index) => (
          <div key={item.id} className="item-card">
            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", color: "#666" }}>Description</label>
              <input
                type="text"
                style={commonInputStyle}
                value={item.description}
                onChange={(e) => onUpdateItem(index, "description", e.target.value)}
              />
            </div>
            <div className="row">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#666" }}>Qty</label>
                <input
                  type="number"
                  style={commonInputStyle}
                  value={item.quantity}
                  onChange={(e) => handleNumberChange(index, "quantity", e.target.value)}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: "12px", color: "#666" }}>Price</label>
                <input
                  type="number"
                  style={commonInputStyle}
                  value={item.unitPrice}
                  onChange={(e) => handleNumberChange(index, "unitPrice", e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: "bold", color: "#333" }}>
                Total: {formatINR(item.total)}
              </div>
              <button 
                onClick={() => onRemoveItem(index)} 
                disabled={items.length <= 1}
                style={{ color: "red", border: "1px solid red", borderRadius: "4px", padding: "4px 8px", background: "white" }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: "1rem", 
        position: "sticky", 
        bottom: "20px",
        display: "flex",
        justifyContent: "flex-start",
        zIndex: 10
      }}>
        <button 
          onClick={onAddItem} 
          disabled={items.length >= 15}
          style={{ 
            padding: "10px 20px", 
            borderRadius: "8px", 
            backgroundColor: "#444", 
            color: "white", 
            border: "none", 
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
        >
          + Add Item {items.length >= 15 ? "(Limit Reached)" : ""}
        </button>
      </div>

      {/* Totals Section */}
      <div style={{ 
        marginTop: "20px", 
        padding: "20px", 
        backgroundColor: "#fefefe", 
        border: "1px solid #eee", 
        borderRadius: "8px",
        display: "flex", 
        flexDirection: "column", 
        alignItems: "flex-end", 
        gap: "0.5rem" 
      }}>
        <div style={{ fontSize: "14px", color: "#666" }}>Subtotal: {formatINR(totals.subTotal)}</div>
        <div style={{ fontSize: "14px", color: "#666" }}>SGST ({halfTax}%): {formatINR(totals.sgst)}</div>
        <div style={{ fontSize: "14px", color: "#666" }}>CGST ({halfTax}%): {formatINR(totals.cgst)}</div>
        <div style={{ 
          fontWeight: "bold", 
          fontSize: "18px", 
          marginTop: "10px", 
          paddingTop: "10px", 
          borderTop: "1px solid #ccc",
          width: "100%",
          textAlign: "right"
        }}>
          Grand Total: {formatINR(totals.grandTotal)}
        </div>
      </div>
    </section>
  );
}

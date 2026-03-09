import { commonInputStyle } from "../../constants/styles";

interface InvoiceMetaProps {
  invoiceNumber: string;
  date: string;
  type: string;
  onUpdate: (field: string, value: string) => void;
}

export default function InvoiceMeta({
  invoiceNumber,
  date,
  type,
  onUpdate,
}: InvoiceMetaProps) {
  return (
    <section>
      <h2>Invoice Meta</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        <div>
          <label>Invoice Number</label>
          <input
            type="text"
            style={commonInputStyle}
            value={invoiceNumber}
            onChange={(e) => onUpdate("meta.invoiceNumber", e.target.value)}
          />
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            style={commonInputStyle}
            value={date}
            onChange={(e) => onUpdate("meta.date", e.target.value)}
          />
        </div>
        <div>
          <label>Type</label>
          <select
            style={commonInputStyle}
            value={type}
            onChange={(e) => onUpdate("meta.type", e.target.value)}
          >
            <option value="invoice">Invoice</option>
            <option value="quote">Quote</option>
          </select>
        </div>
      </div>
    </section>
  );
}

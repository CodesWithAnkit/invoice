import { commonInputStyle } from "../../constants/styles";

interface CustomerDetailsProps {
  name: string;
  address: string;
  fields?: {
    phone?: string;
    aadhaar?: string;
    [key: string]: string | undefined;
  };
  onUpdate: (field: string, value: string) => void;
}

export default function CustomerDetails({
  name,
  address,
  fields,
  onUpdate,
}: CustomerDetailsProps) {
  return (
    <section>
      <h2>Customer Details</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label>Customer Name</label>
          <input
            type="text"
            style={commonInputStyle}
            value={name}
            onChange={(e) => onUpdate("customer.name", e.target.value)}
          />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label>Mobile</label>
            <input
              type="text"
              style={commonInputStyle}
              value={fields?.phone || ""}
              onChange={(e) => onUpdate("customer.fields.phone", e.target.value)}
            />
          </div>
          <div>
            <label>Aadhaar</label>
            <input
              type="text"
              style={commonInputStyle}
              value={fields?.aadhaar || ""}
              onChange={(e) => onUpdate("customer.fields.aadhaar", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label>Customer Address</label>
          <textarea
            style={commonInputStyle}
            rows={3}
            value={address}
            onChange={(e) => onUpdate("customer.address", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

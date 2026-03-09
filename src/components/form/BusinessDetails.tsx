import { commonInputStyle } from "../../constants/styles";

interface BusinessDetailsProps {
  businessName: string;
  businessAddress: string;
  phone: string;
  gstin: string;
  onUpdate: (field: string, value: string) => void;
}

export default function BusinessDetails({
  businessName,
  businessAddress,
  phone,
  gstin,
  onUpdate,
}: BusinessDetailsProps) {
  return (
    <section>
      <h2>Business Details</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div>
          <label>Business Name</label>
          <input
            type="text"
            style={commonInputStyle}
            value={businessName}
            onChange={(e) => onUpdate("businessName", e.target.value)}
          />
        </div>
        <div>
          <label>Phone</label>
          <input
            type="text"
            style={commonInputStyle}
            value={phone}
            onChange={(e) => onUpdate("phone", e.target.value)}
          />
        </div>
        <div>
          <label>GSTIN</label>
          <input
            type="text"
            style={commonInputStyle}
            value={gstin}
            onChange={(e) => onUpdate("gstin", e.target.value)}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Business Address</label>
          <textarea
            style={{ ...commonInputStyle, height: "80px", resize: "vertical" }}
            value={businessAddress}
            onChange={(e) => onUpdate("businessAddress", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

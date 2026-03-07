import { commonInputStyle } from "../../constants/styles";

interface BankDetailsProps {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  onUpdate: (field: string, value: string) => void;
}

export default function BankDetails({
  bankName,
  accountName,
  accountNumber,
  ifsc,
  onUpdate,
}: BankDetailsProps) {
  return (
    <section>
      <h2>Bank Details</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div>
          <label>Bank Name</label>
          <input
            type="text"
            style={commonInputStyle}
            value={bankName}
            onChange={(e) => onUpdate("bank.bankName", e.target.value)}
          />
        </div>
        <div>
          <label>Account Name</label>
          <input
            type="text"
            style={commonInputStyle}
            value={accountName}
            onChange={(e) => onUpdate("bank.accountName", e.target.value)}
          />
        </div>
        <div>
          <label>Account Number</label>
          <input
            type="text"
            style={commonInputStyle}
            value={accountNumber}
            onChange={(e) => onUpdate("bank.accountNumber", e.target.value)}
          />
        </div>
        <div>
          <label>IFSC Code</label>
          <input
            type="text"
            style={commonInputStyle}
            value={ifsc}
            onChange={(e) => onUpdate("bank.ifsc", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

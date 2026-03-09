import SignaturePad from "../SignaturePad";

interface SignatureSectionProps {
  signature: string;
  onUpdate: (dataURL: string) => void;
}

export default function SignatureSection({
  signature,
  onUpdate,
}: SignatureSectionProps) {
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target?.result as string;
      onUpdate(dataURL);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section style={{ marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Authorized Signatory</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Method 1: Draw Signature</label>
          <SignaturePad 
            initialValue={signature}
            onSave={(dataURL) => onUpdate(dataURL)}
            onClear={() => onUpdate("")}
          />
        </div>
        
        <div style={{ padding: "1rem", border: "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#fafafa" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Method 2: Upload Signature Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleSignatureUpload}
            style={{ fontSize: "14px" }}
          />
          <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>
            Upload a clear PNG/JPG with a white or transparent background.
          </p>
        </div>
      </div>
    </section>
  );
}

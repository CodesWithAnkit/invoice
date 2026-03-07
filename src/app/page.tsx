import InvoiceForm from "@/components/InvoiceForm";
import InvoiceTemplate from "@/components/InvoiceTemplate";

export default function Home() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left Panel: Editor */}
      <aside style={{ width: "40%", height: "100%", overflowY: "auto", borderRight: "1px solid #ddd", padding: "20px" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Invoice Editor</h1>
        <InvoiceForm />
      </aside>

      {/* Right Panel: Live Preview */}
      <main style={{ flex: 1, height: "100%", overflowY: "auto", backgroundColor: "#f5f5f5", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <InvoiceTemplate />
        </div>
      </main>
    </div>
  );
}

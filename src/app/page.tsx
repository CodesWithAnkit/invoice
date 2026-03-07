import InvoiceForm from "@/components/InvoiceForm";
import InvoiceTemplate from "@/components/InvoiceTemplate";

export default function Home() {
  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      <div>
        <h1>Invoice Generator MVP</h1>
        <p>Fill out the form below to update the preview.</p>
        <InvoiceForm />
      </div>
      <div>
        <h2>Preview</h2>
        <InvoiceTemplate />
      </div>
    </main>
  );
}

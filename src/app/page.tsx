import InvoiceForm from "@/components/InvoiceForm";

export default function Home() {
  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Invoice Generator MVP</h1>
      <p>Fill out the form below to generate your invoice.</p>
      <InvoiceForm />
    </main>
  );
}

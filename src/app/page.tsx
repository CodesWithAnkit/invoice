"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import InvoiceToolbar from "@/components/invoice/InvoiceToolbar";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";

export default function Home() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("invoice_auth");
    if (!auth) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* 1. Global Print Layout (Hidden on screen via styles/invoice-print.css) */}
      <InvoicePrintLayout />

      {/* 2. Editor Header (Screen only) */}
      <header className="no-print" style={{ marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: "1.75rem" }}>Invoice System Pro</h1>
      </header>

      {/* 3. Global Toolbar (Screen only) */}
      <InvoiceToolbar />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "30px",
          alignItems: "flex-start",
        }}
      >
        {/* Editor Column (Screen only) */}
        <div
          style={{
            flex: "1 1 500px",
            minWidth: "350px",
          }}
          className="no-print"
        >
          <InvoiceEditor />
        </div>

        {/* Preview Column (Screen only) */}
        <div
          style={{
            flex: "1 1 600px",
            minWidth: "350px",
            position: "sticky",
            top: "20px",
          }}
          className="no-print"
        >
          <InvoicePreview />
        </div>
      </div>
    </div>
  );
}

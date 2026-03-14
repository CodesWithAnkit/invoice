"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceTemplate from "@/components/InvoiceTemplate";

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
        fontFamily: "sans-serif",
      }}
    >
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }} className="no-print">
        <h1 style={{ margin: 0, color: "#333" }}>Invoice Editor & Preview</h1>
      </header>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "30px",
          alignItems: "flex-start",
        }}
      >
        {/* Editor Column */}
        <div
          style={{
            flex: "1 1 450px",
            minWidth: "320px",
          }}
          className="no-print"
        >
          <InvoiceForm />
        </div>

        {/* Preview Column */}
        <div
          style={{
            flex: "1 1 600px",
            minWidth: "320px",
            position: "sticky",
            top: "20px",
          }}
          className="invoice-container"
        >
          <InvoiceTemplate />
        </div>
      </div>
    </div>
  );
}

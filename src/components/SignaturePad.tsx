"use client";

import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onSave: (dataURL: string) => void;
  onClear: () => void;
  initialValue?: string;
}

export default function SignaturePad({ onSave, onClear, initialValue }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const saveSignature = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataURL = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onSave(dataURL);
    }
  };

  const clearSignature = () => {
    if (sigRef.current) {
      sigRef.current.clear();
      onClear();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "fit-content" }}>
      <div style={{ border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff" }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 300,
            height: 120,
            className: "sigCanvas",
            style: { display: "block" }
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={saveSignature}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Save Signature
        </button>
        <button
          type="button"
          onClick={clearSignature}
          style={{
            padding: "8px 16px",
            backgroundColor: "#eee",
            color: "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          Clear
        </button>
      </div>
      {initialValue && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "5px" }}>Current Signature:</div>
          <img 
            src={initialValue} 
            alt="Current Signature" 
            style={{ height: "60px", border: "1px solid #eee", backgroundColor: "#f9f9f9" }} 
          />
        </div>
      )}
    </div>
  );
}

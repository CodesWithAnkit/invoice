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
    <div className="flex flex-col gap-2 w-fit">
      <div className="border border-input rounded-md bg-white dark:bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 300,
            height: 120,
            className: "sigCanvas block",
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={saveSignature}
          className="px-4 py-2 bg-primary text-primary-foreground border-none rounded cursor-pointer text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Save Signature
        </button>
        <button
          type="button"
          onClick={clearSignature}
          className="px-4 py-2 bg-secondary text-secondary-foreground border-none rounded cursor-pointer text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          Clear
        </button>
      </div>
      {initialValue && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground mb-1 font-medium">Current Signature:</div>
          <img
            src={initialValue}
            alt="Current Signature"
            className="h-15 border border-border bg-card rounded"
          />
        </div>
      )}
    </div>
  );
}

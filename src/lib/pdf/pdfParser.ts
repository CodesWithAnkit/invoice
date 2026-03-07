"use server";

/**
 * Parses an invoice PDF using pdf-parse-new and regex.
 * @param file The uploaded File object.
 * @returns An object with structured invoice data.
 */
export async function parseInvoicePDF(file: File) {
  try {
    // Dynamically import pdf-parse-new
    const pdfParse = (await import("pdf-parse-new")).default;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdfParse(buffer);
    const text = data.text;

    console.log("PDF TEXT", text);

    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    // 1. Extract metadata
    const gstin = text.match(/GSTIN:\s*([A-Z0-9]+)/)?.[1] || "";
    const phone = text.match(/Ph\s*:\s*([\d]+)/)?.[1] || "";
    const quoteNo = text.match(/Quote\s*No:\s*#?(\d+)/)?.[1] || "";
    const date = text.match(/Date:\s*([0-9/]+)/)?.[1] || "";

    // 2. Extract business name
    const businessIndex = lines.findIndex((l: string) => 
      l.includes("PRICE QUOTE") || l.includes("BILL INVOCIE")
    );
    const businessName = businessIndex >= 0 ? lines[businessIndex + 1] : "";

    // 3. Extract customer name
    const proLine = lines.find((l: string) => l.startsWith("Pro:-"));
    const customerName = proLine?.replace("Pro:-", "").trim() || "";

    // 4. Extract customer address
    const customerAddress = text.match(/Address:-\s*(.+)/)?.[1]?.trim() || "";

    console.log("businessName", businessName);
    console.log("customerName", customerName);

    // 5. Extract items
    const tableStart = lines.findIndex((l: string) => l.includes("Item Description"));
    const items: any[] = [];

    if (tableStart !== -1) {
      for (let i = tableStart + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("Amount in Word")) break;

        const match = line.match(/(.+?)\s+(\d{1,2})\s+([\d,.]+)\s+([\d,.]+)/);
        if (match) {
          items.push({
            id: crypto.randomUUID(),
            description: match[1].trim(),
            quantity: parseInt(match[2]),
            unitPrice: parseFloat(match[3].replace(/,/g, "")),
            total: parseFloat(match[4].replace(/,/g, "")),
          });
        }
      }
    }

    // 6. Extract totals
    const subTotal = parseFloat(
      text.match(/Sub Total\s*([\d,.]+)/)?.[1]?.replace(/,/g, "") || "0"
    );
    const sgst = parseFloat(
      text.match(/SGST\s*9%\s*([\d,.]+)/)?.[1]?.replace(/,/g, "") || "0"
    );
    const cgst = parseFloat(
      text.match(/CGST\s*9%\s*([\d,.]+)/)?.[1]?.replace(/,/g, "") || "0"
    );
    const grandTotal = parseFloat(
      text.match(/Grand Total\s*([\d,.]+)/)?.[1]?.replace(/,/g, "") || "0"
    );

    // 7. Extract amount in words
    const amountWords = text.match(/Amount in Word:-\s*(.+)/)?.[1]?.trim() || "";

    // 8. Extract bank details
    const bankName = text.match(/Bank Name:-\s*(.+)/)?.[1]?.trim() || "";
    const accountName = text.match(/Account Holder Name:-\s*(.+)/)?.[1]?.trim() || "";
    const accountNumber = text.match(/Account Number:-\s*([\d]+)/)?.[1] || "";
    const ifsc = text.match(/IFC Code:-\s*([A-Z0-9]+)/)?.[1] || "";

    // 9. Return structured object
    return {
      business: {
        name: businessName,
        phone,
        gstin,
      },
      customer: {
        name: customerName,
        address: customerAddress,
      },
      meta: {
        quoteNo,
        date,
      },
      items,
      totals: {
        subTotal,
        sgst,
        cgst,
        grandTotal,
      },
      bank: {
        bankName,
        accountName,
        accountNumber,
        ifsc,
      },
      amountWords,
    };
  } catch (error) {
    console.error("Error parsing PDF with pdf-parse-new:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to parse PDF.");
  }
}

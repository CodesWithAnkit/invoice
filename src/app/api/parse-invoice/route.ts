import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Dynamically import pdf-parse-new (Node-only)
    const pdfParse = (await import("pdf-parse-new")).default;
    const data = await pdfParse(buffer);
    const text = data.text;

    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    // Extraction Logic (migrated from pdfParser.ts)
    
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

    // Extract additional customer fields
    const customerFields: Record<string, string> = {};
    const mobileMatch = text.match(/Mobile[:-]?\s*(\d{10})/);
    const aadhaarMatch = text.match(/Aadhaar[:-]?\s*(\d{12})/);

    if (mobileMatch) customerFields.phone = mobileMatch[1];
    if (aadhaarMatch) customerFields.aadhaar = aadhaarMatch[1];

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

    return NextResponse.json({
      business: { name: businessName, phone, gstin },
      customer: { name: customerName, address: customerAddress, fields: customerFields },
      meta: { quoteNo, date },
      items,
      totals: { subTotal, sgst, cgst, grandTotal },
      bank: { bankName, accountName, accountNumber, ifsc },
      amountWords
    });

  } catch (error) {
    console.error("API Error parsing PDF:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}

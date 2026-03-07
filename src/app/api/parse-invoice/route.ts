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
    
    // 1. Extract metadata & phone
    const gstin = text.match(/GSTIN:\s*([A-Z0-9]+)/)?.[1] || "";
    const phone = 
      text.match(/Ph\s*:\s*(\d+)/)?.[1] || 
      text.match(/Phone:\s*(\d+)/)?.[1] || 
      "";
    const quoteNo = 
      text.match(/Quote\s*No:\s*#?(\d+)/)?.[1] || 
      text.match(/Invoice\s*#:\s*(\d+)/)?.[1] || 
      "";
    const date = text.match(/Date:\s*([\d/-]+)/)?.[1] || "";

    // 2. Extract business name
    const gstIndex = lines.findIndex((l: string) => l.includes("GSTIN"));
    const businessName = gstIndex > 1 ? lines[gstIndex - 2].trim() : "";

    // 3. Extract customer name and address
    let customerName = "";
    let customerAddress = "";

    const proLine = lines.find((l: string) => l.startsWith("Pro:-"));
    if (proLine) {
      // Format A logic
      customerName = proLine.replace("Pro:-", "").trim();
      customerAddress = text.match(/Address:-\s*(.+)/)?.[1]?.trim() || "";
    } else {
      // Format B fallback
      const billToIndex = lines.findIndex(l => l.toUpperCase().includes("BILL TO"));
      if (billToIndex !== -1) {
        customerName = lines[billToIndex + 1] || "";
        customerAddress = (lines[billToIndex + 2] || "") + " " + (lines[billToIndex + 3] || "");
        customerAddress = customerAddress.trim();
      }
    }

    // Extract additional customer fields
    const customerFields: Record<string, string> = {};
    const mobileMatch = text.match(/Mobile[:-]?\s*(\d{10})/);
    const aadhaarMatch = text.match(/Aadhaar[:-]?\s*(\d{12})/);

    if (mobileMatch) customerFields.phone = mobileMatch[1];
    if (aadhaarMatch) customerFields.aadhaar = aadhaarMatch[1];

    // 5. Extract items
    const tableStart = lines.findIndex((l: string) => l.includes("Item Description"));
    const items: any[] = [];
    let itemBuffer = "";

    if (tableStart !== -1) {
      for (let i = tableStart + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("Amount in Word")) break;

        const hasPrices = /\d+\s+[\d,]+.\d+\s+[\d,]+.\d+/.test(line);

        if (hasPrices) {
          const combined = (itemBuffer + " " + line).trim();
          itemBuffer = "";
          const match = combined.match(/(.+?)\s+(\d+)\s+([\d,.]+)\s+([\d,.]+)/);
          if (match) {
            items.push({
              id: crypto.randomUUID(),
              description: match[1].trim(),
              quantity: parseInt(match[2]),
              unitPrice: parseFloat(match[3].replace(/,/g, "")),
              total: parseFloat(match[4].replace(/,/g, "")),
            });
          }
        } else {
          itemBuffer += " " + line;
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
    const bankName = text.match(/Bank Name[:-]\s*(.+)/)?.[1]?.trim() || "";
    const accountName = 
      text.match(/Account Name[:-]\s*(.+)/)?.[1]?.trim() ||
      text.match(/Account Holder Name[:-]\s*(.+)/)?.[1]?.trim() || 
      "";
    const accountNumber = text.match(/Account Number[:-]\s*(\d+)/)?.[1] || "";
    const ifsc = text.match(/IFSC[:-]\s*([A-Z0-9]+)/)?.[1] || "";

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

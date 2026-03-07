/**
 * Parses an invoice PDF to extract key fields including line items.
 * @param file The PDF file to parse.
 * @returns A partial InvoiceData object with extracted meta, items, and totals.
 */
export const parseInvoicePDF = async (file: File) => {
  if (typeof window === "undefined") return null;

  try {
    // Dynamic import to avoid SSR issues
    const pdfjs = await import("pdfjs-dist");
    
    // Set worker path from the local bundle
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extract text from the first page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // Join text items into one string
    const rawText = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    // Normalize text: replace multiple spaces with a single space
    const text = rawText.replace(/\s+/g, " ");

    // 1. Extract Meta fields using regex
    const invMatch = text.match(/Bill No:\s*#?(\d+)/i);
    const invoiceNumber = invMatch ? invMatch[1] : "";

    const dateMatch = text.match(/Date:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const date = dateMatch ? dateMatch[1] : "";

    // 2. Extract Items using refined regex logic on the table section
    // Identify table bounds
    const tableStart = text.indexOf("Item Description");
    const tableEnd = text.indexOf("Sub Total");
    
    let tableText = text;
    if (tableStart !== -1 && tableEnd !== -1 && tableEnd > tableStart) {
      tableText = text.substring(tableStart, tableEnd);
    }

    // Normalize table spacing
    const cleanTable = tableText.replace(/\s+/g, " ");

    // Refined Pattern: (description) (quantity) (unit price) (total)
    // We use numeric columns as anchors and lookahead for a new item or end of string.
    const itemRegex = /(.+?)\s+(\d{1,2})\s+([\d,]+\.\d+|[\d,]+)\s+([\d,]+\.\d+|[\d,]+)(?=\s+[A-Z]|$)/g;
    const items: any[] = [];
    let match;

    while ((match = itemRegex.exec(cleanTable)) !== null) {
      // Extract capture groups
      let description = match[1].trim();
      const quantity = parseInt(match[2]);
      const unitPrice = parseFloat(match[3].replace(/,/g, ""));
      const total = parseFloat(match[4].replace(/,/g, ""));

      // Clean description artifacts (e.g., trailing "1)", "2)", or specific artifacts from the prompt)
      description = description.replace(/^\d+\)/, "").trim(); // Remove leading "1)"
      description = description.replace(/\s+\d+\)$/, "").trim(); // Remove trailing "1)"

      if (description && !isNaN(quantity) && !isNaN(unitPrice) && !isNaN(total)) {
        items.push({
          id: crypto.randomUUID(),
          description,
          quantity,
          unitPrice,
          total,
        });
      }
    }

    // Helper to clean and parse numbers
    const parseCurrency = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/,/g, ""));
    };

    // 3. Extract Totals
    const subTotalMatch = text.match(/Sub Total\s*([\d,.]+)/i);
    const subTotal = subTotalMatch ? parseCurrency(subTotalMatch[1]) : 0;

    const sgstMatch = text.match(/SGST.*?([\d,.]+)/i);
    const sgst = sgstMatch ? parseCurrency(sgstMatch[1]) : 0;

    const cgstMatch = text.match(/CGST.*?([\d,.]+)/i);
    const cgst = cgstMatch ? parseCurrency(cgstMatch[1]) : 0;

    const grandTotalMatch = text.match(/Grand Total\s*([\d,.]+)/i);
    const grandTotal = grandTotalMatch ? parseCurrency(grandTotalMatch[1]) : 0;

    return {
      meta: { invoiceNumber, date },
      items,
      totals: { subTotal, sgst, cgst, grandTotal },
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF. Please ensure it's a valid invoice PDF.");
  }
};

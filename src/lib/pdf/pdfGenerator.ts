import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Generates and downloads a PDF of the invoice.
 * @param invoiceNumber The invoice number to use for the filename.
 */
export const generateInvoicePDF = async (invoiceNumber: string) => {
  const element = document.getElementById("invoice-root");
  if (!element) {
    console.error("Invoice element not found!");
    return;
  }

  try {
    // 1. Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // 2. Convert canvas to PNG
    const imgData = canvas.toDataURL("image/png");

    // 3. Create jsPDF instance (A4, portrait, mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 4. Calculate dimensions to fit A4 (210mm x 297mm)
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Maintain aspect ratio but fit within A4
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // 5. Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // 6. Download the file with sanitized name
    const safeNumber = invoiceNumber?.replace(/[^a-z0-9-_]/gi, "") || "draft";
    pdf.save(`invoice-${safeNumber}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

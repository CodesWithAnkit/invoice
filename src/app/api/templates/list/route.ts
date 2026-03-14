import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TEMPLATES_URL = "https://raw.githubusercontent.com/CodesWithAnkit/invoice/main/data/invoiceTemplates.json";

export async function GET() {
  try {
    // 1. Try to fetch from GitHub Raw first
    try {
      const response = await fetch(TEMPLATES_URL, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.error("Failed to fetch from GitHub Raw:", e);
    }

    // 2. Fallback to local file if GitHub fetch fails (covers dev mode or first-time setup)
    const jsonPath = path.join(process.cwd(), "data/invoiceTemplates.json");
    if (fs.existsSync(jsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      return NextResponse.json(jsonData);
    }

    return NextResponse.json({ templates: [] });
  } catch (error: any) {
    console.error("List Templates API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

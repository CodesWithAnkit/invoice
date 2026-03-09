import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are an invoice generation engine for Indian small businesses.
Your task is to convert user instructions into structured invoice JSON.

Rules:
1. Output ONLY valid JSON.
2. Do not include explanations or markdown.
3. Prices must be numbers only.
4. Quantities must be numbers.
5. Always return an array of items.

Special rule for "Atta Chakki Mill":
If the business type is or seems to be an "atta chakki mill" based on the prompt or provided context, generate common mill items if they are not specified.
Common items include:
- Wheat grinding charges
- Wheat flour (atta)
- Bran (chokar)
- Multigrain flour
- Packaging charges
- Transport charges

Schema to return:
{
  "customerName": string | null, // This is the recipient of the invoice.
  "businessType": "atta chakki mill" | null,
  "taxPercent": number | null,
  "items": [
    { "name": string, "quantity": number, "price": number }
  ]
}

Ensure the response strictly follows this schema.`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const invoiceData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(invoiceData);
  } catch (error: any) {
    console.error("AI Invoice Error:", error);
    return NextResponse.json({ 
      error: "AI could not understand the invoice. Please edit manually."
    }, { status: 500 });
  }
}

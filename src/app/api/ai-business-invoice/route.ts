import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    // 1. Parse Prompt using Regex
    const budgetMatch = prompt.match(/(?:budget|amount|cost)(?:\s+is)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
    const gstMatch = prompt.match(/(\d+)\s*%\s*gst/i);
    
    const rawBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, "")) : 0;
    const gstPercent = gstMatch ? parseInt(gstMatch[1]) : 18;

    if (rawBudget <= 0) {
      return NextResponse.json({ error: "Could not detect budget from prompt." }, { status: 400 });
    }

    // 2. Calculate Pre-tax Budget
    // preTaxBudget = budget / (1 + gst/100)
    const preTaxBudget = Math.floor(rawBudget / (1 + gstPercent / 100));

    // 3. Call Gemini AI to identify business, items, and budget distribution
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are an expert business consultant and pricing distribution engine.
Based on the user's prompt, identify the type of business they are starting.
Then, generate a list of 5-10 realistic items (machinery, equipment, infrastructure, materials) needed to start this business.
Finally, distribute the provided pre-tax budget across these items.

Rules:
- Total price of all items combined must be exactly or very close to the pre-tax budget.
- Larger machinery gets higher prices.
- Smaller equipment gets lower prices.
- Return valid JSON only. Do not include markdown formatting.

Schema:
{
  "businessType": string, // E.g., "Oil Mill", "Cafe", "Atta Chakki Mill"
  "items": [
    { "name": string, "quantity": number, "price": number }
  ]
}`;

    const userMessage = `User Prompt: "${prompt}"
Total Pre-tax Budget to distribute: ${preTaxBudget}`;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const distributionData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      customerName: null,
      businessType: distributionData.businessType || "Business",
      taxPercent: gstPercent,
      items: distributionData.items,
    });
  } catch (error: any) {
    console.error("AI Business Invoice Error:", error);
    return NextResponse.json({ 
      error: "AI could not generate invoice. Please edit manually." 
    }, { status: 500 });
  }
}

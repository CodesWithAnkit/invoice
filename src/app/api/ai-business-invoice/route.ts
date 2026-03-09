import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getBusinessTemplate } from "@/lib/businessTemplates";

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
    
    // Determine business type (simplified detection)
    let businessType = "atta_chakki_mill";
    if (prompt.toLowerCase().includes("cafe")) businessType = "cafe";
    else if (prompt.toLowerCase().includes("store")) businessType = "general_store";

    const rawBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, "")) : 0;
    const gstPercent = gstMatch ? parseInt(gstMatch[1]) : 18;

    if (rawBudget <= 0) {
      return NextResponse.json({ error: "Could not detect budget from prompt." }, { status: 400 });
    }

    // 2. Calculate Pre-tax Budget
    // preTaxBudget = budget / (1 + gst/100)
    const preTaxBudget = Math.floor(rawBudget / (1 + gstPercent / 100));

    // 3. Load Business Template
    const templateItems = getBusinessTemplate(businessType);
    if (!templateItems) {
      throw new Error("Business template not found.");
    }

    const itemsList = templateItems.map(item => item.name);

    // 4. Call Gemini AI for budget distribution
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are a pricing distribution engine.
Distribute the provided budget across the following items.

Rules:
- Total price must not exceed the budget
- Larger machinery gets higher price
- Smaller equipment gets lower price
- Return JSON only.

Schema:
{
  "items": [
    { "name": string, "quantity": number, "price": number }
  ]
}`;

    const userMessage = `Distribute a total budget of ${preTaxBudget} across these items:
${itemsList.join("\n")}

Ensure the sum of (quantity * price) for all items is exactly or very close to ${preTaxBudget}.`;

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
      businessType: businessType.replace("_", " "),
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

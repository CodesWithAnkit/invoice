import { NextResponse } from "next/server";
import { getBusinessTemplate, BusinessItem, businessTemplates, BusinessTemplate } from "@/lib/businessTemplates";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { form, prompt } = body;

    let normalizedRequest;

    if (form) {
      normalizedRequest = {
        businessType: form.industryType,
        businessName: form.businessName || null,
        budget: Number(form.budget),
        gstPercent: Number(form.gstPercent),
        budgetIncludesGST: Boolean(form.budgetIncludesGST),
        setupMode: form.setupMode,
      };
    } else if (prompt) {
      normalizedRequest = normalizePrompt(prompt);
      if (!normalizedRequest) {
        return NextResponse.json({ error: "Could not understand request" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { businessType, budget, gstPercent, budgetIncludesGST } = normalizedRequest;

    // 1. Template Loader
    let templateItems = getBusinessTemplate(businessType);
    
    // If template not found, generate it using AI
    if (!templateItems) {
      console.log(`Template for "${businessType}" not found. Generating using AI...`);
      const aiTemplate = await generateAITemplate(businessType);
      if (aiTemplate) {
        templateItems = aiTemplate.items;
        // Persist it for next time
        await saveNewTemplate(businessType, aiTemplate);
      } else {
        return NextResponse.json({ error: "Unsupported business type and AI generation failed" }, { status: 400 });
      }
    }

    // 2. Pre Tax Budget
    let preTaxBudget = budget;
    if (budgetIncludesGST) {
      preTaxBudget = Math.floor(budget / (1 + gstPercent / 100));
    }

    // 3. Budget Allocation Engine
    const items = distributeBudget(templateItems, preTaxBudget);

    return NextResponse.json({
      businessType: businessType.replace(/_/g, " "),
      businessName: normalizedRequest.businessName,
      taxPercent: gstPercent,
      items: items,
    });
  } catch (error: any) {
    console.error("Business Invoice API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function generateAITemplate(businessType: string): Promise<BusinessTemplate | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is not configured");
    return null;
  }

  const modelName = "gemini-flash-latest";
  const industryName = businessType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  
  const prompt = `Generate a professional business startup template for a "${industryName}".
  Return ONLY a JSON object with the following schema:
  {
    "industryName": "${industryName}",
    "items": [
      { "name": string, "category": "machine" | "equipment" | "infrastructure" | "material", "quantity": number, "weight": number }
    ]
  }
  Rules:
  - Provide 8-12 essential items.
  - Weights should be between 5 and 50 based on importance/cost.
  - Quantity should be realistic for a startup.
  - No markdown formatting, just raw JSON.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`AI Template Generation Attempt ${attempt} for: ${industryName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const template = JSON.parse(jsonStr) as BusinessTemplate;
      console.log(`Successfully generated template for: ${template.industryName}`);
      return template;
    } catch (error: any) {
      console.error(`AI Generation Attempt ${attempt} failed: ${error.message}`);
      if (error.message.includes("503") && attempt < 3) {
        console.log("Retrying in 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      break; 
    }
  }

  return null;
}

async function saveNewTemplate(businessType: string, template: BusinessTemplate) {
  try {
    const templatePath = path.join(process.cwd(), "src/lib/businessTemplates.ts");

    if (!fs.existsSync(templatePath)) {
      console.error("Template file not found path:", templatePath);
      return;
    }

    let content = fs.readFileSync(templatePath, "utf-8");
    const key = businessType.toLowerCase().replace(/\s+/g, "_");
    
    // Check if key already exists
    if (content.includes(`  ${key}:`)) {
      return;
    }

    const recordEndIndex = content.lastIndexOf("};");
    if (recordEndIndex === -1) return;

    const newEntry = `  ${key}: ${JSON.stringify(template, null, 2)},\n`;
    const updatedContent = content.slice(0, recordEndIndex) + newEntry + content.slice(recordEndIndex);
    
    fs.writeFileSync(templatePath, updatedContent);
    console.log(`Successfully persisted new template: ${key}`);
  } catch (error: any) {
    console.error("Failed to save new template:", error.message);
  }
}

function normalizePrompt(prompt: string) {
  // Extract budget with suffixes: 15 Lakhs, 5k, etc.
  const budgetStrMatch = prompt.match(/(?:budget|amount|cost)(?:\s+is)?\s*(?:rs\.?|inr|₹)?\s*([\d,.]+)\s*(lakhs?|lacs?|k|cr|crores?)?/i);
  let budget = 0;
  if (budgetStrMatch) {
    const num = parseFloat(budgetStrMatch[1].replace(/,/g, ""));
    const suffix = (budgetStrMatch[2] || "").toLowerCase();
    
    if (suffix.startsWith("l")) budget = num * 100000;
    else if (suffix === "k") budget = num * 1000;
    else if (suffix.startsWith("c")) budget = num * 10000000;
    else budget = num;
  }

  const gstMatch = prompt.match(/(\d+)\s*%\s*gst/i);
  const includesGST = /including|with|incl/i.test(prompt);

  if (budget <= 0) return null;

  let businessType = "";
  const lp = prompt.toLowerCase();
  if (lp.includes("cafe")) businessType = "cafe";
  else if (lp.includes("store")) businessType = "general_store";
  else if (lp.includes("atta") || lp.includes("chakki")) businessType = "atta_chakki_mill";
  else if (lp.includes("plate")) businessType = "paper_plate_business";
  else if (lp.includes("cup")) businessType = "paper_cup_business";
  else if (lp.includes("napkin")) businessType = "paper_napkin_business";
  else if (lp.includes("glass")) businessType = "paper_glass_business";
  else {
    // Try to extract a potential business type: "medical store", "bakery", "textile business", etc.
    // 1. Check if it starts with the business name: "Textile business..."
    const startMatch = prompt.match(/^([a-z\s]+?)(?:\s+business|\s+setup|\s+cost|\s+invoice|\s+quotation|$)/i);
    // 2. Check for "for a/an/my [business]"
    const genericMatch = prompt.match(/(?:for|a|an|my)\s+([a-z\s]+?)(?:\s+invoice|\s+quotation|\s+setup|\s+business|$)/i);
    
    const rawType = startMatch ? startMatch[1] : (genericMatch ? genericMatch[1] : "unknown_business");
    businessType = rawType.trim().replace(/\s+/g, "_").toLowerCase();
  }

  return {
    businessType,
    businessName: null,
    budget,
    gstPercent: gstMatch ? parseInt(gstMatch[1]) : 18,
    budgetIncludesGST: includesGST,
    setupMode: "standard",
  };
}

function distributeBudget(templateItems: BusinessItem[], preTaxBudget: number) {
  const totalWeight = templateItems.reduce((sum, item) => sum + item.weight, 0);

  let allocatedTotal = 0;
  const items = templateItems.map((item) => {
    // Total amount allocated for this line item based on weight
    const rawLineTotal = (item.weight / totalWeight) * preTaxBudget;
    // Unit price = Line total / quantity (rounded down to stay within budget)
    const unitPrice = Math.floor(rawLineTotal / item.quantity);
    const finalPrice = unitPrice === 0 ? 1 : unitPrice;
    
    allocatedTotal += finalPrice * item.quantity;
    
    return {
      name: item.name,
      quantity: item.quantity,
      price: finalPrice,
    };
  });

  // If we slightly exceed budget due to the price=1 floor or other rounding, adjust the first item
  if (allocatedTotal > preTaxBudget && items.length > 0) {
    const difference = allocatedTotal - preTaxBudget;
    const adjustmentPerUnit = Math.ceil(difference / items[0].quantity);
    items[0].price = Math.max(1, items[0].price - adjustmentPerUnit);
  }

  return items;
}

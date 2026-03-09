import { NextResponse } from "next/server";
import { getBusinessTemplate, BusinessItem } from "@/lib/businessTemplates";

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
    const templateItems = getBusinessTemplate(businessType);
    if (!templateItems) {
      return NextResponse.json({ error: "Unsupported business type" }, { status: 400 });
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

function normalizePrompt(prompt: string) {
  const budgetMatch = prompt.match(/(?:budget|amount|cost)(?:\s+is)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
  const gstMatch = prompt.match(/(\d+)\s*%\s*gst/i);
  const includesGST = /including|with|incl/i.test(prompt);

  let businessType = "atta_chakki_mill";
  const lp = prompt.toLowerCase();
  if (lp.includes("cafe")) businessType = "cafe";
  else if (lp.includes("store")) businessType = "general_store";
  else if (lp.includes("atta") || lp.includes("chakki")) businessType = "atta_chakki_mill";
  else if (lp.includes("plate")) businessType = "paper_plate_business";
  else if (lp.includes("cup")) businessType = "paper_cup_business";
  else if (lp.includes("napkin")) businessType = "paper_napkin_business";
  else if (lp.includes("glass")) businessType = "paper_glass_business";
  else return null; // Unknown business type in prompt

  const budget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, "")) : 0;
  if (budget <= 0) return null;

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

import { NextResponse } from "next/server";
import { supabase } from "@/../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { prompt, industry } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const aiPrompt = `Generate a JSON array of 5 products related to the following prompt and industry.
Prompt: ${prompt}
Industry: ${industry || 'general'}
Each product must have a 'name' (string) and a 'price' (number in INR).
Do not include any text outside the JSON array. Example: [{"name": "Product A", "price": 100}]`;

    const result = await model.generateContent(aiPrompt);
    const responseText = result.response.text();
    
    // Clean up potentially wrapped markdown
    const jsonStr = responseText.replace(/```json\n|\n```|```/g, "").trim();
    const aiProducts = JSON.parse(jsonStr);

    if (!Array.isArray(aiProducts)) {
      throw new Error("AI did not return an array");
    }

    const productsToInsert = aiProducts.map((p) => ({
      name: p.name,
      price: p.price,
      industry: industry || "general",
      source: "ai",
    }));

    const { data, error } = await supabase
      .from("products")
      .insert(productsToInsert)
      .select();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data });
  } catch (error: any) {
    console.error("Error generating products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

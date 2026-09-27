import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all customers
  const { data: customers } = await supabase.from("customers").select("id, name, business_id").order("created_at", { ascending: true });
  
  if (!customers) return NextResponse.json({ error: "no customers" });

  const seen = new Set<string>();
  const toDelete: string[] = [];
  const replacements: Record<string, string> = {};

  for (const c of customers) {
    const key = `${c.business_id}:${c.name}`;
    if (seen.has(key)) {
      toDelete.push(c.id);
      // find the original
      const original = customers.find(x => `${x.business_id}:${x.name}` === key && !toDelete.includes(x.id));
      if (original) {
        replacements[c.id] = original.id;
      }
    } else {
      seen.add(key);
    }
  }

  // Update invoices
  for (const [oldId, newId] of Object.entries(replacements)) {
    await supabase.from("invoices").update({ customer_id: newId }).eq("customer_id", oldId);
    await supabase.from("projects").update({ customer_id: newId }).eq("customer_id", oldId);
  }

  // Delete duplicates
  if (toDelete.length > 0) {
    await supabase.from("customers").delete().in("id", toDelete);
  }

  return NextResponse.json({ success: true, deleted: toDelete.length, replacements });
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { fail } from "@/lib/api/respond";
import { isTemplatePublishingEnabled, publishTemplate } from "@/lib/templates/publish";

// POST /api/templates/save — admin-only (see src/lib/templates/publish.ts).
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!isTemplatePublishingEnabled()) {
    return fail("Template publishing is disabled.", 403);
  }

  try {
    const { template } = await req.json();

    if (!template || !template.name || !template.items) {
      return fail("Invalid template data", 400);
    }

    const result = await publishTemplate(template);
    if (result.status === "error") return fail(result.message, 500);
    if (result.status === "exists") {
      return NextResponse.json({ message: "Template already exists", success: true });
    }
    return NextResponse.json({ message: "Template saved successfully", success: true });
  } catch (error) {
    console.error("Save Template API Error:", error);
    return fail("Internal Server Error", 500);
  }
}

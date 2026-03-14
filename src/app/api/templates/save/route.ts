import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "CodesWithAnkit";
const REPO_NAME = "invoice";
const FILE_PATH = "data/invoiceTemplates.json";

export async function POST(req: Request) {
  try {
    const { template } = await req.json();

    if (!template || !template.name || !template.items) {
      return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
    }

    if (!GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN is not configured");
      return NextResponse.json({ error: "GitHub configuration error" }, { status: 500 });
    }

    // 1. Fetch current file from GitHub
    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    let currentFile: any = null;
    let templates: any[] = [];

    if (getResponse.ok) {
      currentFile = await getResponse.json();
      const content = Buffer.from(currentFile.content, "base64").toString("utf-8");
      const jsonData = JSON.parse(content);
      templates = jsonData.templates || [];
    } else if (getResponse.status !== 404) {
      const error = await getResponse.json();
      console.error("GitHub Fetch Error:", error);
      return NextResponse.json({ error: "Failed to fetch existing templates" }, { status: 500 });
    }

    // 2. Append new template
    // Ensure ID is unique
    const newId = template.id || template.name.toLowerCase().replace(/\s+/g, "_");
    if (templates.some((t: any) => t.id === newId)) {
        // Update existing if ID matches or skip? For now, we'll just append if not exists or let users know
        // Requirement says "append"
        return NextResponse.json({ message: "Template already exists", success: true });
    }
    
    templates.push({
        ...template,
        id: newId
    });

    // 3. Commit updated file back to GitHub
    const updatedContent = JSON.stringify({ templates }, null, 2);
    const putUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const putResponse = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add template: ${template.name}`,
        content: Buffer.from(updatedContent).toString("base64"),
        sha: currentFile ? currentFile.sha : undefined,
      }),
    });

    if (!putResponse.ok) {
      const error = await putResponse.json();
      console.error("GitHub Commit Error:", error);
      return NextResponse.json({ error: "Failed to save template to GitHub" }, { status: 500 });
    }

    return NextResponse.json({ message: "Template saved successfully", success: true });
  } catch (error: any) {
    console.error("Save Template API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

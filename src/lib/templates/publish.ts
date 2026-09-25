// Publishing industry templates commits to data/invoiceTemplates.json on GitHub,
// which is then served to EVERY business by /api/templates/list. It is therefore
// an admin-only capability, off unless the server sets
// TEMPLATE_PUBLISHING_ENABLED=true (decision 2026-09-26, Phase 0).

const REPO_OWNER = "CodesWithAnkit";
const REPO_NAME = "invoice";
const FILE_PATH = "data/invoiceTemplates.json";

export function isTemplatePublishingEnabled() {
  return process.env.TEMPLATE_PUBLISHING_ENABLED === "true";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Template = { id?: string; name: string; items: any[]; [key: string]: unknown };

export type PublishResult =
  | { status: "published" }
  | { status: "exists" }
  | { status: "error"; message: string };

export async function publishTemplate(template: Template): Promise<PublishResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is not configured");
    return { status: "error", message: "GitHub configuration error" };
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  // 1. Fetch the current file.
  const getResponse = await fetch(url, { headers });
  let currentSha: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let templates: any[] = [];

  if (getResponse.ok) {
    const currentFile = await getResponse.json();
    currentSha = currentFile.sha;
    const content = Buffer.from(currentFile.content, "base64").toString("utf-8");
    templates = JSON.parse(content).templates || [];
  } else if (getResponse.status !== 404) {
    console.error("GitHub Fetch Error:", await getResponse.json());
    return { status: "error", message: "Failed to fetch existing templates" };
  }

  // 2. Append if new.
  const newId = template.id || template.name.toLowerCase().replace(/\s+/g, "_");
  if (templates.some((t) => t.id === newId)) return { status: "exists" };
  templates.push({ ...template, id: newId });

  // 3. Commit the updated file.
  const putResponse = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Add template: ${template.name}`,
      content: Buffer.from(JSON.stringify({ templates }, null, 2)).toString("base64"),
      sha: currentSha,
    }),
  });

  if (!putResponse.ok) {
    console.error("GitHub Commit Error:", await putResponse.json());
    return { status: "error", message: "Failed to save template to GitHub" };
  }
  return { status: "published" };
}

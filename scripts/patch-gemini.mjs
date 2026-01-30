/**
 * One-off: update the Gemini resource description and options in Sanity.
 * Run: node --env-file=.env.local scripts/patch-gemini.mjs
 * Requires: NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local
 */
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: false,
  token,
});

const publishedId = "cdabea71-d5fb-42dc-beb6-ce5a435edfb2";
const draftId = `drafts.${publishedId}`;

const updates = {
  description:
    "Google's multimodal AI assistant. Chat, generate images and code, analyze files, and use the API. Free tier with Gemini 2.0 Flash and Pro.",
  category: "ai-tools",
  tags: ["ai", "chatbot", "google", "multimodal", "api", "code-generation"],
  featured: true,
};

async function main() {
  const draft = await client.getDocument(draftId).catch(() => null);
  const published = await client.getDocument(publishedId).catch(() => null);
  const base = draft ?? published;
  if (!base) {
    console.error("Gemini document not found.");
    process.exit(1);
  }
  const doc = { ...base, _id: draftId, ...updates };
  await client.createOrReplace(doc);
  await client.action([
    {
      actionType: "sanity.action.document.publish",
      publishedId,
      draftId,
    },
  ]);
  console.log("Updated Gemini:", updates);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

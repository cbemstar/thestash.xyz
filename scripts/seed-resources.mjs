/**
 * One-off script: add a few dev/design/AI resource links to Sanity.
 * Run: node scripts/seed-resources.mjs
 * Requires: .env.local with NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN (with Editor or higher)
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

const resources = [
  {
    title: "Figma",
    url: "https://www.figma.com",
    description: "Collaborative interface design tool. Design, prototype, and hand off with Dev Mode.",
    category: "design-tools",
    tags: ["design", "prototyping", "collaboration"],
    featured: true,
  },
  {
    title: "Linear",
    url: "https://linear.app",
    description: "The issue tracking tool for high-performing teams. Fast, minimal, and built for product development.",
    category: "productivity",
    tags: ["issues", "project-management", "speed"],
    featured: true,
  },
  {
    title: "Raycast",
    url: "https://raycast.com",
    description: "Blazingly fast launcher for Mac. Extensions for dev tools, snippets, and AI.",
    category: "productivity",
    tags: ["mac", "launcher", "productivity"],
  },
  {
    title: "Excalidraw",
    url: "https://excalidraw.com",
    description: "Virtual whiteboard for sketching hand-drawn style diagrams. Open source and collaborative.",
    category: "design-tools",
    tags: ["whiteboard", "diagrams", "open-source"],
  },
  {
    title: "Vercel",
    url: "https://vercel.com",
    description: "Develop, preview, and ship. Frontend deployment and serverless functions for modern web apps.",
    category: "development-tools",
    tags: ["hosting", "nextjs", "serverless"],
    featured: true,
  },
];

function slug(id) {
  return id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

async function main() {
  for (const doc of resources) {
    const publishedId = `resource-${slug(doc.title)}`;
    const draftId = `drafts.${publishedId}`;
    const attributes = {
      _type: "resource",
      _id: draftId,
      ...doc,
      createdAt: new Date().toISOString(),
    };
    await client.action([
      {
        actionType: "sanity.action.document.create",
        publishedId,
        attributes,
        ifExists: "ignore",
      },
      {
        actionType: "sanity.action.document.publish",
        publishedId,
        draftId,
      },
    ]);
    console.log("Created and published:", doc.title);
  }
  console.log("Done. Check your site or Studio.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

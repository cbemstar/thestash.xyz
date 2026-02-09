/**
 * Add Tally and EaseMaster resources to Sanity.
 * Run: node --env-file=.env.local scripts/seed-tally-easemaster.mjs
 * Requires: .env.local with NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN (Editor or higher)
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
    title: "Tally",
    url: "https://tally.so",
    description:
      "Free form builder with unlimited forms and submissions. Create surveys, lead gen, and checkouts with conditional logic, file uploads, and payments. GDPR-compliant, EU-hosted.",
    category: "productivity",
    tags: ["forms", "surveys", "no-code", "lead-generation"],
    featured: false,
  },
  {
    title: "EaseMaster",
    url: "https://easemaster.satisui.xyz/",
    description:
      "CSS and spring easing generator. Preview springs and Bézier curves, export code for CSS, Tailwind, Motion, and GSAP. Handles for custom curves and presets.",
    category: "css",
    tags: ["css", "animation", "easing", "design"],
    featured: false,
  },
];

function slug(title) {
  return title
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

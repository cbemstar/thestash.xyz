import { defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schema";

const raw = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const projectId =
  /^[a-z0-9-]+$/.test(raw) && raw.length > 0 ? raw : "placeholder-project-id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (projectId === "placeholder-project-id") {
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is missing or invalid. Set it in .env.local to connect Studio to your project.",
  );
}

export default defineConfig({
  name: "thestash",
  title: "The Stash",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});


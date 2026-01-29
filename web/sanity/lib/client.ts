import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Sanity client will not be fully functional.",
  );
}

export const sanityClient = createClient({
  projectId: projectId || "",
  dataset,
  apiVersion: "2025-01-01",
  useCdn: true,
  perspective: "published",
});


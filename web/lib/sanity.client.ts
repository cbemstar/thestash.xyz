import { createClient } from "next-sanity";

const raw = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
// Sanity allows only a-z, 0-9, and dashes; use placeholder when missing or invalid so build succeeds.
const projectId =
  /^[a-z0-9-]+$/.test(raw) && raw.length > 0 ? raw : "placeholder-project-id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const isSanityConfigured = (): boolean =>
  projectId !== "placeholder-project-id";

if (!isSanityConfigured()) {
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is missing or invalid. Set a valid Sanity project ID for live data.",
  );
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: true,
  perspective: "published",
});


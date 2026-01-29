import { createImageUrlBuilder } from "@sanity/image-url";
import { sanityClient } from "@/lib/sanity.client";

const builder = createImageUrlBuilder(sanityClient);

/** Build Sanity CDN image URL for use with next/image or img src. */
export function urlFor(
  source: { _ref?: string; asset?: { _ref?: string } } | null | undefined
) {
  return builder.image(source ?? {});
}

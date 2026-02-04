import { getResourceSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

interface HomepageItemListJsonLdProps {
  resources: Resource[];
}

export function HomepageItemListJsonLd({ resources }: HomepageItemListJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Dev & Design Resources | The Stash",
    description: "Curated directory of dev and design resources",
    numberOfItems: resources.length,
    itemListElement: resources.slice(0, 50).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: r.title,
        url: `${BASE_URL}/${getResourceSlug(r)}`,
        description: r.description,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

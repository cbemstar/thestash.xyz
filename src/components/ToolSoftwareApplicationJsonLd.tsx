import type { ToolDefinition } from "@/lib/tools-catalog";
import { BASE_URL } from "@/lib/site-url";

interface ToolSoftwareApplicationJsonLdProps {
  tool: ToolDefinition;
}

/**
 * SoftwareApplication JSON-LD for a single tool page. Improves discovery
 * in search and AI overviews (e.g. "free PDF to Markdown tool").
 */
export function ToolSoftwareApplicationJsonLd({ tool }: ToolSoftwareApplicationJsonLdProps) {
  const url = `${BASE_URL}/tools/${tool.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    url,
    description: tool.heroDescription,
    applicationCategory: "DeveloperApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

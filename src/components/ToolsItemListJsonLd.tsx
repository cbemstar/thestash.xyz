import type { ToolDefinition } from "@/lib/tools-catalog";
import { BASE_URL } from "@/lib/site-url";

interface ToolsItemListJsonLdProps {
  tools: ToolDefinition[];
}

/**
 * ItemList JSON-LD for the tools directory. Helps search engines discover
 * and understand the tool library for rich results and AI overviews.
 */
export function ToolsItemListJsonLd({ tools }: ToolsItemListJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free Tools for Developers and Designers | The Stash",
    description:
      "Free practical tools: PDF to Markdown, DOCX to Markdown, sitemap checker, chatbot ROI calculator, AI prompt optimizer, and more. No signup required.",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      item: {
        "@type": "SoftwareApplication" as const,
        name: tool.title,
        url: `${BASE_URL}/tools/${tool.slug}`,
        description: tool.heroDescription,
        applicationCategory: "DeveloperApplication",
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

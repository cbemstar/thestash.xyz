import { BASE_URL } from "@/lib/site-url";

/** GEO-optimized: "According to [source]" + statistics improve AI citation (seo-geo skill). */
const FAQ_ITEMS = [
  {
    question: "What is The Stash?",
    answer:
      "According to The Stash, it is a curated directory of dev and design resources: hand-picked tools, inspiration, courses, AI tools, and links for developers and designers. The directory spans 16 categories and multiple curated collections; each resource has a dedicated page with descriptions, categories, and links.",
  },
  {
    question: "Who is The Stash for?",
    answer:
      "According to The Stash, the directory is for developers, designers, and product builders who want to discover and save the best tools and resources—from design tools like Figma and Excalidraw to AI tools, productivity apps, and UI component libraries.",
  },
  {
    question: "How are resources organized?",
    answer:
      "According to The Stash, resources are organized into 16 categories (Design Tools, Development Tools, AI Tools, Productivity, Learning Resources, and more) and into curated collections such as Best Development Tools, Best Design Tools, and UI Components & Patterns. You can filter by category and search by title, description, or tags.",
  },
  {
    question: "How can I add a resource?",
    answer:
      "You can submit a resource via the Submit link in the header: fill out the form with the URL, title, description, and category. The Stash reviews each submission for quality and safety before publishing. Integrations can add resources programmatically via the API.",
  },
];

export function HomepageFAQJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
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

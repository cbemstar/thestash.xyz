const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

const FAQ_ITEMS = [
  {
    question: "What is The Stash?",
    answer:
      "The Stash is a curated directory of dev and design resources: hand-picked tools, inspiration, courses, AI tools, and links for developers and designers. Each resource has a dedicated page with descriptions, categories, and links to curated collections.",
  },
  {
    question: "Who is The Stash for?",
    answer:
      "The Stash is for developers, designers, and product builders who want to discover and save the best tools and resources—from design tools like Figma and Excalidraw to AI tools, productivity apps, and UI component libraries.",
  },
  {
    question: "How are resources organized?",
    answer:
      "Resources are organized by category (Design Tools, Development Tools, AI Tools, Productivity, Learning Resources, and more) and into curated collections such as Best Development Tools, Best Design Tools, and UI Components & Patterns. You can filter by category and search by title, description, or tags.",
  },
  {
    question: "How can I add a resource?",
    answer:
      "You can submit a resource via the Submit link in the header: fill out the form with the URL, title, description, and category. We review each submission for quality and safety before publishing. Integrations can add resources programmatically via the API.",
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

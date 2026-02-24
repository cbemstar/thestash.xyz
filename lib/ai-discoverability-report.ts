export type AiDiscoverabilitySignal = {
  id: string;
  signal: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  imageUrl: string;
  imageAlt: string;
};

export type AiDiscoverabilityAction = {
  id: string;
  title: string;
  whyItMatters: string;
  executionPlan: string;
  supportingSignalIds: string[];
};

export const AI_DISCOVERABILITY_REPORT_SLUG = "seo-ai-answer-discoverability";
export const AI_DISCOVERABILITY_REPORT_VERIFIED_AT = "2026-02-18T00:00:00.000Z";

const AI_DISCOVERABILITY_SIGNALS: AiDiscoverabilitySignal[] = [
  {
    id: "google-2025-ai-overviews-reach",
    signal: "AI Overviews expanded to 200+ countries and 40+ languages",
    detail:
      "Discoverability strategies now need multilingual and global coverage, not only US-English optimization.",
    sourceLabel: "Google (AI Overviews expansion update)",
    sourceUrl:
      "https://blog.google/products-and-platforms/products/search/ai-overview-expansion-may-2025-update/",
    sourcePublishedAt: "2025-05-20T17:45:00.000Z",
    imageUrl:
      "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/AIO_social_share.max-1440x810.png",
    imageAlt: "Google AI Overviews expansion social graphic.",
  },
  {
    id: "google-2025-ai-overviews-usage-lift",
    signal: "AI Overviews drives over 10% Google usage lift in major markets",
    detail:
      "Google reports uplift in query usage for search types that show AI Overviews, increasing answer-surface competition.",
    sourceLabel: "Google (AI Overviews expansion update)",
    sourceUrl:
      "https://blog.google/products-and-platforms/products/search/ai-overview-expansion-may-2025-update/",
    sourcePublishedAt: "2025-05-20T17:45:00.000Z",
    imageUrl:
      "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/AIO_social_share.max-1440x810.png",
    imageAlt: "Google AI Overviews expansion social graphic.",
  },
  {
    id: "google-2025-ai-overviews-people",
    signal: "AI Overviews used by more than 1 billion people",
    detail:
      "Answer-engine style results now affect mainstream behavior, so citation clarity and page authority become distribution levers.",
    sourceLabel: "Google (AI Mode launch post)",
    sourceUrl:
      "https://blog.google/products-and-platforms/products/search/ai-mode-search/",
    sourcePublishedAt: "2025-03-05T17:00:00.000Z",
    imageUrl:
      "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/ai-mode-hero-image.width-1300.jpg",
    imageAlt: "Google AI Mode and AI Overviews launch visual.",
  },
  {
    id: "google-2025-lens-monthly-scale",
    signal: "Google Lens is used by more than 1.5 billion people every month",
    detail:
      "Visual search scale means report graphics, charts, and image metadata are now part of answer-surface discoverability.",
    sourceLabel: "Google (Search AI mode update)",
    sourceUrl:
      "https://blog.google/products-and-platforms/products/search/google-search-ai-mode-update/",
    sourcePublishedAt: "2025-05-20T17:30:00.000Z",
    imageUrl:
      "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/IO25_SearchSizzle_YT-Thumbnail_051525_Light_V.width-1300.png",
    imageAlt: "Google Search AI mode update cover image.",
  },
];

const AI_DISCOVERABILITY_ACTIONS: AiDiscoverabilityAction[] = [
  {
    id: "discoverability-action-entity-consistency",
    title: "Entity and citation consistency",
    whyItMatters:
      "As AI answer usage scales, pages with clear source attribution and stable entity naming are easier for models to reuse safely.",
    executionPlan:
      "Standardize brand and report naming across title, H1, Dataset schema, and source lists. Keep one canonical report URL and one canonical data file URL.",
    supportingSignalIds: [
      "google-2025-ai-overviews-people",
      "google-2025-ai-overviews-usage-lift",
    ],
  },
  {
    id: "discoverability-action-international-coverage",
    title: "International answer readiness",
    whyItMatters:
      "AI Overviews now operates in hundreds of countries, increasing value from region-aware content structure and localization.",
    executionPlan:
      "Add market-specific report sections for major geos, include explicit locale references in headings, and maintain localized metadata where possible.",
    supportingSignalIds: ["google-2025-ai-overviews-reach"],
  },
  {
    id: "discoverability-action-visual-optimization",
    title: "Visual-first report packaging",
    whyItMatters:
      "Large monthly visual-query behavior increases the chance of discovery through chart images and infographics, not only text snippets.",
    executionPlan:
      "Ship every report with at least one infographic image, descriptive alt text, and image-sitemap coverage for faster indexing.",
    supportingSignalIds: ["google-2025-lens-monthly-scale"],
  },
  {
    id: "discoverability-action-refresh-cadence",
    title: "Predictable update cadence",
    whyItMatters:
      "AI systems and users prefer fresh, source-backed content when evaluating tools and benchmarks.",
    executionPlan:
      "Set monthly source re-verification and publish an updated timestamp plus change log on each report page.",
    supportingSignalIds: [
      "google-2025-ai-overviews-usage-lift",
      "google-2025-ai-overviews-reach",
    ],
  },
];

function sortSignalsByDate(signals: AiDiscoverabilitySignal[]): AiDiscoverabilitySignal[] {
  return [...signals].sort(
    (a, b) => Date.parse(b.sourcePublishedAt) - Date.parse(a.sourcePublishedAt)
  );
}

export function getAiDiscoverabilitySignals(): AiDiscoverabilitySignal[] {
  return sortSignalsByDate(AI_DISCOVERABILITY_SIGNALS);
}

export function getAiDiscoverabilityActions(): AiDiscoverabilityAction[] {
  return AI_DISCOVERABILITY_ACTIONS;
}

export function getAiDiscoverabilityVisualSignals(): AiDiscoverabilitySignal[] {
  const seen = new Set<string>();
  const visuals: AiDiscoverabilitySignal[] = [];
  for (const signal of getAiDiscoverabilitySignals()) {
    const key = `${signal.sourceUrl}|${signal.imageUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    visuals.push(signal);
  }
  return visuals;
}

export function getAiDiscoverabilitySources(): Array<{ label: string; url: string }> {
  const seen = new Set<string>();
  const sources: Array<{ label: string; url: string }> = [];
  for (const signal of getAiDiscoverabilitySignals()) {
    if (seen.has(signal.sourceUrl)) continue;
    seen.add(signal.sourceUrl);
    sources.push({ label: signal.sourceLabel, url: signal.sourceUrl });
  }
  sources.push({
    label: "Google Search Central: AI features and your website",
    url: "https://developers.google.com/search/docs/appearance/ai-features",
  });
  return sources;
}

export function getAiDiscoverabilityReportSummary() {
  const signals = getAiDiscoverabilitySignals();
  return {
    slug: AI_DISCOVERABILITY_REPORT_SLUG,
    title: "SEO and AI-answer discoverability signals (2026)",
    description:
      "Official Google data signals translated into practical SEO and AI-answer discoverability actions.",
    updatedAt: AI_DISCOVERABILITY_REPORT_VERIFIED_AT,
    totalSignals: signals.length,
    totalSources: getAiDiscoverabilitySources().length,
  };
}

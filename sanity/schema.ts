import { defineType, defineField } from "sanity";

type ResourceValidationDocument = {
  alternatives?: unknown[];
  contentTier?: unknown;
};

type ContentTier = "tier1" | "tier2" | "tier3";
type TierWithDepthGate = "tier1" | "tier2";

type ArticleDepthRequirements = {
  minWords: number;
  minHeadings: number;
  minListItems: number;
  minLinks: number;
  minInternalLinks: number;
  minExternalLinks: number;
};

const ARTICLE_DEPTH_REQUIREMENTS: Record<
  TierWithDepthGate,
  ArticleDepthRequirements
> = {
  tier1: {
    minWords: 1200,
    minHeadings: 6,
    minListItems: 6,
    minLinks: 5,
    minInternalLinks: 2,
    minExternalLinks: 2,
  },
  tier2: {
    minWords: 800,
    minHeadings: 4,
    minListItems: 4,
    minLinks: 3,
    minInternalLinks: 1,
    minExternalLinks: 2,
  },
};

const WORD_RE = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

function normalizeContentTier(value: unknown): ContentTier {
  if (value === "tier1" || value === "tier2" || value === "tier3") return value;
  return "tier3";
}

function requiresTieredQuality(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false;
  const tier = normalizeContentTier(
    (doc as ResourceValidationDocument).contentTier
  );
  return tier === "tier1" || tier === "tier2";
}

function hasAlternatives(doc: unknown): doc is ResourceValidationDocument {
  return Boolean(
    doc &&
      typeof doc === "object" &&
      Array.isArray((doc as ResourceValidationDocument).alternatives) &&
      (doc as ResourceValidationDocument).alternatives!.length > 0
  );
}

function countArrayItems(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter(Boolean).length;
}

function hasNonEmptyText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function countWords(text: string): number {
  return (text.match(WORD_RE) ?? []).length;
}

function classifyLinkHref(href: unknown): { internal: boolean; external: boolean } {
  if (!hasNonEmptyText(href)) return { internal: false, external: false };
  const normalized = String(href).trim().toLowerCase();
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../")
  ) {
    return { internal: true, external: false };
  }
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return { internal: false, external: true };
  }
  return { internal: false, external: false };
}

function getArticleBodyMetrics(body: unknown) {
  const metrics = {
    wordCount: 0,
    headingCount: 0,
    listItemCount: 0,
    linkCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
  };

  if (!Array.isArray(body)) return metrics;

  for (const block of body) {
    if (!block || typeof block !== "object") continue;
    const blockData = block as {
      _type?: unknown;
      style?: unknown;
      listItem?: unknown;
      children?: Array<{ _type?: unknown; text?: unknown }>;
      markDefs?: Array<{ _type?: unknown; href?: unknown }>;
      title?: unknown;
      stats?: Array<{ label?: unknown; value?: unknown; subtext?: unknown }>;
    };

    if (blockData._type === "block") {
      if (
        blockData.style === "h2" ||
        blockData.style === "h3" ||
        blockData.style === "h4"
      ) {
        metrics.headingCount += 1;
      }
      if (hasNonEmptyText(blockData.listItem)) metrics.listItemCount += 1;

      const text = Array.isArray(blockData.children)
        ? blockData.children
            .filter((child) => child && child._type === "span")
            .map((child) => String(child.text ?? ""))
            .join(" ")
            .trim()
        : "";
      if (text) metrics.wordCount += countWords(text);

      if (Array.isArray(blockData.markDefs)) {
        for (const mark of blockData.markDefs) {
          if (!mark || mark._type !== "link") continue;
          metrics.linkCount += 1;
          const href = classifyLinkHref(mark.href);
          if (href.internal) metrics.internalLinkCount += 1;
          if (href.external) metrics.externalLinkCount += 1;
        }
      }
      continue;
    }

    if (blockData._type === "infographic") {
      const chunks: string[] = [];
      if (hasNonEmptyText(blockData.title)) chunks.push(String(blockData.title));
      if (Array.isArray(blockData.stats)) {
        for (const stat of blockData.stats) {
          if (!stat || typeof stat !== "object") continue;
          if (hasNonEmptyText(stat.label)) chunks.push(String(stat.label));
          if (hasNonEmptyText(stat.value)) chunks.push(String(stat.value));
          if (hasNonEmptyText(stat.subtext)) chunks.push(String(stat.subtext));
        }
      }
      const text = chunks.join(" ").trim();
      if (text) metrics.wordCount += countWords(text);
    }
  }

  return metrics;
}

export const resource = defineType({
  name: "resource",
  title: "Resource",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "string",
      description: "Used in the resource page URL (e.g. figma, linear). Leave empty to auto-generate from title.",
      validation: (Rule) =>
        Rule.custom((slug) => {
          if (!slug) return true;
          return /^[a-z0-9-]+$/.test(slug) ? true : "Use only lowercase letters, numbers, and hyphens.";
        }),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().min(10).max(260),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Design Tools", value: "design-tools" },
          { title: "Development Tools", value: "development-tools" },
          { title: "UI/UX Resources", value: "ui-ux-resources" },
          { title: "Inspiration", value: "inspiration" },
          { title: "AI Tools", value: "ai-tools" },
          { title: "Productivity", value: "productivity" },
          { title: "Learning Resources", value: "learning-resources" },
          { title: "Webflow", value: "webflow" },
          { title: "Shadcn", value: "shadcn" },
          { title: "Coding", value: "coding" },
          { title: "GitHub", value: "github" },
          { title: "HTML", value: "html" },
          { title: "CSS", value: "css" },
          { title: "JavaScript", value: "javascript" },
          { title: "Languages", value: "languages" },
          { title: "Miscellaneous", value: "miscellaneous" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "resourceType",
      title: "Resource type",
      type: "string",
      description: "Kind of resource (app, website, library, etc.) for browsing by type.",
      options: {
        list: [
          { title: "App", value: "app" },
          { title: "Website", value: "website" },
          { title: "Utility", value: "utility" },
          { title: "Library", value: "library" },
          { title: "Directory", value: "directory" },
          { title: "Article", value: "article" },
          { title: "Tool", value: "tool" },
          { title: "Component", value: "component" },
          { title: "Snippet", value: "snippet" },
          { title: "Course", value: "course" },
          { title: "Framework", value: "framework" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "body",
      title: "Extended description",
      type: "text",
      rows: 6,
      description: "SEO and AI-friendly long-form content: what it is, who it’s for, key benefits. Shown on the resource page below the short description.",
    }),
    defineField({
      name: "sources",
      title: "Sources & further reading",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() },
            { name: "url", title: "URL", type: "url", validation: (Rule) => Rule.required() },
          ],
          preview: { select: { title: "label" }, prepare: ({ title }) => ({ title: title ?? "Source" }) },
        },
      ],
      description: "Credible links (docs, reviews, articles) for SEO and citations.",
      validation: (Rule) =>
        Rule.custom((sources, context) => {
          const needsSources =
            hasAlternatives(context.document) || requiresTieredQuality(context.document);
          if (!needsSources) return true;
          return countArrayItems(sources) >= 3
            ? true
            : "Add at least 3 credible sources for tier1/tier2 or alternatives coverage.";
        }),
    }),
    defineField({
      name: "alternatives",
      title: "Alternatives",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "resource" }],
        },
      ],
      description:
        "Alternative tools for comparison pages (e.g. cursor alternatives).",
      validation: (Rule) =>
        Rule.custom((alternatives) => {
          const count = countArrayItems(alternatives);
          if (count === 0) return true;
          return count >= 2
            ? true
            : "Add at least 2 alternatives to support a meaningful decision matrix.";
        }),
    }),
    defineField({
      name: "bestFor",
      title: "Best for",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description:
        "Short bullets describing who should choose this tool.",
      validation: (Rule) =>
        Rule.custom((bestFor, context) => {
          if (!hasAlternatives(context.document)) return true;
          return countArrayItems(bestFor) >= 1
            ? true
            : "Add at least one best-for bullet when alternatives are configured.";
        }),
    }),
    defineField({
      name: "notFor",
      title: "Not for",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description:
        "Short bullets describing who should avoid this tool.",
      validation: (Rule) =>
        Rule.custom((notFor, context) => {
          if (!hasAlternatives(context.document)) return true;
          return countArrayItems(notFor) >= 1
            ? true
            : "Add at least one not-for bullet when alternatives are configured.";
        }),
    }),
    defineField({
      name: "pricingNotes",
      title: "Pricing notes",
      type: "text",
      rows: 3,
      description:
        "Pricing model notes, usage caps, or upgrade considerations for comparison content.",
      validation: (Rule) =>
        Rule.custom((pricingNotes, context) => {
          if (!hasAlternatives(context.document)) return true;
          return hasNonEmptyText(pricingNotes)
            ? true
            : "Pricing notes are required when alternatives are configured.";
        }),
    }),
    defineField({
      name: "lastReviewedAt",
      title: "Last reviewed at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      description:
        "Editorial freshness marker for SEO pages (used for 90-day review checks).",
      validation: (Rule) =>
        Rule.custom((lastReviewedAt, context) => {
          const needsReviewDate =
            hasAlternatives(context.document) || requiresTieredQuality(context.document);
          if (!needsReviewDate) return true;
          return hasNonEmptyText(lastReviewedAt)
            ? true
            : "Set last reviewed date for tier1/tier2 or alternatives coverage.";
        }),
    }),
    defineField({
      name: "contentTier",
      title: "Content tier",
      type: "string",
      initialValue: "tier3",
      options: {
        list: [
          { title: "Tier 1 (deep decision stack)", value: "tier1" },
          { title: "Tier 2 (enhanced canonical coverage)", value: "tier2" },
          { title: "Tier 3 (baseline canonical coverage)", value: "tier3" },
        ],
        layout: "radio",
      },
      description:
        "Fresh Content Engine tier for this resource. Tier1/Tier2 triggers stricter editorial quality checks.",
    }),
    defineField({
      name: "refreshCadenceDays",
      title: "Refresh cadence (days)",
      type: "number",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          if (typeof value !== "number" || !Number.isInteger(value)) {
            return "Set refresh cadence (integer days) for tier1/tier2 resources.";
          }
          if (value < 7 || value > 365) {
            return "Refresh cadence must be between 7 and 365 days.";
          }
          return true;
        }),
      description:
        "Planned freshness interval used by reporting and weekly review ops.",
    }),
    defineField({
      name: "factCheckStatus",
      title: "Fact-check status",
      type: "string",
      initialValue: "needs-review",
      options: {
        list: [
          { title: "Verified", value: "verified" },
          { title: "Needs review", value: "needs-review" },
        ],
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          return value === "verified" || value === "needs-review"
            ? true
            : "Set fact-check status for tier1/tier2 resources.";
        }),
      description:
        "Used by freshness dashboards and editorial QA to track verification state.",
    }),
    defineField({
      name: "changeLog",
      title: "Change log",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "summary",
              title: "Change summary",
              type: "string",
              validation: (Rule) => Rule.required().min(6).max(200),
            },
            {
              name: "changedAt",
              title: "Changed at",
              type: "datetime",
            },
          ],
          preview: {
            select: { title: "summary", subtitle: "changedAt" },
            prepare: ({ title, subtitle }) => ({
              title: title ?? "Change",
              subtitle: subtitle
                ? new Date(subtitle).toLocaleDateString()
                : "Date not set",
            }),
          },
        },
      ],
      description:
        "Short editorial updates used for freshness context in reporting.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "industries",
      title: "Industries (Recommender)",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "E-commerce", value: "e-commerce" },
          { title: "SaaS / B2B", value: "saas" },
          { title: "Content / Media", value: "content" },
          { title: "Community / Social", value: "community" },
          { title: "Developer tools", value: "developer" },
          { title: "Marketing / Growth", value: "marketing" },
          { title: "Other / General", value: "general" },
        ],
        layout: "tags",
      },
      description: "Industries this tool fits. Used for tech stack recommendations.",
    }),
    defineField({
      name: "pricing",
      title: "Pricing model",
      type: "string",
      options: {
        list: [
          { title: "Free", value: "free" },
          { title: "Freemium", value: "freemium" },
          { title: "Paid", value: "paid" },
          { title: "Enterprise", value: "enterprise" },
          { title: "Open source", value: "open-source" },
        ],
        layout: "dropdown",
      },
      description: "Pricing model for tech stack filtering.",
    }),
    defineField({
      name: "useCases",
      title: "Use cases",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Authentication", value: "auth" },
          { title: "Payments / Billing", value: "payments" },
          { title: "Email / Notifications", value: "email" },
          { title: "Database", value: "database" },
          { title: "Hosting / Deployment", value: "hosting" },
          { title: "Analytics", value: "analytics" },
          { title: "AI / ML", value: "ai" },
          { title: "Design tools", value: "design" },
          { title: "CMS", value: "cms" },
          { title: "Search", value: "search" },
          { title: "Storage / Files", value: "storage" },
          { title: "APIs", value: "apis" },
        ],
        layout: "tags",
      },
      description: "What this tool is used for. Used for tech stack recommendations.",
    }),
    defineField({
      name: "qualityScore",
      title: "Quality score (1–5)",
      type: "number",
      validation: (Rule) => Rule.min(1).max(5).integer(),
      description: "Curator rating for recommendation ranking.",
    }),
    defineField({
      name: "adoptionTier",
      title: "Adoption tier",
      type: "string",
      options: {
        list: [
          { title: "Low", value: "low" },
          { title: "Medium", value: "medium" },
          { title: "High", value: "high" },
          { title: "Popular", value: "popular" },
        ],
        layout: "dropdown",
      },
      description: "How widely adopted (manual curation).",
    }),
    defineField({
      name: "recommenderBlurb",
      title: "Recommender blurb",
      type: "text",
      rows: 2,
      description: '"Best for X because Y" — shown in tech stack recommendations.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          return hasNonEmptyText(value)
            ? true
            : "Add an answer-first recommender blurb for tier1/tier2 resources.";
        }),
    }),
    defineField({
      name: "exampleSites",
      title: "Example sites / Used by",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", title: "Site name", type: "string", validation: (Rule) => Rule.required() },
            { name: "url", title: "URL", type: "url" },
          ],
          preview: { select: { title: "name" }, prepare: ({ title }) => ({ title: title ?? "Site" }) },
        },
      ],
      description: "Real-world sites that use this tool (e.g. Stripe used by Shopify, Lyft). Builds trust.",
    }),
    defineField({
      name: "caseStudy",
      title: "Case study / Real-world note",
      type: "text",
      rows: 3,
      description: "Optional: How this tool is used in practice, with examples or case study snippets.",
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      slug: "slug",
      media: "icon",
    },
    prepare({ title, subtitle, slug, media }) {
      const slugLabel = slug ? `/${slug}` : "(slug from title)";
      return {
        title,
        subtitle: `${subtitle ?? "—"} · ${slugLabel}`,
        media,
      };
    },
  },
});

export const collection = defineType({
  name: "collection",
  title: "Collection",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "string",
      description: "Used in the collection page URL (e.g. best-ai-tools). Leave empty to auto-generate from title.",
      validation: (Rule) =>
        Rule.custom((slug) => {
          if (!slug) return true;
          return /^[a-z0-9-]+$/.test(slug) ? true : "Use only lowercase letters, numbers, and hyphens.";
        }),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().min(10).max(500),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      description: "Hero/cover image for the collection page. Falls back to a themed image if empty.",
    }),
    defineField({
      name: "resources",
      title: "Resources",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "resource" }],
        },
      ],
      validation: (Rule) => Rule.min(1).error("Add at least one resource."),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug",
      createdAt: "createdAt",
    },
    prepare({ title, slug, createdAt }) {
      const slugLabel = slug ? `/${slug}` : "(slug from title)";
      return {
        title,
        subtitle: `${slugLabel}${createdAt ? ` · ${new Date(createdAt).toLocaleDateString()}` : ""}`,
      };
    },
  },
});

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(4).max(140),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "string",
      description:
        "Used in the article URL (e.g. workflow-automation-tools). Leave empty to auto-generate from title.",
      validation: (Rule) =>
        Rule.custom((slug) => {
          if (!slug) return true;
          return /^[a-z0-9-]+$/.test(slug)
            ? true
            : "Use only lowercase letters, numbers, and hyphens.";
        }),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt / meta description",
      type: "text",
      rows: 3,
      description:
        "1–3 sentences used in listings and as the meta description. Aim for 150–160 characters.",
      validation: (Rule) => Rule.required().min(40).max(260),
    }),
    defineField({
      name: "primaryKeyword",
      title: "Primary keyword",
      type: "string",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          return hasNonEmptyText(value)
            ? true
            : "Set a primary keyword for tier1/tier2 articles.";
        }),
      description:
        "Canonical target keyword for this article to prevent cannibalization.",
    }),
    defineField({
      name: "intentStage",
      title: "Intent stage",
      type: "string",
      options: {
        list: [
          { title: "Awareness", value: "awareness" },
          { title: "Consideration", value: "consideration" },
          { title: "Decision", value: "decision" },
          { title: "Implementation", value: "implementation" },
        ],
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          return value === "awareness" ||
            value === "consideration" ||
            value === "decision" ||
            value === "implementation"
            ? true
            : "Set buyer intent stage for tier1/tier2 articles.";
        }),
      description:
        "Buyer-journey stage used for publishing cadence and intent clustering.",
    }),
    defineField({
      name: "contentTier",
      title: "Content tier",
      type: "string",
      initialValue: "tier3",
      options: {
        list: [
          { title: "Tier 1 (deep decision stack)", value: "tier1" },
          { title: "Tier 2 (enhanced canonical coverage)", value: "tier2" },
          { title: "Tier 3 (baseline canonical coverage)", value: "tier3" },
        ],
        layout: "radio",
      },
      description:
        "Fresh Content Engine tier. Tier1/Tier2 articles are quality-gated before indexation.",
    }),
    defineField({
      name: "lastReviewedAt",
      title: "Last reviewed at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          return hasNonEmptyText(value)
            ? true
            : "Set last reviewed date for tier1/tier2 articles.";
        }),
      description:
        "Editorial freshness timestamp used for 90-day review checks and noindex gating.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "object",
          name: "infographic",
          title: "Infographic",
          fields: [
            {
              name: "variant",
              title: "Variant",
              type: "string",
              options: {
                list: [
                  { title: "Single stat callout", value: "callout" },
                  { title: "Stat grid", value: "grid" },
                  { title: "Comparison list", value: "comparison" },
                  { title: "Histogram bars", value: "histogram" },
                ],
                layout: "radio",
              },
              initialValue: "grid",
            },
            { name: "title", title: "Title", type: "string", initialValue: "By the numbers" },
            {
              name: "stats",
              title: "Stats",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "label", title: "Label", type: "string" },
                    { name: "value", title: "Value", type: "string" },
                    { name: "subtext", title: "Subtext", type: "string" },
                  ],
                },
              ],
              validation: (Rule) => Rule.required().min(1),
            },
            { name: "sourceLabel", title: "Source label", type: "string" },
            { name: "sourceUrl", title: "Source URL", type: "url" },
          ],
          preview: {
            select: { title: "title" },
            prepare: ({ title }) => ({ title: title || "Infographic" }),
          },
        },
        {
          type: "object",
          name: "sourcedImage",
          title: "Sourced image",
          fields: [
            {
              name: "imageUrl",
              title: "Image URL",
              type: "url",
              validation: (Rule) => Rule.required(),
              description:
                "Use original image URLs from credible primary sources (official docs, first-party reports, standards bodies).",
            },
            {
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (Rule) => Rule.required().min(8).max(220),
              description:
                "Describe the key visual information for accessibility and image SEO.",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
              validation: (Rule) => Rule.max(260),
            },
            {
              name: "sourceLabel",
              title: "Source label",
              type: "string",
              validation: (Rule) => Rule.required().min(2).max(140),
            },
            {
              name: "sourceUrl",
              title: "Source URL",
              type: "url",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "width",
              title: "Width (px)",
              type: "number",
              validation: (Rule) => Rule.integer().positive().max(10000),
            },
            {
              name: "height",
              title: "Height (px)",
              type: "number",
              validation: (Rule) => Rule.integer().positive().max(10000),
            },
          ],
          preview: {
            select: {
              title: "sourceLabel",
              subtitle: "caption",
            },
            prepare: ({ title, subtitle }) => ({
              title: title || "Sourced image",
              subtitle: subtitle || "External attributed image",
            }),
          },
        },
      ],
      description:
        "SEO and AI-friendly long-form content. Use headings, lists, links, and infographics. Cite credible sources where relevant.",
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((body, context) => {
            const tier = normalizeContentTier(
              (context.document as ResourceValidationDocument | undefined)
                ?.contentTier
            );
            if (tier === "tier3") return true;

            const requirements = ARTICLE_DEPTH_REQUIREMENTS[tier as TierWithDepthGate];
            const metrics = getArticleBodyMetrics(body);
            const reasons: string[] = [];

            if (metrics.wordCount < requirements.minWords) {
              reasons.push(
                `Needs at least ${requirements.minWords} words (currently ${metrics.wordCount}).`
              );
            }
            if (metrics.headingCount < requirements.minHeadings) {
              reasons.push(
                `Needs at least ${requirements.minHeadings} section headings (currently ${metrics.headingCount}).`
              );
            }
            if (metrics.listItemCount < requirements.minListItems) {
              reasons.push(
                `Needs at least ${requirements.minListItems} bullet/checklist items (currently ${metrics.listItemCount}).`
              );
            }
            if (metrics.linkCount < requirements.minLinks) {
              reasons.push(
                `Needs at least ${requirements.minLinks} inline links (currently ${metrics.linkCount}).`
              );
            }
            if (metrics.internalLinkCount < requirements.minInternalLinks) {
              reasons.push(
                `Needs at least ${requirements.minInternalLinks} internal links (currently ${metrics.internalLinkCount}).`
              );
            }
            if (metrics.externalLinkCount < requirements.minExternalLinks) {
              reasons.push(
                `Needs at least ${requirements.minExternalLinks} external links (currently ${metrics.externalLinkCount}).`
              );
            }

            if (reasons.length === 0) return true;
            return reasons.join(" ");
          }),
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
      description:
        "Optional hero/cover image for the article. Used in cards and as a visual on the article page.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Topics and keywords. Used for internal linking and faceted navigation later.",
    }),
    defineField({
      name: "relatedResources",
      title: "Related resources",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "resource" }],
        },
      ],
      description:
        "Optional: resources from The Stash that are mentioned in or closely related to this article.",
    }),
    defineField({
      name: "primaryResource",
      title: "Primary resource",
      type: "reference",
      to: [{ type: "resource" }],
      description:
        "Optional canonical resource focus for this article (tool-centric coverage).",
    }),
    defineField({
      name: "sources",
      title: "Sources & further reading",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "label" },
            prepare: ({ title }) => ({ title: title ?? "Source" }),
          },
        },
      ],
      description:
        "External citations (docs, articles, stats) used in the article. Helps with E-E-A-T and AI visibility.",
      validation: (Rule) =>
        Rule.custom((sources, context) => {
          if (!requiresTieredQuality(context.document)) return true;
          return countArrayItems(sources) >= 3
            ? true
            : "Add at least 3 sources for tier1/tier2 articles.";
        }),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      description:
        "Displayed as the article author. Defaults to The Stash Editorial Team if left empty.",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug",
      publishedAt: "publishedAt",
      media: "heroImage",
    },
    prepare({ title, slug, publishedAt, media }) {
      const slugLabel = slug ? `/blog/${slug}` : "(slug from title)";
      const dateLabel = publishedAt
        ? new Date(publishedAt).toLocaleDateString()
        : "";
      return {
        title,
        subtitle: `${slugLabel}${dateLabel ? ` · ${dateLabel}` : ""}`,
        media,
      };
    },
  },
});

export const comparison = defineType({
  name: "comparison",
  title: "Comparison",
  type: "document",
  validation: (Rule) =>
    Rule.custom((document) => {
      if (!document || typeof document !== "object") return true;
      const doc = document as {
        slug?: unknown;
        leftResource?: { _ref?: string } | string;
        rightResource?: { _ref?: string } | string;
      };
      const leftRef =
        typeof doc.leftResource === "string"
          ? doc.leftResource
          : doc.leftResource?._ref ?? "";
      const rightRef =
        typeof doc.rightResource === "string"
          ? doc.rightResource
          : doc.rightResource?._ref ?? "";
      if (leftRef && rightRef && leftRef === rightRef) {
        return "Left and right resources must be different.";
      }
      if (typeof doc.slug === "string" && doc.slug) {
        const [left, right, extra] = doc.slug.split("-vs-");
        if (!left || !right || extra) {
          return 'Slug must follow the "tool-a-vs-tool-b" format.';
        }
      }
      return true;
    }),
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        "Human-readable title (e.g. Cursor vs GitHub Copilot).",
      validation: (Rule) => Rule.required().min(5).max(140),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "string",
      description:
        "Used in compare URL (e.g. cursor-vs-github-copilot).",
      validation: (Rule) =>
        Rule.required().custom((slug) => {
          if (!slug) return "Slug is required.";
          return /^[a-z0-9-]+$/.test(slug)
            ? true
            : "Use only lowercase letters, numbers, and hyphens.";
        }),
    }),
    defineField({
      name: "leftResource",
      title: "Left resource",
      type: "reference",
      to: [{ type: "resource" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rightResource",
      title: "Right resource",
      type: "reference",
      to: [{ type: "resource" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Answer-first summary",
      type: "text",
      rows: 4,
      description:
        "Who should choose which option and why (first-screen answer).",
      validation: (Rule) => Rule.required().min(40).max(700),
    }),
    defineField({
      name: "winnerByUseCase",
      title: "Winner by use case",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "useCase",
              title: "Use case",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "winner",
              title: "Winner",
              type: "string",
              options: {
                list: [
                  { title: "Left resource", value: "left" },
                  { title: "Right resource", value: "right" },
                  { title: "Tie", value: "tie" },
                ],
                layout: "radio",
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "reason",
              title: "Reason",
              type: "text",
              rows: 2,
              validation: (Rule) => Rule.required().min(10).max(240),
            },
          ],
          preview: {
            select: { title: "useCase", subtitle: "winner" },
            prepare: ({ title, subtitle }) => ({
              title: title ?? "Use case",
              subtitle: subtitle ? `Winner: ${subtitle}` : "Winner not set",
            }),
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "criteriaTable",
      title: "Decision matrix (criteria table)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "criterion",
              title: "Criterion",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "left",
              title: "Left resource value",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "right",
              title: "Right resource value",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "winner",
              title: "Winner",
              type: "string",
              options: {
                list: [
                  { title: "Left resource", value: "left" },
                  { title: "Right resource", value: "right" },
                  { title: "Tie", value: "tie" },
                ],
              },
            },
            {
              name: "notes",
              title: "Notes",
              type: "string",
            },
          ],
          preview: {
            select: {
              title: "criterion",
              left: "left",
              right: "right",
            },
            prepare: ({ title, left, right }) => ({
              title: title ?? "Criterion",
              subtitle: `${left ?? "—"} vs ${right ?? "—"}`,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.required().min(3),
    }),
    defineField({
      name: "migrationChecklist",
      title: "Migration / implementation checklist",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Actionable migration steps for users switching tools.",
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 3,
              validation: (Rule) => Rule.required().min(10).max(320),
            },
          ],
          preview: {
            select: { title: "question" },
            prepare: ({ title }) => ({ title: title ?? "FAQ" }),
          },
        },
      ],
      description:
        "Used for FAQ schema on compare pages.",
    }),
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "label" },
            prepare: ({ title }) => ({ title: title ?? "Source" }),
          },
        },
      ],
      validation: (Rule) => Rule.required().min(3),
      description:
        "At least 3 credible sources required for comparison quality gate.",
    }),
    defineField({
      name: "lastReviewedAt",
      title: "Last reviewed at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
      description:
        "Used to flag comparisons older than 90 days for refresh.",
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug",
      lastReviewedAt: "lastReviewedAt",
    },
    prepare({ title, slug, lastReviewedAt }) {
      const dateLabel = lastReviewedAt
        ? new Date(lastReviewedAt).toLocaleDateString()
        : "No review date";
      return {
        title,
        subtitle: `/compare/${slug ?? "missing-slug"} · reviewed ${dateLabel}`,
      };
    },
  },
});

export const schemaTypes = [resource, collection, article, comparison];

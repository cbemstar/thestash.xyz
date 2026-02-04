import { defineType, defineField } from "sanity";

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

export const schemaTypes = [resource, collection];


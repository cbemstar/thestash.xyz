export type ResourceCategory =
  | "design-tools"
  | "development-tools"
  | "ui-ux-resources"
  | "inspiration"
  | "ai-tools"
  | "productivity"
  | "learning-resources"
  | "miscellaneous"
  | "webflow"
  | "shadcn"
  | "coding"
  | "github"
  | "html"
  | "css"
  | "javascript"
  | "languages";

export type ResourceIndustry =
  | "e-commerce"
  | "saas"
  | "content"
  | "community"
  | "developer"
  | "marketing"
  | "general";

export type ResourcePricing =
  | "free"
  | "freemium"
  | "paid"
  | "enterprise"
  | "open-source";

export type ResourceUseCase =
  | "auth"
  | "payments"
  | "email"
  | "database"
  | "hosting"
  | "analytics"
  | "ai"
  | "design"
  | "cms"
  | "search"
  | "storage"
  | "apis";

export type ResourceAdoptionTier = "low" | "medium" | "high" | "popular";
export type ResourceContentTier = "tier1" | "tier2" | "tier3";
export type ResourceFactCheckStatus = "verified" | "needs-review";

export type ResourceType =
  | "app"
  | "website"
  | "utility"
  | "library"
  | "directory"
  | "article"
  | "tool"
  | "component"
  | "snippet"
  | "course"
  | "framework"
  | "other";

export interface ResourceReference {
  _id: string;
  title: string;
  slug?: string;
  url?: string;
  description?: string;
  category?: ResourceCategory;
  sources?: { label: string; url: string }[];
  bestFor?: string[];
  notFor?: string[];
  pricingNotes?: string | null;
  lastReviewedAt?: string | null;
  contentTier?: ResourceContentTier;
}

export interface Resource {
  _id: string;
  title: string;
  slug?: string;
  url: string;
  description: string;
  category: ResourceCategory;
  resourceType?: ResourceType | null;
  tags?: string[];
  featured?: boolean;
  createdAt?: string;
  icon?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
  /** SEO/AEO long-form content. Shown below description when present. */
  body?: string;
  /** Credible sources for citations and further reading. */
  sources?: { label: string; url: string }[];
  /** Alternatives to compare against this tool. */
  alternatives?: ResourceReference[];
  /** Who this tool is best for. */
  bestFor?: string[];
  /** Who this tool is not for. */
  notFor?: string[];
  /** Pricing notes for comparison pages and alternatives hubs. */
  pricingNotes?: string | null;
  /** Editorial freshness timestamp for SEO quality checks. */
  lastReviewedAt?: string | null;
  /** Tiered editorial coverage for Fresh Content Engine rollout. */
  contentTier?: ResourceContentTier;
  /** Planned freshness cadence in days for editorial reviews. */
  refreshCadenceDays?: number | null;
  /** Current fact-check status for freshness quality gates. */
  factCheckStatus?: ResourceFactCheckStatus | null;
  /** Short editorial change log entries for freshness tracking. */
  changeLog?: { summary: string; changedAt?: string | null }[];
  /** Industries this tool fits (recommender). */
  industries?: ResourceIndustry[];
  /** Pricing model. */
  pricing?: ResourcePricing | null;
  /** Use cases (recommender). */
  useCases?: ResourceUseCase[];
  /** Curator quality score 1–5. */
  qualityScore?: number | null;
  /** Adoption tier (manual curation). */
  adoptionTier?: ResourceAdoptionTier | null;
  /** "Best for X because Y" blurb for recommendations. */
  recommenderBlurb?: string | null;
  /** Real-world sites that use this tool (used by X, Y, Z). */
  exampleSites?: { name: string; url?: string }[];
  /** Case study or real-world use note. */
  caseStudy?: string | null;
}

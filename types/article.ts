export type Article = {
  _id: string;
  title: string;
  slug?: string;
  primaryKeyword?: string;
  intentStage?: "awareness" | "consideration" | "decision" | "implementation";
  contentTier?: "tier1" | "tier2" | "tier3";
  lastReviewedAt?: string | null;
  excerpt: string;
  body: any; // Portable Text blocks array; rendered with @portable-text/react
  heroImage?: {
    asset?: {
      _ref?: string;
      url?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
  tags?: string[];
  relatedResources?: {
    _id: string;
    title: string;
    slug?: string;
  }[];
  primaryResource?: {
    _id: string;
    title: string;
    slug?: string;
  } | null;
  sources?: {
    label: string;
    url: string;
  }[];
  author?: string;
  publishedAt?: string;
};

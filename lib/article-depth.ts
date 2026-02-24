export type ArticleContentTier = "tier1" | "tier2" | "tier3";

export type ArticleDepthMetrics = {
  wordCount: number;
  headingCount: number;
  listItemCount: number;
  linkCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
};

export type ArticleDepthRequirements = {
  minWords: number;
  minHeadings: number;
  minListItems: number;
  minLinks: number;
  minInternalLinks: number;
  minExternalLinks: number;
};

export type ArticleDepthResult = {
  pass: boolean;
  metrics: ArticleDepthMetrics;
  requirements: ArticleDepthRequirements | null;
  reasons: string[];
};

const WORD_RE = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

const ARTICLE_DEPTH_REQUIREMENTS: Record<
  Exclude<ArticleContentTier, "tier3">,
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

type PortableTextSpan = {
  _type?: string;
  text?: string;
  marks?: string[];
};

type PortableTextMarkDef = {
  _key?: string;
  _type?: string;
  href?: string;
};

type PortableTextInfographicStat = {
  label?: string;
  value?: string;
  subtext?: string;
};

type PortableTextBlock = {
  _type?: string;
  style?: string;
  listItem?: string;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
  title?: string;
  stats?: PortableTextInfographicStat[];
};

function countWords(text: string): number {
  return (text.match(WORD_RE) ?? []).length;
}

function isHeadingStyle(style: string | undefined): boolean {
  if (!style) return false;
  return style === "h2" || style === "h3" || style === "h4";
}

function classifyHref(
  href: string | undefined
): { internal: boolean; external: boolean } {
  if (!href || typeof href !== "string") {
    return { internal: false, external: false };
  }
  const normalized = href.trim().toLowerCase();
  if (!normalized) return { internal: false, external: false };
  if (
    normalized.startsWith("/") ||
    normalized.startsWith("#") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../")
  ) {
    return { internal: true, external: false };
  }
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return { internal: false, external: true };
  }
  return { internal: false, external: false };
}

export function getArticleDepthRequirements(
  tier: ArticleContentTier
): ArticleDepthRequirements | null {
  if (tier === "tier3") return null;
  return ARTICLE_DEPTH_REQUIREMENTS[tier];
}

export function getArticleDepthMetrics(body: unknown): ArticleDepthMetrics {
  const metrics: ArticleDepthMetrics = {
    wordCount: 0,
    headingCount: 0,
    listItemCount: 0,
    linkCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
  };

  if (!Array.isArray(body)) return metrics;

  for (const item of body as PortableTextBlock[]) {
    if (!item || typeof item !== "object") continue;

    if (item._type === "block") {
      if (isHeadingStyle(item.style)) metrics.headingCount += 1;
      if (typeof item.listItem === "string" && item.listItem.trim().length > 0) {
        metrics.listItemCount += 1;
      }

      const text = (item.children ?? [])
        .filter((child) => child && child._type === "span")
        .map((child) => String(child.text ?? ""))
        .join(" ")
        .trim();
      if (text) metrics.wordCount += countWords(text);

      for (const mark of item.markDefs ?? []) {
        if (!mark || mark._type !== "link") continue;
        metrics.linkCount += 1;
        const href = classifyHref(mark.href);
        if (href.internal) metrics.internalLinkCount += 1;
        if (href.external) metrics.externalLinkCount += 1;
      }
      continue;
    }

    if (item._type === "infographic") {
      const chunks: string[] = [];
      if (typeof item.title === "string") chunks.push(item.title);
      for (const stat of item.stats ?? []) {
        if (!stat || typeof stat !== "object") continue;
        if (typeof stat.label === "string") chunks.push(stat.label);
        if (typeof stat.value === "string") chunks.push(stat.value);
        if (typeof stat.subtext === "string") chunks.push(stat.subtext);
      }
      const text = chunks.join(" ").trim();
      if (text) metrics.wordCount += countWords(text);
    }
  }

  return metrics;
}

export function evaluateArticleDepth(
  body: unknown,
  tier: ArticleContentTier
): ArticleDepthResult {
  const metrics = getArticleDepthMetrics(body);
  const requirements = getArticleDepthRequirements(tier);
  const reasons: string[] = [];

  if (!requirements) {
    return { pass: true, metrics, requirements: null, reasons };
  }

  if (metrics.wordCount < requirements.minWords) {
    reasons.push(
      `Body needs at least ${requirements.minWords} words (currently ${metrics.wordCount}).`
    );
  }
  if (metrics.headingCount < requirements.minHeadings) {
    reasons.push(
      `Body needs at least ${requirements.minHeadings} section headings (currently ${metrics.headingCount}).`
    );
  }
  if (metrics.listItemCount < requirements.minListItems) {
    reasons.push(
      `Body needs at least ${requirements.minListItems} bullet/checklist items (currently ${metrics.listItemCount}).`
    );
  }
  if (metrics.linkCount < requirements.minLinks) {
    reasons.push(
      `Body needs at least ${requirements.minLinks} inline links (currently ${metrics.linkCount}).`
    );
  }
  if (metrics.internalLinkCount < requirements.minInternalLinks) {
    reasons.push(
      `Body needs at least ${requirements.minInternalLinks} internal links (currently ${metrics.internalLinkCount}).`
    );
  }
  if (metrics.externalLinkCount < requirements.minExternalLinks) {
    reasons.push(
      `Body needs at least ${requirements.minExternalLinks} external links (currently ${metrics.externalLinkCount}).`
    );
  }

  return {
    pass: reasons.length === 0,
    metrics,
    requirements,
    reasons,
  };
}

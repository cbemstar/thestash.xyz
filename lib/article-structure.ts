type PortableTextSpan = {
  _type?: string;
  text?: string;
};

type PortableTextStat = {
  label?: string;
  value?: string;
  subtext?: string;
};

type PortableTextBlock = {
  _type?: string;
  _key?: string;
  style?: string;
  children?: PortableTextSpan[];
  variant?: string;
  stats?: PortableTextStat[];
};

export type ArticleHeadingItem = {
  id: string;
  label: string;
  level: 2 | 3 | 4;
  blockKey?: string;
};

export type ArticleVisualStats = {
  infographics: number;
  histogramInfographics: number;
  sourcedImages: number;
  total: number;
};

const WORD_RE = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

function asPortableTextBlocks(body: unknown): PortableTextBlock[] {
  if (!Array.isArray(body)) return [];
  return body.filter((item): item is PortableTextBlock => Boolean(item) && typeof item === "object");
}

function portableTextToText(block: PortableTextBlock): string {
  if (!Array.isArray(block.children)) return "";
  return block.children
    .filter((child) => child?._type === "span" && typeof child.text === "string")
    .map((child) => child.text?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function toHeadingIdBase(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "section";
}

function toHeadingLevel(style: string): 2 | 3 | 4 | null {
  if (style === "h2") return 2;
  if (style === "h3") return 3;
  if (style === "h4") return 4;
  return null;
}

export function extractArticleHeadings(body: unknown): ArticleHeadingItem[] {
  const blocks = asPortableTextBlocks(body);
  const seenIds = new Map<string, number>();
  const headings: ArticleHeadingItem[] = [];

  for (const block of blocks) {
    if (block._type !== "block" || typeof block.style !== "string") continue;

    const level = toHeadingLevel(block.style);
    if (!level) continue;

    const label = portableTextToText(block);
    if (!label) continue;

    const idBase = toHeadingIdBase(label);
    const seenCount = (seenIds.get(idBase) ?? 0) + 1;
    seenIds.set(idBase, seenCount);
    const id = seenCount > 1 ? `${idBase}-${seenCount}` : idBase;

    headings.push({
      id,
      label,
      level,
      blockKey: typeof block._key === "string" ? block._key : undefined,
    });
  }

  return headings;
}

export function buildHeadingIdByBlockKey(body: unknown): Record<string, string> {
  const headingMap: Record<string, string> = {};
  for (const heading of extractArticleHeadings(body)) {
    if (!heading.blockKey) continue;
    headingMap[heading.blockKey] = heading.id;
  }
  return headingMap;
}

export function countArticleVisuals(body: unknown): ArticleVisualStats {
  const blocks = asPortableTextBlocks(body);
  let infographics = 0;
  let histogramInfographics = 0;
  let sourcedImages = 0;

  for (const block of blocks) {
    if (block._type === "infographic") {
      infographics += 1;
      if (block.variant === "histogram") histogramInfographics += 1;
      continue;
    }
    if (block._type === "sourcedImage") {
      sourcedImages += 1;
    }
  }

  return {
    infographics,
    histogramInfographics,
    sourcedImages,
    total: infographics + sourcedImages,
  };
}

export function estimateArticleReadingMinutes(body: unknown): number {
  const blocks = asPortableTextBlocks(body);
  const words = blocks.reduce((total, block) => {
    if (block._type === "block") {
      return total + (portableTextToText(block).match(WORD_RE)?.length ?? 0);
    }
    if (block._type === "infographic" && Array.isArray(block.stats)) {
      const statWords = block.stats
        .map((stat) => `${stat.label ?? ""} ${stat.value ?? ""} ${stat.subtext ?? ""}`.trim())
        .join(" ");
      return total + (statWords.match(WORD_RE)?.length ?? 0);
    }
    return total;
  }, 0);

  return Math.max(1, Math.round(words / 220));
}

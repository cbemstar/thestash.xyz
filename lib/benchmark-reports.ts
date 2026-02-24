export type AiCodingBenchmarkRow = {
  slug: string;
  tool: string;
  category: "ai-coding-assistant" | "ai-app-builder" | "cloud-dev-platform";
  setupSpeedScore: 1 | 2 | 3 | 4 | 5;
  collaborationScore: 1 | 2 | 3 | 4 | 5;
  extensibilityScore: 1 | 2 | 3 | 4 | 5;
  pricingPredictabilityScore: 1 | 2 | 3 | 4 | 5;
  lockInRiskScore: 1 | 2 | 3 | 4 | 5; // 1 = low risk, 5 = high risk
  pricingModel: string;
  bestFor: string;
  officialUrl: string;
  sources: Array<{ label: string; url: string }>;
};

export const AI_CODING_BENCHMARK_SLUG = "ai-coding-tools-benchmark";
export const AI_CODING_BENCHMARK_UPDATED_AT = "2026-02-13T00:00:00.000Z";

const AI_CODING_BENCHMARK_ROWS: AiCodingBenchmarkRow[] = [
  {
    slug: "cursor",
    tool: "Cursor",
    category: "ai-coding-assistant",
    setupSpeedScore: 5,
    collaborationScore: 3,
    extensibilityScore: 4,
    pricingPredictabilityScore: 4,
    lockInRiskScore: 3,
    pricingModel: "Freemium + paid tiers",
    bestFor: "AI-native editor workflows in app repos",
    officialUrl: "https://cursor.com/",
    sources: [
      { label: "Cursor", url: "https://cursor.com/" },
      { label: "Cursor pricing", url: "https://cursor.com/pricing" },
    ],
  },
  {
    slug: "github-copilot",
    tool: "GitHub Copilot",
    category: "ai-coding-assistant",
    setupSpeedScore: 5,
    collaborationScore: 5,
    extensibilityScore: 3,
    pricingPredictabilityScore: 4,
    lockInRiskScore: 3,
    pricingModel: "Per-user seats",
    bestFor: "GitHub-first teams with policy controls",
    officialUrl: "https://github.com/features/copilot",
    sources: [
      {
        label: "GitHub Copilot",
        url: "https://github.com/features/copilot",
      },
      {
        label: "Copilot plans",
        url: "https://github.com/features/copilot/plans",
      },
    ],
  },
  {
    slug: "windsurf",
    tool: "Windsurf",
    category: "ai-coding-assistant",
    setupSpeedScore: 4,
    collaborationScore: 3,
    extensibilityScore: 3,
    pricingPredictabilityScore: 3,
    lockInRiskScore: 3,
    pricingModel: "Freemium + usage tiers",
    bestFor: "Teams testing newer agentic coding flows",
    officialUrl: "https://windsurf.com/",
    sources: [
      { label: "Windsurf", url: "https://windsurf.com/" },
      { label: "Windsurf docs", url: "https://docs.windsurf.com/" },
    ],
  },
  {
    slug: "claude-code",
    tool: "Claude Code",
    category: "ai-coding-assistant",
    setupSpeedScore: 3,
    collaborationScore: 3,
    extensibilityScore: 5,
    pricingPredictabilityScore: 2,
    lockInRiskScore: 3,
    pricingModel: "Usage-based model billing",
    bestFor: "Terminal-first engineers and script-heavy workflows",
    officialUrl: "https://www.anthropic.com/claude-code",
    sources: [
      {
        label: "Anthropic Claude Code",
        url: "https://www.anthropic.com/claude-code",
      },
      { label: "Anthropic pricing", url: "https://www.anthropic.com/pricing" },
    ],
  },
  {
    slug: "replit",
    tool: "Replit",
    category: "cloud-dev-platform",
    setupSpeedScore: 5,
    collaborationScore: 5,
    extensibilityScore: 3,
    pricingPredictabilityScore: 3,
    lockInRiskScore: 3,
    pricingModel: "Free + paid compute plans",
    bestFor: "Cloud IDE collaboration and teaching/prototype teams",
    officialUrl: "https://replit.com/",
    sources: [
      { label: "Replit", url: "https://replit.com/" },
      { label: "Replit pricing", url: "https://replit.com/pricing" },
    ],
  },
  {
    slug: "v0",
    tool: "v0",
    category: "ai-app-builder",
    setupSpeedScore: 5,
    collaborationScore: 3,
    extensibilityScore: 3,
    pricingPredictabilityScore: 3,
    lockInRiskScore: 3,
    pricingModel: "Usage-based credits",
    bestFor: "Next.js/React UI scaffolding from prompts",
    officialUrl: "https://v0.dev/",
    sources: [
      { label: "v0", url: "https://v0.dev/" },
      { label: "v0 pricing", url: "https://v0.dev/pricing" },
    ],
  },
  {
    slug: "bolt",
    tool: "Bolt.new",
    category: "ai-app-builder",
    setupSpeedScore: 5,
    collaborationScore: 3,
    extensibilityScore: 3,
    pricingPredictabilityScore: 3,
    lockInRiskScore: 4,
    pricingModel: "Usage-based tiers",
    bestFor: "Prompt-to-MVP in browser environments",
    officialUrl: "https://bolt.new/",
    sources: [
      { label: "Bolt.new", url: "https://bolt.new/" },
      { label: "Bolt pricing", url: "https://bolt.new/pricing" },
    ],
  },
  {
    slug: "lovable",
    tool: "Lovable",
    category: "ai-app-builder",
    setupSpeedScore: 5,
    collaborationScore: 3,
    extensibilityScore: 3,
    pricingPredictabilityScore: 3,
    lockInRiskScore: 4,
    pricingModel: "Freemium + paid plans",
    bestFor: "Rapid full-app generation and iterative idea validation",
    officialUrl: "https://lovable.dev/",
    sources: [
      { label: "Lovable", url: "https://lovable.dev/" },
      { label: "Lovable pricing", url: "https://lovable.dev/pricing" },
    ],
  },
];

type BenchmarkWeights = {
  setup: number;
  collaboration: number;
  extensibility: number;
  pricing: number;
  lockIn: number;
};

const BENCHMARK_WEIGHTS: BenchmarkWeights = {
  setup: 0.2,
  collaboration: 0.2,
  extensibility: 0.25,
  pricing: 0.15,
  lockIn: 0.2,
};

export function computeAiCodingBenchmarkScore(row: AiCodingBenchmarkRow): number {
  const lockInInverted = 6 - row.lockInRiskScore;
  const raw =
    row.setupSpeedScore * BENCHMARK_WEIGHTS.setup +
    row.collaborationScore * BENCHMARK_WEIGHTS.collaboration +
    row.extensibilityScore * BENCHMARK_WEIGHTS.extensibility +
    row.pricingPredictabilityScore * BENCHMARK_WEIGHTS.pricing +
    lockInInverted * BENCHMARK_WEIGHTS.lockIn;
  return Number(raw.toFixed(2));
}

export function getAiCodingBenchmarkRows(): Array<
  AiCodingBenchmarkRow & { score: number }
> {
  return AI_CODING_BENCHMARK_ROWS
    .map((row) => ({ ...row, score: computeAiCodingBenchmarkScore(row) }))
    .sort((a, b) => b.score - a.score || a.tool.localeCompare(b.tool));
}

export function getAiCodingBenchmarkSources(): Array<{ label: string; url: string }> {
  const seen = new Set<string>();
  const deduped: Array<{ label: string; url: string }> = [];
  for (const row of AI_CODING_BENCHMARK_ROWS) {
    for (const source of row.sources) {
      if (seen.has(source.url)) continue;
      seen.add(source.url);
      deduped.push(source);
    }
  }
  return deduped;
}

export function getAiCodingBenchmarkSummary() {
  const rows = getAiCodingBenchmarkRows();
  const avgScore =
    rows.reduce((sum, row) => sum + row.score, 0) / Math.max(rows.length, 1);
  return {
    id: "ai-coding-tools-q1-2026",
    title: "AI coding tools benchmark (Q1 2026)",
    description:
      "A weighted benchmark of AI coding assistants and AI app builders across setup speed, collaboration, extensibility, pricing predictability, and lock-in risk.",
    updatedAt: AI_CODING_BENCHMARK_UPDATED_AT,
    totalTools: rows.length,
    averageScore: Number(avgScore.toFixed(2)),
    topTool: rows[0]?.tool ?? "",
    weights: BENCHMARK_WEIGHTS,
  };
}

import {
  getAllComparisonPagesData,
  getComparisonPageDataBySlug,
  getToolProfile,
} from "@/lib/seo-pages";
import type { ComparisonPageData } from "@/lib/seo-pages";

type Direction = "left-to-right" | "right-to-left";

export type MigrationEffortTier = "low" | "medium" | "high";

export type MigrationPhase = {
  title: string;
  duration: string;
  objective: string;
  tasks: string[];
  successCriteria: string[];
};

export type MigrationPageData = {
  slug: string;
  comparisonSlug: string;
  fromSlug: string;
  toSlug: string;
  fromTitle: string;
  toTitle: string;
  title: string;
  summary: string;
  answerFirst: string;
  effortTier: MigrationEffortTier;
  estimatedTimeline: string;
  switchDrivers: string[];
  stayDrivers: string[];
  prerequisites: string[];
  migrationChecklist: string[];
  riskControls: string[];
  phases: MigrationPhase[];
  faq: Array<{ question: string; answer: string }>;
  sources: { label: string; url: string }[];
  lastReviewedAt: string | null;
  relatedMigrationSlugs: string[];
};

function toToolTitle(slug: string, fallback: string): string {
  const profile = getToolProfile(slug);
  return profile?.title ?? fallback;
}

function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function getMigrationSlug(fromSlug: string, toSlug: string): string {
  return `${fromSlug}-to-${toSlug}`;
}

function deriveEffortTier(comparison: ComparisonPageData): MigrationEffortTier {
  let score = 1;
  const criteriaCount = comparison.criteriaTable?.length ?? 0;
  const checklistCount = comparison.migrationChecklist?.length ?? 0;

  if (criteriaCount >= 5) score += 1;
  if (checklistCount >= 4) score += 1;

  if (score <= 1) return "low";
  if (score === 2) return "medium";
  return "high";
}

function effortTimelineLabel(effortTier: MigrationEffortTier): string {
  if (effortTier === "low") return "1 to 3 weeks";
  if (effortTier === "medium") return "3 to 6 weeks";
  return "6 to 10 weeks";
}

function dedupeSources(sources: Array<{ label: string; url: string }>): Array<{ label: string; url: string }> {
  const seen = new Set<string>();
  const result: Array<{ label: string; url: string }> = [];
  for (const source of sources) {
    if (!source.url || seen.has(source.url)) continue;
    seen.add(source.url);
    result.push(source);
  }
  return result;
}

function winnerReasons(
  comparison: ComparisonPageData,
  winner: "left" | "right"
): string[] {
  const fromUseCases = (comparison.winnerByUseCase ?? [])
    .filter((entry) => entry.winner === winner)
    .map((entry) => `${entry.useCase}: ${entry.reason}`);

  if (fromUseCases.length > 0) return fromUseCases;

  return (comparison.criteriaTable ?? [])
    .filter((entry) => entry.winner === winner)
    .map((entry) => `${entry.criterion}: ${winner === "left" ? entry.left : entry.right}`);
}

function defaultChecklist(fromTitle: string, toTitle: string): string[] {
  return [
    `List critical workflows currently handled in ${fromTitle}.`,
    `Map required integrations and APIs before moving to ${toTitle}.`,
    "Run a pilot with one team and define rollback criteria.",
    "Migrate in phases and monitor speed, quality, and cost weekly.",
  ];
}

function toDirectionalMigration(
  comparison: ComparisonPageData,
  direction: Direction
): MigrationPageData {
  const fromIsLeft = direction === "left-to-right";
  const fromSlug = fromIsLeft ? comparison.leftSlug : comparison.rightSlug;
  const toSlug = fromIsLeft ? comparison.rightSlug : comparison.leftSlug;

  const fromFallbackTitle = fromIsLeft
    ? comparison.leftResource?.title ?? prettifySlug(fromSlug)
    : comparison.rightResource?.title ?? prettifySlug(fromSlug);
  const toFallbackTitle = fromIsLeft
    ? comparison.rightResource?.title ?? prettifySlug(toSlug)
    : comparison.leftResource?.title ?? prettifySlug(toSlug);

  const fromTitle = toToolTitle(fromSlug, fromFallbackTitle);
  const toTitle = toToolTitle(toSlug, toFallbackTitle);

  const toWinner = fromIsLeft ? "right" : "left";
  const fromWinner = fromIsLeft ? "left" : "right";

  const switchDrivers = winnerReasons(comparison, toWinner).slice(0, 4);
  const stayDrivers = winnerReasons(comparison, fromWinner).slice(0, 4);

  const effortTier = deriveEffortTier(comparison);
  const migrationChecklist =
    (comparison.migrationChecklist ?? []).length > 0
      ? comparison.migrationChecklist ?? []
      : defaultChecklist(fromTitle, toTitle);

  const prerequisites = [
    `Define success KPIs for moving from ${fromTitle} to ${toTitle}.`,
    "Assign one migration owner and one rollback owner.",
    "Back up critical data and export baseline workflow artifacts.",
  ];

  const riskControls = [
    "Run dual systems for one sprint on critical workflows.",
    "Document rollback triggers before each migration phase.",
    "Track user adoption and issue volume weekly.",
    "Delay full cutover until pilot KPIs are stable for 2 cycles.",
  ];

  const phases: MigrationPhase[] = [
    {
      title: "Phase 1: Audit and plan",
      duration: "Week 1",
      objective: `Document current ${fromTitle} workflows and migration constraints.`,
      tasks: [
        "Inventory current automations, integrations, and permission models.",
        `Identify top 3 workflows that must be reproduced in ${toTitle}.`,
        "Define measurable before/after baselines for cycle time and output quality.",
      ],
      successCriteria: [
        "Scope approved by stakeholders.",
        "Rollback plan and owner confirmed.",
      ],
    },
    {
      title: "Phase 2: Pilot",
      duration: "Weeks 2 to 3",
      objective: `Validate ${toTitle} on one team or one workflow.`,
      tasks: [
        `Migrate one non-critical workflow from ${fromTitle} to ${toTitle}.`,
        "Track throughput, defects, and collaboration friction.",
        "Collect team feedback and adjust process docs.",
      ],
      successCriteria: [
        "Pilot workflow meets or exceeds baseline KPIs.",
        "No unresolved blocker for full migration.",
      ],
    },
    {
      title: "Phase 3: Controlled rollout",
      duration: "Weeks 4 to 6",
      objective: "Expand migration in controlled waves with guardrails.",
      tasks: [
        "Migrate remaining workflows in batches, highest impact first.",
        "Monitor adoption metrics and support issues after each batch.",
        "Pause rollout if quality, velocity, or reliability regresses.",
      ],
      successCriteria: [
        "90%+ targeted workflows migrated without critical regressions.",
        "Support load remains within agreed threshold.",
      ],
    },
    {
      title: "Phase 4: Optimization",
      duration: "Weeks 7+",
      objective: `Optimize ${toTitle} usage and retire legacy paths.`,
      tasks: [
        "Finalize templates, permissions, and onboarding docs.",
        `Decommission unused ${fromTitle} paths to reduce duplicate maintenance.`,
        "Review ROI assumptions against real post-migration metrics.",
      ],
      successCriteria: [
        "Legacy tool usage reduced to planned floor.",
        "Post-migration ROI review completed with next actions.",
      ],
    },
  ];

  const faq = [
    {
      question: `How long does it take to migrate from ${fromTitle} to ${toTitle}?`,
      answer: `Typical timeline is ${effortTimelineLabel(effortTier)} for a phased rollout, depending on integrations and governance requirements.`,
    },
    {
      question: `What is the safest way to migrate from ${fromTitle} to ${toTitle}?`,
      answer:
        "Use a pilot-first approach, dual-run critical workflows, and define rollback criteria before each rollout phase.",
    },
  ];

  return {
    slug: getMigrationSlug(fromSlug, toSlug),
    comparisonSlug: comparison.slug,
    fromSlug,
    toSlug,
    fromTitle,
    toTitle,
    title: `${fromTitle} to ${toTitle} migration plan`,
    summary: `Phased migration guide to move from ${fromTitle} to ${toTitle} with risk controls, timeline estimates, and operational checklists.`,
    answerFirst: `Move from ${fromTitle} to ${toTitle} in phases: plan, pilot, controlled rollout, and optimization. Keep rollback paths and KPI checkpoints in each phase.`,
    effortTier,
    estimatedTimeline: effortTimelineLabel(effortTier),
    switchDrivers,
    stayDrivers,
    prerequisites,
    migrationChecklist,
    riskControls,
    phases,
    faq,
    sources: dedupeSources(comparison.sources ?? []),
    lastReviewedAt: comparison.lastReviewedAt ?? null,
    relatedMigrationSlugs: [],
  };
}

const RAW_MIGRATION_PAGES: MigrationPageData[] = getAllComparisonPagesData().flatMap(
  (comparison) => [
    toDirectionalMigration(comparison, "left-to-right"),
    toDirectionalMigration(comparison, "right-to-left"),
  ]
);

const MIGRATION_BY_SLUG = new Map<string, MigrationPageData>();
for (const page of RAW_MIGRATION_PAGES) {
  if (!MIGRATION_BY_SLUG.has(page.slug)) {
    MIGRATION_BY_SLUG.set(page.slug, page);
  }
}

const FINAL_MIGRATION_PAGES = [...MIGRATION_BY_SLUG.values()].map((page) => {
  const relatedMigrationSlugs = [...MIGRATION_BY_SLUG.values()]
    .filter(
      (candidate) =>
        candidate.slug !== page.slug &&
        (candidate.fromSlug === page.fromSlug ||
          candidate.fromSlug === page.toSlug ||
          candidate.toSlug === page.fromSlug ||
          candidate.toSlug === page.toSlug)
    )
    .slice(0, 6)
    .map((candidate) => candidate.slug);

  return { ...page, relatedMigrationSlugs };
});

const FINAL_MIGRATION_BY_SLUG = new Map(
  FINAL_MIGRATION_PAGES.map((page) => [page.slug, page])
);

export function getAllMigrationPages(): MigrationPageData[] {
  return [...FINAL_MIGRATION_PAGES];
}

export function getAllMigrationSlugs(): string[] {
  return FINAL_MIGRATION_PAGES.map((page) => page.slug);
}

export function getMigrationPageBySlug(slug: string): MigrationPageData | null {
  return FINAL_MIGRATION_BY_SLUG.get(slug) ?? null;
}

export function hasMigrationPage(fromSlug: string, toSlug: string): boolean {
  return FINAL_MIGRATION_BY_SLUG.has(getMigrationSlug(fromSlug, toSlug));
}

export function getMigrationForComparison(
  comparisonSlug: string,
  fromSlug: string,
  toSlug: string
): MigrationPageData | null {
  const direct = getMigrationPageBySlug(getMigrationSlug(fromSlug, toSlug));
  if (direct) return direct;

  const comparison = getComparisonPageDataBySlug(comparisonSlug);
  if (!comparison) return null;
  const direction: Direction =
    comparison.leftSlug === fromSlug && comparison.rightSlug === toSlug
      ? "left-to-right"
      : comparison.leftSlug === toSlug && comparison.rightSlug === fromSlug
        ? "right-to-left"
        : "left-to-right";
  return toDirectionalMigration(comparison, direction);
}

export function evaluateMigrationQuality(page: MigrationPageData): {
  pass: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (page.switchDrivers.length === 0) reasons.push("Missing switch drivers.");
  if (page.migrationChecklist.length < 3) reasons.push("Checklist needs at least 3 steps.");
  if (page.phases.length < 3) reasons.push("Phased rollout needs at least 3 phases.");
  if (page.faq.length === 0) reasons.push("FAQ is missing.");
  if (page.sources.length < 2) reasons.push("Needs at least 2 sources.");
  return { pass: reasons.length === 0, reasons };
}

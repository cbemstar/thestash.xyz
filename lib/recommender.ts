import type { Resource } from "@/types/resource";
import type {
  ResourceIndustry,
  ResourcePricing,
  ResourceUseCase,
} from "@/types/resource";

export const INDUSTRIES: { value: ResourceIndustry; label: string }[] = [
  { value: "e-commerce", label: "E-commerce" },
  { value: "saas", label: "SaaS / B2B" },
  { value: "content", label: "Content / Media" },
  { value: "community", label: "Community / Social" },
  { value: "developer", label: "Developer tools" },
  { value: "marketing", label: "Marketing / Growth" },
  { value: "general", label: "Other / General" },
];

export const USE_CASES: { value: ResourceUseCase; label: string }[] = [
  { value: "auth", label: "Authentication" },
  { value: "payments", label: "Payments / Billing" },
  { value: "email", label: "Email / Notifications" },
  { value: "database", label: "Database" },
  { value: "hosting", label: "Hosting / Deployment" },
  { value: "analytics", label: "Analytics" },
  { value: "ai", label: "AI / ML" },
  { value: "design", label: "Design tools" },
  { value: "cms", label: "CMS" },
  { value: "search", label: "Search" },
  { value: "storage", label: "Storage / Files" },
  { value: "apis", label: "APIs" },
];

export const PRICING_OPTIONS: { value: ResourcePricing | "any"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "free", label: "Free only" },
  { value: "freemium", label: "Freemium OK" },
  { value: "open-source", label: "Open source preferred" },
  { value: "paid", label: "Paid OK" },
  { value: "enterprise", label: "Enterprise" },
];

/** Tag keywords that map to use cases (fallback when useCases not set). */
const TAG_TO_USE_CASE: Partial<Record<string, ResourceUseCase>> = {
  auth: "auth",
  authentication: "auth",
  clerk: "auth",
  supabase: "auth",
  payments: "payments",
  stripe: "payments",
  billing: "payments",
  email: "email",
  resend: "email",
  database: "database",
  postgres: "database",
  hosting: "hosting",
  vercel: "hosting",
  analytics: "analytics",
  ai: "ai",
  design: "design",
  figma: "design",
  cms: "cms",
  sanity: "cms",
  search: "search",
  storage: "storage",
  api: "apis",
  apis: "apis",
};

function getUseCasesFromResource(r: Resource): Set<string> {
  const set = new Set<string>();
  for (const u of r.useCases ?? []) {
    if (typeof u === "string") set.add(u);
  }
  for (const tag of r.tags ?? []) {
    const t = String(tag).toLowerCase();
    const mapped = TAG_TO_USE_CASE[t];
    if (mapped) set.add(mapped);
  }
  return set;
}

function getIndustriesFromResource(r: Resource): Set<string> {
  const set = new Set<string>();
  for (const i of r.industries ?? []) {
    if (typeof i === "string") set.add(i);
  }
  return set;
}

export interface RecommendInput {
  industries: ResourceIndustry[];
  useCases: ResourceUseCase[];
  pricing?: ResourcePricing | "any";
}

export interface ScoredResource {
  resource: Resource;
  score: number;
  reasons: string[];
}

/**
 * Score and rank resources for tech stack recommendations.
 * Works even when resources lack recommender fields (uses tags/category as fallback).
 */
export function scoreResources(
  resources: Resource[],
  input: RecommendInput
): ScoredResource[] {
  const scored: ScoredResource[] = [];

  for (const r of resources) {
    let score = 0;
    const reasons: string[] = [];

    const resourceUseCases = getUseCasesFromResource(r);
    const resourceIndustries = getIndustriesFromResource(r);

    // Industry match
    for (const ind of input.industries) {
      if (resourceIndustries.has(ind)) {
        score += 3;
        reasons.push(`Fits ${INDUSTRIES.find((i) => i.value === ind)?.label ?? ind}`);
        break;
      }
    }

    // Use case match
    for (const uc of input.useCases) {
      if (resourceUseCases.has(uc)) {
        score += 2;
        reasons.push(USE_CASES.find((u) => u.value === uc)?.label ?? uc);
      }
    }

    // Pricing constraint
    const rPricing = r.pricing;
    if (input.pricing && input.pricing !== "any" && rPricing) {
      if (rPricing === input.pricing) {
        score += 2;
        reasons.push(
          PRICING_OPTIONS.find((p) => p.value === rPricing)?.label ?? "Matches pricing"
        );
      } else {
        score -= 1;
      }
    }

    // Quality score
    const q = r.qualityScore;
    if (typeof q === "number" && q >= 1 && q <= 5) {
      score += (q / 5) * 2;
      if (q >= 4) reasons.push("Editor's pick");
    }

    // Adoption
    if (r.adoptionTier === "popular") {
      score += 1;
      reasons.push("Popular");
    } else if (r.adoptionTier === "high") {
      score += 0.5;
    }

    // Featured boost
    if (r.featured) {
      score += 0.5;
    }

    scored.push({ resource: r, score, reasons });
  }

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function getPricingLabel(value: ResourcePricing | null | undefined): string {
  if (!value) return "";
  return PRICING_OPTIONS.find((p) => p.value === value)?.label ?? value;
}

export function getAdoptionLabel(
  tier: "low" | "medium" | "high" | "popular" | null | undefined
): string {
  if (!tier) return "";
  const map: Record<string, string> = {
    low: "Emerging",
    medium: "Growing",
    high: "Widely used",
    popular: "Popular",
  };
  return map[tier] ?? tier;
}

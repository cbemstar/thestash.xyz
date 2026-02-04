"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INDUSTRIES,
  USE_CASES,
  PRICING_OPTIONS,
  scoreResources,
  type RecommendInput,
} from "@/lib/recommender";
import type { ResourceIndustry, ResourcePricing, ResourceUseCase } from "@/types/resource";
import { RecommendResultCard } from "@/components/RecommendResultCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resource";

interface RecommendClientProps {
  resources: Resource[];
}

type Step = 1 | 2 | 3 | 4;

export function RecommendClient({ resources }: RecommendClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [industries, setIndustries] = useState<ResourceIndustry[]>([]);
  const [useCases, setUseCases] = useState<ResourceUseCase[]>([]);
  const [pricing, setPricing] = useState<ResourcePricing | "any">("any");

  // Hydrate from URL
  useEffect(() => {
    const ind = searchParams.get("industry");
    const use = searchParams.get("use");
    const pr = searchParams.get("pricing");
    let hasUpdates = false;
    if (ind) {
      const vals = ind.split(",").filter((v) => v) as ResourceIndustry[];
      if (vals.length > 0) {
        setIndustries(vals);
        hasUpdates = true;
      }
    }
    if (use) {
      const vals = use.split(",").filter((v) => v) as ResourceUseCase[];
      if (vals.length > 0) {
        setUseCases(vals);
        hasUpdates = true;
      }
    }
    if (pr && PRICING_OPTIONS.some((p) => p.value === pr)) {
      setPricing(pr as ResourcePricing | "any");
    }
    // When shared link has industry + use, jump to results
    if (ind && use && hasUpdates) {
      setStep(4);
    }
  }, [searchParams]);

  const toggleIndustry = useCallback((v: ResourceIndustry) => {
    setIndustries((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }, []);

  const toggleUseCase = useCallback((v: ResourceUseCase) => {
    setUseCases((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }, []);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (industries.length) params.set("industry", industries.join(","));
    if (useCases.length) params.set("use", useCases.join(","));
    if (pricing !== "any") params.set("pricing", pricing);
    const q = params.toString();
    if (q) {
      router.replace(`/recommend?${q}`, { scroll: false });
    } else {
      router.replace("/recommend", { scroll: false });
    }
  }, [industries, useCases, pricing, router]);

  const canProceed =
    step === 1 ? industries.length > 0 : step === 2 ? useCases.length > 0 : true;

  const handleNext = useCallback(() => {
    updateUrl();
    if (step < 4) setStep((s) => (s + 1) as Step);
  }, [step, updateUrl]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }, [step]);

  const scored = useMemo(() => {
    if (industries.length === 0 && useCases.length === 0) return [];
    const input: RecommendInput = {
      industries,
      useCases,
      pricing: pricing !== "any" ? pricing : undefined,
    };
    return scoreResources(resources, input);
  }, [resources, industries, useCases, pricing]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Find the right tools for your project
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us your industry and what you need — we&apos;ll recommend curated tools that fit.
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2" role="tablist" aria-label="Steps">
        {([1, 2, 3, 4] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              step >= s ? "bg-primary" : "bg-muted"
            )}
            aria-selected={step === s}
            aria-label={`Step ${s}`}
          />
        ))}
      </div>

      {/* Step 1: Industry */}
      {step === 1 && (
        <section aria-labelledby="step1-title">
          <h2 id="step1-title" className="font-display text-lg font-semibold text-foreground mb-3">
            What&apos;s your industry?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Pick one or more that best describe your project.
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleIndustry(value)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  industries.includes(value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: Use cases */}
      {step === 2 && (
        <section aria-labelledby="step2-title">
          <h2 id="step2-title" className="font-display text-lg font-semibold text-foreground mb-3">
            What do you need?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select the capabilities you&apos;re looking for.
          </p>
          <div className="flex flex-wrap gap-2">
            {USE_CASES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleUseCase(value)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  useCases.includes(value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <section aria-labelledby="step3-title">
          <h2 id="step3-title" className="font-display text-lg font-semibold text-foreground mb-3">
            Pricing preference
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Optional — filter by pricing model.
          </p>
          <div className="flex flex-wrap gap-2">
            {PRICING_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPricing(value as ResourcePricing | "any")}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  pricing === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <section aria-labelledby="step4-title">
          <h2 id="step4-title" className="font-display text-lg font-semibold text-foreground mb-2">
            Recommended tools
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {scored.length} {scored.length === 1 ? "tool" : "tools"} match your criteria.
          </p>
          {scored.length > 0 ? (
            <ul className="space-y-4" role="list">
              {scored.slice(0, 24).map((s) => (
                <li key={s.resource._id}>
                  <RecommendResultCard scored={s} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
              <p>No tools match yet. Try adding more industries or use cases.</p>
              <p className="mt-1 text-sm">
                You can also leave pricing as &quot;Any&quot; for more results.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="shrink-0"
        >
          Back
        </Button>
        {step < 4 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="shrink-0"
          >
            {step === 3 ? "Get recommendations" : "Next"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setIndustries([]);
              setUseCases([]);
              setPricing("any");
              setStep(1);
              router.replace("/recommend", { scroll: false });
            }}
            className="shrink-0"
          >
            Start over
          </Button>
        )}
      </div>
    </div>
  );
}

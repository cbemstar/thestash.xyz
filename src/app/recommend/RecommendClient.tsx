"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INDUSTRIES,
  USE_CASES,
  PRICING_OPTIONS,
  scoreResources,
  type RecommendInput,
} from "@/lib/recommender";
import type { ResourceIndustry, ResourcePricing, ResourceUseCase } from "@/types/resource";
import Stepper, { Step } from "@/components/Stepper";
import { RecommendResultCard } from "@/components/RecommendResultCard";
import { useSavedResources } from "@/hooks/useSavedResources";
import { getResourceSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resource";

interface RecommendClientProps {
  resources: Resource[];
}

type StepNum = 1 | 2 | 3 | 4;

export function RecommendClient({ resources }: RecommendClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSaved, toggleSaved } = useSavedResources();
  const [step, setStep] = useState<StepNum>(1);
  const [initialStep, setInitialStep] = useState<StepNum>(1);
  const [stepperKey, setStepperKey] = useState(0);
  const [industries, setIndustries] = useState<ResourceIndustry[]>([]);
  const [useCases, setUseCases] = useState<ResourceUseCase[]>([]);
  const [pricing, setPricing] = useState<ResourcePricing | "any">("any");
  const hasJumpedFromSharedLink = useRef(false);

  // Hydrate from URL on mount; jump to results for shared links
  useEffect(() => {
    const ind = searchParams.get("industry");
    const use = searchParams.get("use");
    const pr = searchParams.get("pricing");
    if (ind) {
      const vals = ind.split(",").filter((v) => v) as ResourceIndustry[];
      if (vals.length > 0) setIndustries(vals);
    }
    if (use) {
      const vals = use.split(",").filter((v) => v) as ResourceUseCase[];
      if (vals.length > 0) setUseCases(vals);
    }
    if (pr && PRICING_OPTIONS.some((p) => p.value === pr)) {
      setPricing(pr as ResourcePricing | "any");
    }
    if (!hasJumpedFromSharedLink.current && ind && use) {
      setInitialStep(4);
      setStep(4);
      hasJumpedFromSharedLink.current = true;
    }
    hasJumpedFromSharedLink.current = true;
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

  const scored = useMemo(() => {
    if (industries.length === 0 && useCases.length === 0) return [];
    const input: RecommendInput = {
      industries,
      useCases,
      pricing: pricing !== "any" ? pricing : undefined,
    };
    return scoreResources(resources, input);
  }, [resources, industries, useCases, pricing]);

  const handleStepChange = useCallback(
    (newStep: number) => {
      setStep(newStep as StepNum);
      updateUrl();
    },
    [updateUrl]
  );

  const handleFinalStepCompleted = useCallback(() => {
    setIndustries([]);
    setUseCases([]);
    setPricing("any");
    setStep(1);
    setInitialStep(1);
    setStepperKey((k) => k + 1);
    router.replace("/recommend", { scroll: false });
  }, [router]);

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-8 overflow-x-hidden">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Find the right tools for your project
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us your industry and what you need — we&apos;ll recommend curated tools that fit.
        </p>
      </div>

      <div className="min-w-0 [&_.step-circle-container]:min-w-0">
        <Stepper
          key={`stepper-${stepperKey}-${initialStep}`}
          initialStep={initialStep}
          onStepChange={handleStepChange}
          onFinalStepCompleted={handleFinalStepCompleted}
          backButtonText="Back"
          nextButtonText="Next"
          lastStepButtonText="Start over"
          nextButtonProps={{ disabled: !canProceed }}
          fullHeight
          stepCircleContainerClassName="!max-w-3xl border-border bg-card"
          contentClassName="!pb-0"
          footerClassName="pb-6"
        >
        <Step>
          <section aria-labelledby="step1-title">
            <h2 id="step1-title" className="font-display text-lg font-semibold text-foreground">
              What&apos;s your industry?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick one or more that best describe your project.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {INDUSTRIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleIndustry(value)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        </Step>

        <Step>
          <section aria-labelledby="step2-title">
            <h2 id="step2-title" className="font-display text-lg font-semibold text-foreground">
              What do you need?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the capabilities you&apos;re looking for.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {USE_CASES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleUseCase(value)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        </Step>

        <Step>
          <section aria-labelledby="step3-title">
            <h2 id="step3-title" className="font-display text-lg font-semibold text-foreground">
              Pricing preference
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional — filter by pricing model.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PRICING_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPricing(value as ResourcePricing | "any")}
                  className={cn(
                    "cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        </Step>

        <Step>
          <section aria-labelledby="step4-title" className="min-w-0">
            <h2 id="step4-title" className="font-display text-lg font-semibold text-foreground">
              Recommended tools
            </h2>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {scored.length} {scored.length === 1 ? "tool" : "tools"} match your criteria.
              </p>
              {scored.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const slugs = scored.slice(0, 24).map((s) => getResourceSlug(s.resource));
                    const unsaved = slugs.filter((slug) => !isSaved(slug));
                    unsaved.forEach((slug) => toggleSaved(slug));
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors duration-200",
                    "hover:border-primary/50 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                >
                  Save all
                </button>
              )}
            </div>
            {scored.length > 0 ? (
              <ul
                className="mt-6 space-y-4 overflow-x-hidden pt-2 pb-4"
                role="list"
              >
                {scored.slice(0, 24).map((s) => (
                  <li key={s.resource._id} className="min-w-0">
                    <RecommendResultCard
                      scored={s}
                      isSaved={isSaved}
                      onSaveToggle={toggleSaved}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-muted-foreground">
                <p>No tools match yet. Try adding more industries or use cases.</p>
                <p className="mt-1 text-sm">
                  You can also leave pricing as &quot;Any&quot; for more results.
                </p>
              </div>
            )}
          </section>
        </Step>
        </Stepper>
      </div>
    </div>
  );
}

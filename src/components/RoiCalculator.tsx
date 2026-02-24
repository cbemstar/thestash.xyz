"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { calculateRoi, formatUsd, type RoiScenario } from "@/lib/roi";

type RoiCalculatorProps = {
  contextLabel: string;
  className?: string;
};

function toNumberOrZero(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatPayback(paybackMonths: number | null): string {
  if (paybackMonths === null) return "No payback with current assumptions";
  if (paybackMonths === 0) return "Immediate";
  return `${paybackMonths.toFixed(1)} months`;
}

export function RoiCalculator({ contextLabel, className }: RoiCalculatorProps) {
  const [scenario, setScenario] = useState<RoiScenario>("expected");
  const [teamSize, setTeamSize] = useState("6");
  const [blendedHourlyRate, setBlendedHourlyRate] = useState("85");
  const [hoursSavedPerPersonPerWeek, setHoursSavedPerPersonPerWeek] = useState("2");
  const [currentMonthlyToolSpend, setCurrentMonthlyToolSpend] = useState("300");
  const [projectedMonthlyToolSpend, setProjectedMonthlyToolSpend] = useState("550");
  const [oneTimeMigrationHours, setOneTimeMigrationHours] = useState("24");
  const [monthlyRevenueLift, setMonthlyRevenueLift] = useState("1200");

  const result = useMemo(
    () =>
      calculateRoi({
        scenario,
        teamSize: toNumberOrZero(teamSize),
        blendedHourlyRate: toNumberOrZero(blendedHourlyRate),
        hoursSavedPerPersonPerWeek: toNumberOrZero(hoursSavedPerPersonPerWeek),
        currentMonthlyToolSpend: toNumberOrZero(currentMonthlyToolSpend),
        projectedMonthlyToolSpend: toNumberOrZero(projectedMonthlyToolSpend),
        oneTimeMigrationHours: toNumberOrZero(oneTimeMigrationHours),
        monthlyRevenueLift: toNumberOrZero(monthlyRevenueLift),
      }),
    [
      scenario,
      teamSize,
      blendedHourlyRate,
      hoursSavedPerPersonPerWeek,
      currentMonthlyToolSpend,
      projectedMonthlyToolSpend,
      oneTimeMigrationHours,
      monthlyRevenueLift,
    ]
  );

  return (
    <section
      aria-labelledby="roi-calculator-title"
      className={cn("rounded-xl border border-border bg-card/30 p-4 sm:p-6", className)}
    >
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Business impact
        </p>
        <h2 id="roi-calculator-title" className="font-display text-2xl font-semibold text-foreground">
          ROI calculator
        </h2>
        <p className="text-sm text-muted-foreground">
          Estimate the monthly upside for {contextLabel}. Use conservative assumptions, then
          validate with a pilot.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="roi-team-size">Team size</Label>
          <Input
            id="roi-team-size"
            inputMode="numeric"
            type="number"
            min={0}
            value={teamSize}
            onChange={(event) => setTeamSize(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-hourly-rate">Blended hourly rate ($)</Label>
          <Input
            id="roi-hourly-rate"
            inputMode="decimal"
            type="number"
            min={0}
            value={blendedHourlyRate}
            onChange={(event) => setBlendedHourlyRate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-hours-saved">Hours saved per person/week</Label>
          <Input
            id="roi-hours-saved"
            inputMode="decimal"
            type="number"
            min={0}
            value={hoursSavedPerPersonPerWeek}
            onChange={(event) => setHoursSavedPerPersonPerWeek(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-scenario">Scenario</Label>
          <Select value={scenario} onValueChange={(value) => setScenario(value as RoiScenario)}>
            <SelectTrigger id="roi-scenario" aria-label="Scenario">
              <SelectValue placeholder="Expected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="expected">Expected</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-current-spend">Current monthly tool spend ($)</Label>
          <Input
            id="roi-current-spend"
            inputMode="decimal"
            type="number"
            min={0}
            value={currentMonthlyToolSpend}
            onChange={(event) => setCurrentMonthlyToolSpend(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-projected-spend">Projected monthly tool spend ($)</Label>
          <Input
            id="roi-projected-spend"
            inputMode="decimal"
            type="number"
            min={0}
            value={projectedMonthlyToolSpend}
            onChange={(event) => setProjectedMonthlyToolSpend(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-migration-hours">One-time migration hours</Label>
          <Input
            id="roi-migration-hours"
            inputMode="decimal"
            type="number"
            min={0}
            value={oneTimeMigrationHours}
            onChange={(event) => setOneTimeMigrationHours(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roi-revenue-lift">Monthly revenue lift ($)</Label>
          <Input
            id="roi-revenue-lift"
            inputMode="decimal"
            type="number"
            min={0}
            value={monthlyRevenueLift}
            onChange={(event) => setMonthlyRevenueLift(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Monthly net impact
          </p>
          <p
            className={cn(
              "mt-1 text-lg font-semibold",
              result.monthlyNetImpact >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
            )}
          >
            {formatUsd(result.monthlyNetImpact)}
          </p>
        </article>
        <article className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Annual net impact
          </p>
          <p
            className={cn(
              "mt-1 text-lg font-semibold",
              result.annualNetImpact >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
            )}
          >
            {formatUsd(result.annualNetImpact)}
          </p>
        </article>
        <article className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            One-time migration cost
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatUsd(result.migrationCost)}
          </p>
        </article>
        <article className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Payback period
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatPayback(result.paybackMonths)}
          </p>
        </article>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li>Productivity value/month: {formatUsd(result.monthlyProductivityValue)}</li>
        <li>
          Tool spend delta/month:{" "}
          <span className={result.monthlyCostDelta <= 0 ? "text-emerald-700 dark:text-emerald-300" : undefined}>
            {formatUsd(result.monthlyCostDelta)}
          </span>
        </li>
      </ul>
    </section>
  );
}

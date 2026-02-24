export type RoiScenario = "conservative" | "expected" | "aggressive";

export type RoiInputs = {
  teamSize: number;
  blendedHourlyRate: number;
  hoursSavedPerPersonPerWeek: number;
  currentMonthlyToolSpend: number;
  projectedMonthlyToolSpend: number;
  oneTimeMigrationHours: number;
  monthlyRevenueLift: number;
  scenario: RoiScenario;
};

export type RoiResult = {
  monthlyProductivityValue: number;
  monthlyCostDelta: number;
  migrationCost: number;
  monthlyNetImpact: number;
  annualNetImpact: number;
  paybackMonths: number | null;
};

const SCENARIO_MULTIPLIER: Record<RoiScenario, number> = {
  conservative: 0.75,
  expected: 1,
  aggressive: 1.25,
};

const WEEKS_PER_MONTH = 4.33;

function normalizeNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
}

export function calculateRoi(inputs: RoiInputs): RoiResult {
  const teamSize = normalizeNonNegative(inputs.teamSize);
  const blendedHourlyRate = normalizeNonNegative(inputs.blendedHourlyRate);
  const hoursSavedPerPersonPerWeek = normalizeNonNegative(inputs.hoursSavedPerPersonPerWeek);
  const currentMonthlyToolSpend = normalizeNonNegative(inputs.currentMonthlyToolSpend);
  const projectedMonthlyToolSpend = normalizeNonNegative(inputs.projectedMonthlyToolSpend);
  const oneTimeMigrationHours = normalizeNonNegative(inputs.oneTimeMigrationHours);
  const monthlyRevenueLift = normalizeNonNegative(inputs.monthlyRevenueLift);
  const multiplier = SCENARIO_MULTIPLIER[inputs.scenario] ?? 1;

  const adjustedHoursSavedPerWeek = hoursSavedPerPersonPerWeek * multiplier;
  const adjustedRevenueLift = monthlyRevenueLift * multiplier;

  const monthlyProductivityValue =
    teamSize * blendedHourlyRate * adjustedHoursSavedPerWeek * WEEKS_PER_MONTH;
  const monthlyCostDelta = projectedMonthlyToolSpend - currentMonthlyToolSpend;
  const migrationCost = oneTimeMigrationHours * blendedHourlyRate;
  const monthlyNetImpact = monthlyProductivityValue + adjustedRevenueLift - monthlyCostDelta;
  const annualNetImpact = monthlyNetImpact * 12;

  const paybackMonths =
    monthlyNetImpact > 0 ? (migrationCost <= 0 ? 0 : migrationCost / monthlyNetImpact) : null;

  return {
    monthlyProductivityValue,
    monthlyCostDelta,
    migrationCost,
    monthlyNetImpact,
    annualNetImpact,
    paybackMonths,
  };
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(value: number): string {
  return usdFormatter.format(value);
}

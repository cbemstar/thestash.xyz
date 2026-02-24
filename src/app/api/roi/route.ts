import { NextRequest, NextResponse } from "next/server";
import { calculateRoi, type RoiInputs, type RoiScenario } from "@/lib/roi";

const DEFAULT_INPUTS: RoiInputs = {
  scenario: "expected",
  teamSize: 6,
  blendedHourlyRate: 85,
  hoursSavedPerPersonPerWeek: 2,
  currentMonthlyToolSpend: 300,
  projectedMonthlyToolSpend: 550,
  oneTimeMigrationHours: 24,
  monthlyRevenueLift: 1200,
};

function toNonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function toScenario(value: unknown): RoiScenario {
  return value === "conservative" || value === "expected" || value === "aggressive"
    ? value
    : DEFAULT_INPUTS.scenario;
}

function parseInputs(payload: Record<string, unknown>): RoiInputs {
  return {
    scenario: toScenario(payload.scenario),
    teamSize: toNonNegativeNumber(payload.teamSize, DEFAULT_INPUTS.teamSize),
    blendedHourlyRate: toNonNegativeNumber(
      payload.blendedHourlyRate,
      DEFAULT_INPUTS.blendedHourlyRate
    ),
    hoursSavedPerPersonPerWeek: toNonNegativeNumber(
      payload.hoursSavedPerPersonPerWeek,
      DEFAULT_INPUTS.hoursSavedPerPersonPerWeek
    ),
    currentMonthlyToolSpend: toNonNegativeNumber(
      payload.currentMonthlyToolSpend,
      DEFAULT_INPUTS.currentMonthlyToolSpend
    ),
    projectedMonthlyToolSpend: toNonNegativeNumber(
      payload.projectedMonthlyToolSpend,
      DEFAULT_INPUTS.projectedMonthlyToolSpend
    ),
    oneTimeMigrationHours: toNonNegativeNumber(
      payload.oneTimeMigrationHours,
      DEFAULT_INPUTS.oneTimeMigrationHours
    ),
    monthlyRevenueLift: toNonNegativeNumber(
      payload.monthlyRevenueLift,
      DEFAULT_INPUTS.monthlyRevenueLift
    ),
  };
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    payload = body ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputs = parseInputs(payload);
  const result = calculateRoi(inputs);
  return NextResponse.json({ inputs, result });
}

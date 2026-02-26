export type CalculatorCategorySlug =
  | "finance"
  | "health"
  | "math"
  | "time"
  | "utility"
  | "engineering"
  | "embed";

export type CalculatorEngine =
  | "mortgage"
  | "loan"
  | "growth"
  | "percentage"
  | "age"
  | "time"
  | "tax"
  | "affordability"
  | "debt"
  | "financial-metrics"
  | "currency"
  | "inflation"
  | "bmi"
  | "calorie"
  | "body-fat"
  | "pregnancy"
  | "pace"
  | "scientific"
  | "geometry"
  | "statistics"
  | "random"
  | "password"
  | "grade"
  | "conversion"
  | "speed"
  | "fuel"
  | "construction"
  | "ohm"
  | "weather"
  | "embed"
  | "generic";

export type CalculatorCategoryDefinition = {
  slug: CalculatorCategorySlug;
  label: string;
  kicker: string;
  description: string;
};

export type CalculatorDefinition = {
  slug: string;
  title: string;
  category: CalculatorCategorySlug;
  engine: CalculatorEngine;
  summary: string;
  heroDescription: string;
  actionLabel: string;
  featured?: boolean;
  referenceUrl?: string;
};

type RawCalculator = {
  title: string;
  category: CalculatorCategorySlug;
  engine: CalculatorEngine;
  referenceUrl?: string;
  featured?: boolean;
};

export const CALCULATOR_CATEGORIES: CalculatorCategoryDefinition[] = [
  {
    slug: "finance",
    label: "Finance",
    kicker: "Money planning",
    description:
      "Model payments, payoff timelines, investments, and tax-impact scenarios with clear assumptions.",
  },
  {
    slug: "health",
    label: "Health",
    kicker: "Health metrics",
    description:
      "Run baseline body, calorie, pregnancy, and fitness calculations for planning and tracking.",
  },
  {
    slug: "math",
    label: "Math",
    kicker: "Math and statistics",
    description:
      "Solve common math, geometry, probability, and statistics workflows quickly.",
  },
  {
    slug: "time",
    label: "Time and date",
    kicker: "Date and schedule",
    description:
      "Calculate date spans, durations, and timeline utilities for daily planning.",
  },
  {
    slug: "utility",
    label: "Utility",
    kicker: "General utilities",
    description:
      "Use practical converters and helpers for everyday calculations.",
  },
  {
    slug: "engineering",
    label: "Engineering",
    kicker: "Technical calculations",
    description:
      "Estimate electrical, construction, and physical quantities with reusable tools.",
  },
  {
    slug: "embed",
    label: "Embed",
    kicker: "Site integration",
    description:
      "Generate snippets to embed calculator experiences on external pages.",
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createSummary(title: string): string {
  return `Run ${title} in The Stash with transparent assumptions and instant output.`;
}

function createHeroDescription(title: string): string {
  return `Use ${title} in The Stash to evaluate scenarios quickly in a clean, branded workflow.`;
}

function dedupeByTitle(entries: RawCalculator[]): RawCalculator[] {
  const seen = new Set<string>();
  const deduped: RawCalculator[] = [];

  for (const entry of entries) {
    const key = entry.title.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

const FINANCE_ENTRIES: RawCalculator[] = [
  { title: "Mortgage Calculator", category: "finance", engine: "mortgage", featured: true },
  { title: "Loan Calculator", category: "finance", engine: "loan", featured: true },
  { title: "Auto Loan Calculator", category: "finance", engine: "loan" },
  { title: "Interest Calculator", category: "finance", engine: "growth", featured: true },
  { title: "Payment Calculator", category: "finance", engine: "loan" },
  { title: "Retirement Calculator", category: "finance", engine: "growth" },
  { title: "Amortization Calculator", category: "finance", engine: "loan" },
  { title: "Investment Calculator", category: "finance", engine: "growth" },
  { title: "Currency Calculator", category: "finance", engine: "currency" },
  { title: "Inflation Calculator", category: "finance", engine: "inflation" },
  { title: "Finance Calculator", category: "finance", engine: "financial-metrics" },
  { title: "Mortgage Payoff Calculator", category: "finance", engine: "debt" },
  { title: "Income Tax Calculator", category: "finance", engine: "tax" },
  { title: "Compound Interest Calculator", category: "finance", engine: "growth" },
  { title: "Salary Calculator", category: "finance", engine: "tax" },
  { title: "401K Calculator", category: "finance", engine: "growth" },
  { title: "Interest Rate Calculator", category: "finance", engine: "financial-metrics" },
  { title: "Sales Tax Calculator", category: "finance", engine: "tax" },
  { title: "House Affordability Calculator", category: "finance", engine: "affordability" },
  { title: "Savings Calculator", category: "finance", engine: "growth" },
  { title: "Rent Calculator", category: "finance", engine: "affordability" },
  { title: "Marriage Tax Calculator", category: "finance", engine: "tax" },
  { title: "Estate Tax Calculator", category: "finance", engine: "tax" },
  { title: "Pension Calculator", category: "finance", engine: "growth" },
  { title: "Social Security Calculator", category: "finance", engine: "growth" },
  { title: "Annuity Calculator", category: "finance", engine: "growth" },
  { title: "Annuity Payout Calculator", category: "finance", engine: "growth" },
  { title: "Credit Card Calculator", category: "finance", engine: "debt" },
  { title: "Credit Cards Payoff Calculator", category: "finance", engine: "debt" },
  { title: "Debt Payoff Calculator", category: "finance", engine: "debt" },
  { title: "Debt Consolidation Calculator", category: "finance", engine: "debt" },
  { title: "Repayment Calculator", category: "finance", engine: "debt" },
  { title: "Student Loan Calculator", category: "finance", engine: "loan" },
  { title: "College Cost Calculator", category: "finance", engine: "growth" },
  { title: "Simple Interest Calculator", category: "finance", engine: "growth" },
  { title: "CD Calculator", category: "finance", engine: "growth" },
  { title: "Bond Calculator", category: "finance", engine: "growth" },
  { title: "Mutual Fund Calculator", category: "finance", engine: "growth" },
  { title: "Roth IRA Calculator", category: "finance", engine: "growth" },
  { title: "IRA Calculator", category: "finance", engine: "growth" },
  { title: "RMD Calculator", category: "finance", engine: "growth" },
  { title: "VAT Calculator", category: "finance", engine: "tax" },
  { title: "Cash Back or Low Interest Calculator", category: "finance", engine: "financial-metrics" },
  { title: "Auto Lease Calculator", category: "finance", engine: "loan" },
  { title: "Depreciation Calculator", category: "finance", engine: "growth" },
  { title: "Average Return Calculator", category: "finance", engine: "growth" },
  { title: "Margin Calculator", category: "finance", engine: "percentage" },
  { title: "Discount Calculator", category: "finance", engine: "percentage" },
  { title: "Business Loan Calculator", category: "finance", engine: "loan" },
  { title: "Debt-to-Income Ratio Calculator", category: "finance", engine: "debt" },
  { title: "Real Estate Calculator", category: "finance", engine: "affordability" },
  { title: "Take-Home-Paycheck Calculator", category: "finance", engine: "tax" },
  { title: "Personal Loan Calculator", category: "finance", engine: "loan" },
  { title: "Boat Loan Calculator", category: "finance", engine: "loan" },
  { title: "Lease Calculator", category: "finance", engine: "loan" },
  { title: "Refinance Calculator", category: "finance", engine: "mortgage" },
  { title: "Budget Calculator", category: "finance", engine: "debt" },
  { title: "Rental Property Calculator", category: "finance", engine: "growth" },
  { title: "IRR Calculator", category: "finance", engine: "financial-metrics" },
  { title: "ROI Calculator", category: "finance", engine: "financial-metrics" },
  { title: "APR Calculator", category: "finance", engine: "financial-metrics" },
  { title: "FHA Loan Calculator", category: "finance", engine: "mortgage" },
  { title: "VA Mortgage Calculator", category: "finance", engine: "mortgage" },
  { title: "Home Equity Loan Calculator", category: "finance", engine: "mortgage" },
  { title: "HELOC Calculator", category: "finance", engine: "mortgage" },
  { title: "Down Payment Calculator", category: "finance", engine: "mortgage" },
  { title: "Rent vs. Buy Calculator", category: "finance", engine: "affordability" },
  { title: "Payback Period Calculator", category: "finance", engine: "financial-metrics" },
  { title: "Present Value Calculator", category: "finance", engine: "financial-metrics" },
  { title: "Future Value Calculator", category: "finance", engine: "financial-metrics" },
  { title: "Commission Calculator", category: "finance", engine: "percentage" },
  { title: "Mortgage Calculator UK", category: "finance", engine: "mortgage" },
  { title: "Canadian Mortgage Calculator", category: "finance", engine: "mortgage" },
  { title: "Mortgage Amortization Calculator", category: "finance", engine: "mortgage" },
  { title: "Percent Off Calculator", category: "finance", engine: "percentage" },
];

const HEALTH_ENTRIES: RawCalculator[] = [
  { title: "BMI Calculator", category: "health", engine: "bmi", featured: true, referenceUrl: "https://www.calculator.net/bmi-calculator.html" },
  { title: "Calorie Calculator", category: "health", engine: "calorie", featured: true, referenceUrl: "https://www.calculator.net/calorie-calculator.html" },
  { title: "Body Fat Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/body-fat-calculator.html" },
  { title: "BMR Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/bmr-calculator.html" },
  { title: "Macro Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/macro-calculator.html" },
  { title: "Ideal Weight Calculator", category: "health", engine: "bmi", referenceUrl: "https://www.calculator.net/ideal-weight-calculator.html" },
  { title: "Pregnancy Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/pregnancy-calculator.html" },
  { title: "Pregnancy Weight Gain Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/pregnancy-weight-gain-calculator.html" },
  { title: "Pregnancy Conception Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/pregnancy-conception-calculator.html" },
  { title: "Due Date Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/due-date-calculator.html" },
  { title: "Pace Calculator", category: "health", engine: "pace", referenceUrl: "https://www.calculator.net/pace-calculator.html" },
  { title: "Army Body Fat Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/army-body-fat-calculator.html" },
  { title: "Carbohydrate Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/carbohydrate-calculator.html" },
  { title: "Lean Body Mass Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/lean-body-mass-calculator.html" },
  { title: "Healthy Weight Calculator", category: "health", engine: "bmi", referenceUrl: "https://www.calculator.net/healthy-weight-calculator.html" },
  { title: "Calories Burned Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/calories-burned-calculator.html" },
  { title: "One Rep Max Calculator", category: "health", engine: "pace", referenceUrl: "https://www.calculator.net/one-rep-max-calculator.html" },
  { title: "Target Heart Rate Calculator", category: "health", engine: "pace", referenceUrl: "https://www.calculator.net/target-heart-rate-calculator.html" },
  { title: "Protein Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/protein-calculator.html" },
  { title: "Fat Intake Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/fat-intake-calculator.html" },
  { title: "TDEE Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/tdee-calculator.html" },
  { title: "Ovulation Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/ovulation-calculator.html" },
  { title: "Conception Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/conception-calculator.html" },
  { title: "Period Calculator", category: "health", engine: "pregnancy", referenceUrl: "https://www.calculator.net/period-calculator.html" },
  { title: "GFR Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/gfr-calculator.html" },
  { title: "Body Type Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/body-type-calculator.html" },
  { title: "Body Surface Area Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/body-surface-area-calculator.html" },
  { title: "BAC Calculator", category: "health", engine: "body-fat", referenceUrl: "https://www.calculator.net/bac-calculator.html" },
  { title: "Anorexic BMI Calculator", category: "health", engine: "bmi", referenceUrl: "https://www.calculator.net/anorexic-bmi-calculator.html" },
  { title: "Weight Watcher Points Calculator", category: "health", engine: "calorie", referenceUrl: "https://www.calculator.net/weight-watchers-points-calculator.html" },
  { title: "Overweight Calculator", category: "health", engine: "bmi", referenceUrl: "https://www.calculator.net/overweight-calculator.html" },
];

const MATH_ENTRIES: RawCalculator[] = [
  { title: "Scientific Calculator", category: "math", engine: "scientific", featured: true, referenceUrl: "https://www.calculator.net/scientific-calculator.html" },
  { title: "Fraction Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/fraction-calculator.html" },
  { title: "Percentage Calculator", category: "math", engine: "percentage", featured: true, referenceUrl: "https://www.calculator.net/percent-calculator.html" },
  { title: "Triangle Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/triangle-calculator.html" },
  { title: "Volume Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/volume-calculator.html" },
  { title: "Standard Deviation Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/standard-deviation-calculator.html" },
  { title: "Random Number Generator", category: "math", engine: "random", referenceUrl: "https://www.calculator.net/random-number-generator.html" },
  { title: "Number Sequence Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/number-sequence-calculator.html" },
  { title: "Percent Error Calculator", category: "math", engine: "percentage", referenceUrl: "https://www.calculator.net/percent-error-calculator.html" },
  { title: "Exponent Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/exponent-calculator.html" },
  { title: "Binary Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/binary-calculator.html" },
  { title: "Hex Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/hex-calculator.html" },
  { title: "Half-Life Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/half-life-calculator.html" },
  { title: "Quadratic Formula Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/quadratic-formula-calculator.html" },
  { title: "Slope Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/slope-calculator.html" },
  { title: "Log Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/log-calculator.html" },
  { title: "Area Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/area-calculator.html" },
  { title: "Sample Size Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/sample-size-calculator.html" },
  { title: "Probability Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/probability-calculator.html" },
  { title: "Statistics Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/statistics-calculator.html" },
  { title: "Mean, Median, Mode, Range Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/mean-median-mode-range-calculator.html" },
  { title: "Permutation and Combination Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/permutation-and-combination-calculator.html" },
  { title: "Z-score Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/z-score-calculator.html" },
  { title: "Confidence Interval Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/confidence-interval-calculator.html" },
  { title: "Ratio Calculator", category: "math", engine: "percentage", referenceUrl: "https://www.calculator.net/ratio-calculator.html" },
  { title: "Distance Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/distance-calculator.html" },
  { title: "Circle Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/circle-calculator.html" },
  { title: "Surface Area Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/surface-area-calculator.html" },
  { title: "Pythagorean Theorem Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/pythagorean-theorem-calculator.html" },
  { title: "Right Triangle Calculator", category: "math", engine: "geometry", referenceUrl: "https://www.calculator.net/right-triangle-calculator.html" },
  { title: "Root Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/root-calculator.html" },
  { title: "Least Common Multiple Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/lcm-calculator.html" },
  { title: "Greatest Common Factor Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/gcf-calculator.html" },
  { title: "Factor Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/factor-calculator.html" },
  { title: "Rounding Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/rounding-calculator.html" },
  { title: "Matrix Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/matrix-calculator.html" },
  { title: "Scientific Notation Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/scientific-notation-calculator.html" },
  { title: "Big Number Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/big-number-calculator.html" },
  { title: "Prime Factorization Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/prime-factorization-calculator.html" },
  { title: "Common Factor Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/common-factor-calculator.html" },
  { title: "Basic Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/basic-calculator.html" },
  { title: "Long Division Calculator", category: "math", engine: "scientific", referenceUrl: "https://www.calculator.net/long-division-calculator.html" },
  { title: "Average Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/average-calculator.html" },
  { title: "P-value Calculator", category: "math", engine: "statistics", referenceUrl: "https://www.calculator.net/p-value-calculator.html" },
];

const TIME_AND_UTILITY_ENTRIES: RawCalculator[] = [
  { title: "Age Calculator", category: "time", engine: "age", featured: true, referenceUrl: "https://www.calculator.net/age-calculator.html" },
  { title: "Date Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/date-calculator.html" },
  { title: "Time Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/time-calculator.html" },
  { title: "Hours Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/hours-calculator.html" },
  { title: "GPA Calculator", category: "utility", engine: "grade", referenceUrl: "https://www.calculator.net/gpa-calculator.html" },
  { title: "Grade Calculator", category: "utility", engine: "grade", referenceUrl: "https://www.calculator.net/grade-calculator.html" },
  { title: "Height Calculator", category: "utility", engine: "conversion", referenceUrl: "https://www.calculator.net/height-calculator.html" },
  { title: "Concrete Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/concrete-calculator.html" },
  { title: "IP Subnet Calculator", category: "utility", engine: "generic", referenceUrl: "https://www.calculator.net/ip-subnet-calculator.html" },
  { title: "Bra Size Calculator", category: "utility", engine: "generic", referenceUrl: "https://www.calculator.net/bra-size-calculator.html" },
  { title: "Password Generator", category: "utility", engine: "password", referenceUrl: "https://www.calculator.net/password-generator.html" },
  { title: "Dice Roller", category: "utility", engine: "random", referenceUrl: "https://www.calculator.net/dice-roller.html" },
  { title: "Conversion Calculator", category: "utility", engine: "conversion", referenceUrl: "https://www.calculator.net/conversion-calculator.html" },
  { title: "Fuel Cost Calculator", category: "utility", engine: "fuel", referenceUrl: "https://www.calculator.net/fuel-cost-calculator.html" },
  { title: "Voltage Drop Calculator", category: "engineering", engine: "ohm", referenceUrl: "https://www.calculator.net/voltage-drop-calculator.html" },
  { title: "BTU Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/btu-calculator.html" },
  { title: "Square Footage Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/square-footage-calculator.html" },
  { title: "Time Card Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/time-card-calculator.html" },
  { title: "Time Zone Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/time-zone-calculator.html" },
  { title: "Love Calculator", category: "utility", engine: "random", referenceUrl: "https://www.calculator.net/love-calculator.html" },
  { title: "GDP Calculator", category: "utility", engine: "financial-metrics", referenceUrl: "https://www.calculator.net/gdp-calculator.html" },
  { title: "Gas Mileage Calculator", category: "utility", engine: "fuel", referenceUrl: "https://www.calculator.net/gas-mileage-calculator.html" },
  { title: "Horsepower Calculator", category: "engineering", engine: "speed", referenceUrl: "https://www.calculator.net/horsepower-calculator.html" },
  { title: "Engine Horsepower Calculator", category: "engineering", engine: "speed", referenceUrl: "https://www.calculator.net/engine-horsepower-calculator.html" },
  { title: "Stair Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/stair-calculator.html" },
  { title: "Resistor Calculator", category: "engineering", engine: "ohm", referenceUrl: "https://www.calculator.net/resistor-calculator.html" },
  { title: "Ohms Law Calculator", category: "engineering", engine: "ohm", referenceUrl: "https://www.calculator.net/ohms-law-calculator.html" },
  { title: "Electricity Calculator", category: "engineering", engine: "ohm", referenceUrl: "https://www.calculator.net/electricity-calculator.html" },
  { title: "Shoe Size Conversion", category: "utility", engine: "conversion", referenceUrl: "https://www.calculator.net/shoe-size-conversion.html" },
  { title: "Tip Calculator", category: "utility", engine: "percentage", referenceUrl: "https://www.calculator.net/tip-calculator.html" },
  { title: "Mileage Calculator", category: "utility", engine: "fuel", referenceUrl: "https://www.calculator.net/mileage-calculator.html" },
  { title: "Density Calculator", category: "engineering", engine: "conversion", referenceUrl: "https://www.calculator.net/density-calculator.html" },
  { title: "Mass Calculator", category: "engineering", engine: "conversion", referenceUrl: "https://www.calculator.net/mass-calculator.html" },
  { title: "Weight Calculator", category: "utility", engine: "conversion", referenceUrl: "https://www.calculator.net/weight-calculator.html" },
  { title: "Speed Calculator", category: "utility", engine: "speed", referenceUrl: "https://www.calculator.net/speed-calculator.html" },
  { title: "Molarity Calculator", category: "engineering", engine: "conversion", referenceUrl: "https://www.calculator.net/molarity-calculator.html" },
  { title: "Molecular Weight Calculator", category: "engineering", engine: "conversion", referenceUrl: "https://www.calculator.net/molecular-weight-calculator.html" },
  { title: "Roman Numeral Converter", category: "utility", engine: "conversion", referenceUrl: "https://www.calculator.net/roman-numeral-converter.html" },
  { title: "Golf Handicap Calculator", category: "utility", engine: "generic", referenceUrl: "https://www.calculator.net/golf-handicap-calculator.html" },
  { title: "Sleep Calculator", category: "utility", engine: "time", referenceUrl: "https://www.calculator.net/sleep-calculator.html" },
  { title: "Tire Size Calculator", category: "engineering", engine: "conversion", referenceUrl: "https://www.calculator.net/tire-size-calculator.html" },
  { title: "Roofing Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/roofing-calculator.html" },
  { title: "Tile Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/tile-calculator.html" },
  { title: "Mulch Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/mulch-calculator.html" },
  { title: "Gravel Calculator", category: "engineering", engine: "construction", referenceUrl: "https://www.calculator.net/gravel-calculator.html" },
  { title: "Wind Chill Calculator", category: "utility", engine: "weather", referenceUrl: "https://www.calculator.net/wind-chill-calculator.html" },
  { title: "Heat Index Calculator", category: "utility", engine: "weather", referenceUrl: "https://www.calculator.net/heat-index-calculator.html" },
  { title: "Dew Point Calculator", category: "utility", engine: "weather", referenceUrl: "https://www.calculator.net/dew-point-calculator.html" },
  { title: "Bandwidth Calculator", category: "utility", engine: "conversion", referenceUrl: "https://www.calculator.net/bandwidth-calculator.html" },
  { title: "Time Duration Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/time-duration-calculator.html" },
  { title: "Day Counter", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/day-counter.html" },
  { title: "Day of the Week Calculator", category: "time", engine: "time", referenceUrl: "https://www.calculator.net/day-of-the-week-calculator.html" },
];

const EMBED_ENTRIES: RawCalculator[] = [
  { title: "Mortgage Calculator for Your Site", category: "embed", engine: "embed", referenceUrl: "https://www.calculator.net/mortgage-calculator-for-your-site.html" },
  { title: "Math Calculator for Your Site", category: "embed", engine: "embed", referenceUrl: "https://www.calculator.net/math-calculator-for-your-site.html" },
  { title: "Scientific Calculator for Your Site", category: "embed", engine: "embed", referenceUrl: "https://www.calculator.net/scientific-calculator-for-your-site.html" },
  { title: "Love Calculator for Your Site", category: "embed", engine: "embed", referenceUrl: "https://www.calculator.net/love-calculator-for-your-site.html" },
  { title: "Concrete Calculator for Your Site", category: "embed", engine: "embed", referenceUrl: "https://www.calculator.net/concrete-calculator-for-your-site.html" },
];

const FEATURED_TITLES = new Set([
  "Mortgage Calculator",
  "Loan Calculator",
  "Interest Calculator",
  "BMI Calculator",
  "Calorie Calculator",
  "Percentage Calculator",
  "Age Calculator",
  "Retirement Calculator",
  "Investment Calculator",
  "Scientific Calculator",
]);

const RAW_CALCULATORS = dedupeByTitle([
  ...FINANCE_ENTRIES,
  ...HEALTH_ENTRIES,
  ...MATH_ENTRIES,
  ...TIME_AND_UTILITY_ENTRIES,
  ...EMBED_ENTRIES,
]);

function toCalculatorDefinition(raw: RawCalculator): CalculatorDefinition {
  const featured = raw.featured ?? FEATURED_TITLES.has(raw.title);

  return {
    slug: slugify(raw.title),
    title: raw.title,
    category: raw.category,
    engine: raw.engine,
    summary: createSummary(raw.title),
    heroDescription: createHeroDescription(raw.title),
    actionLabel: "Calculate",
    featured,
    referenceUrl: raw.referenceUrl,
  };
}

const ALL_CALCULATORS = RAW_CALCULATORS.map(toCalculatorDefinition);
const CALCULATORS_BY_SLUG = new Map(ALL_CALCULATORS.map((entry) => [entry.slug, entry]));

function getCategoryBySlug(slug: CalculatorCategorySlug): CalculatorCategoryDefinition {
  const category = CALCULATOR_CATEGORIES.find((entry) => entry.slug === slug);
  if (!category) {
    throw new Error(`Unknown calculator category: ${slug}`);
  }
  return category;
}

export function getAllCalculators(): CalculatorDefinition[] {
  return [...ALL_CALCULATORS];
}

export function getAllCalculatorSlugs(): string[] {
  return ALL_CALCULATORS.map((entry) => entry.slug);
}

export function getCalculatorBySlug(slug: string): CalculatorDefinition | null {
  return CALCULATORS_BY_SLUG.get(slug) ?? null;
}

export function getCalculatorCategory(
  category: CalculatorCategorySlug
): CalculatorCategoryDefinition {
  return getCategoryBySlug(category);
}

export function getCalculatorsByCategory(
  category: CalculatorCategorySlug
): CalculatorDefinition[] {
  return ALL_CALCULATORS.filter((entry) => entry.category === category);
}

export function getRelatedCalculators(
  slug: string,
  limit: number = 6
): CalculatorDefinition[] {
  const calculator = getCalculatorBySlug(slug);
  if (!calculator) return [];

  const inCategory = ALL_CALCULATORS.filter(
    (entry) => entry.slug !== slug && entry.category === calculator.category
  );
  if (inCategory.length >= limit) {
    return inCategory.slice(0, limit);
  }

  const extras = ALL_CALCULATORS.filter(
    (entry) => entry.slug !== slug && entry.category !== calculator.category
  );
  return [...inCategory, ...extras].slice(0, limit);
}

export function getFeaturedCalculators(limit: number = 6): CalculatorDefinition[] {
  return ALL_CALCULATORS.filter((entry) => entry.featured).slice(0, limit);
}

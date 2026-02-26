"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalculatorDefinition } from "@/lib/calculators-catalog";

type CalculatorWorkbenchProps = {
  calculator: CalculatorDefinition;
};

type AmortizationRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTimeInput(date: Date): string {
  const day = formatDateInput(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}T${hours}:${minutes}`;
}

function parseClockMinutes(value: string): number | null {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatClockMinutes(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDurationFromMinutes(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(totalMinutes));
  const days = Math.floor(absolute / 1440);
  const hours = Math.floor((absolute % 1440) / 60);
  const minutes = absolute % 60;
  if (days > 0) {
    return `${sign}${days}d ${hours}h ${minutes}m`;
  }
  return `${sign}${hours}h ${minutes}m`;
}

function countBusinessDays(start: Date, end: Date): number {
  const step = start <= end ? 1 : -1;
  const cursor = new Date(start);
  let businessDays = 0;
  while ((step > 0 && cursor <= end) || (step < 0 && cursor >= end)) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) businessDays += step;
    cursor.setDate(cursor.getDate() + step);
  }
  return businessDays;
}

const TIME_ZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const timestamp = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return timestamp - date.getTime();
}

function zonedDateTimeToUtc(dateTime: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(dateTime);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  const corrected = guess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(corrected), timeZone);
  return new Date(guess - secondOffset);
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function toRoman(value: number): string {
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = Math.max(1, Math.round(value));
  let output = "";
  for (const [num, symbol] of numerals) {
    while (remaining >= num) {
      output += symbol;
      remaining -= num;
    }
  }
  return output;
}

const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.00794,
  He: 4.002602,
  Li: 6.941,
  Be: 9.012182,
  B: 10.811,
  C: 12.0107,
  N: 14.0067,
  O: 15.9994,
  F: 18.9984032,
  Na: 22.98976928,
  Mg: 24.305,
  Al: 26.9815385,
  Si: 28.0855,
  P: 30.973762,
  S: 32.065,
  Cl: 35.453,
  K: 39.0983,
  Ca: 40.078,
  Cr: 51.9961,
  Mn: 54.938045,
  Fe: 55.845,
  Co: 58.933195,
  Ni: 58.6934,
  Cu: 63.546,
  Zn: 65.38,
  Br: 79.904,
  Ag: 107.8682,
  I: 126.90447,
  Ba: 137.327,
  Au: 196.966569,
  Hg: 200.59,
  Pb: 207.2,
};

function parseChemicalFormula(
  inputFormula: string
): { counts: Record<string, number>; unknown: string[] } | null {
  const formula = inputFormula.replace(/\s+/g, "");
  if (!formula) return null;
  let index = 0;

  const parseNumberToken = (): number => {
    let start = index;
    while (index < formula.length && /\d/.test(formula[index])) {
      index += 1;
    }
    if (start === index) return 1;
    return Number(formula.slice(start, index));
  };

  const parseGroup = (): Record<string, number> | null => {
    const result: Record<string, number> = {};
    while (index < formula.length) {
      const char = formula[index];
      if (char === "(") {
        index += 1;
        const inner = parseGroup();
        if (!inner || formula[index] !== ")") return null;
        index += 1;
        const multiplier = parseNumberToken();
        for (const [symbol, count] of Object.entries(inner)) {
          result[symbol] = (result[symbol] ?? 0) + count * multiplier;
        }
        continue;
      }
      if (char === ")") {
        break;
      }
      if (!/[A-Z]/.test(char)) return null;
      let symbol = char;
      index += 1;
      while (index < formula.length && /[a-z]/.test(formula[index])) {
        symbol += formula[index];
        index += 1;
      }
      const multiplier = parseNumberToken();
      result[symbol] = (result[symbol] ?? 0) + multiplier;
    }
    return result;
  };

  const counts = parseGroup();
  if (!counts || index !== formula.length) return null;
  const unknown = Object.keys(counts).filter((symbol) => !ATOMIC_WEIGHTS[symbol]);
  return { counts, unknown };
}

function ipv4ToInt(ip: string): number | null {
  const segments = ip.split(".");
  if (segments.length !== 4) return null;
  const octets = segments.map((segment) => Number(segment));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return (
    ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  );
}

function intToIpv4(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join(".");
}

function monthlyPayment(loanAmount: number, annualRate: number, months: number): number {
  if (loanAmount <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return loanAmount / months;
  const growth = (1 + monthlyRate) ** months;
  return (loanAmount * monthlyRate * growth) / (growth - 1);
}

function buildAmortizationRows(
  loanAmount: number,
  annualRate: number,
  months: number,
  limit: number = 12
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  if (loanAmount <= 0 || months <= 0) return rows;

  const payment = monthlyPayment(loanAmount, annualRate, months);
  const monthlyRate = annualRate / 100 / 12;
  let balance = loanAmount;

  for (let month = 1; month <= months && month <= limit; month += 1) {
    const interest = monthlyRate > 0 ? balance * monthlyRate : 0;
    let principal = payment - interest;
    let appliedPayment = payment;

    if (month === months || principal > balance) {
      principal = balance;
      appliedPayment = principal + interest;
    }

    balance = Math.max(0, balance - principal);

    rows.push({
      month,
      payment: appliedPayment,
      principal,
      interest,
      balance,
    });
  }

  return rows;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/80 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 text-sm leading-6 text-foreground">{children}</div>
    </section>
  );
}

function BmiCalculatorPanel() {
  const [unitSystem, setUnitSystem] = useState<"metric" | "us">("metric");
  const [weightKg, setWeightKg] = useState("72");
  const [heightCm, setHeightCm] = useState("175");
  const [weightLb, setWeightLb] = useState("160");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");

  const result = useMemo(() => {
    const categoryForBmi = (bmi: number) => {
      if (bmi < 18.5) return "Underweight";
      if (bmi < 25) return "Normal weight";
      if (bmi < 30) return "Overweight";
      return "Obesity";
    };

    if (unitSystem === "metric") {
      const weight = parseNumber(weightKg);
      const height = parseNumber(heightCm);
      if (weight <= 0 || height <= 0) return null;

      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      const healthyMin = 18.5 * heightM * heightM;
      const healthyMax = 24.9 * heightM * heightM;

      return {
        bmi,
        category: categoryForBmi(bmi),
        healthyRangeLabel: `${formatNumber(healthyMin, 1)} kg - ${formatNumber(healthyMax, 1)} kg`,
      };
    }

    const weight = parseNumber(weightLb);
    const feet = parseNumber(heightFt);
    const inches = parseNumber(heightIn);
    const totalInches = feet * 12 + inches;
    if (weight <= 0 || totalInches <= 0) return null;

    const bmi = (703 * weight) / (totalInches * totalInches);
    const heightM = totalInches * 0.0254;
    const healthyMinKg = 18.5 * heightM * heightM;
    const healthyMaxKg = 24.9 * heightM * heightM;
    const healthyMinLb = healthyMinKg * 2.20462;
    const healthyMaxLb = healthyMaxKg * 2.20462;

    return {
      bmi,
      category: categoryForBmi(bmi),
      healthyRangeLabel: `${formatNumber(healthyMinLb, 1)} lb - ${formatNumber(healthyMaxLb, 1)} lb`,
    };
  }, [heightCm, heightFt, heightIn, unitSystem, weightKg, weightLb]);

  const resetMetric = () => {
    setUnitSystem("metric");
    setWeightKg("72");
    setHeightCm("175");
  };

  const resetUs = () => {
    setUnitSystem("us");
    setWeightLb("160");
    setHeightFt("5");
    setHeightIn("10");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Unit system">
            <Select
              value={unitSystem}
              onValueChange={(value) => setUnitSystem(value as "metric" | "us")}
            >
              <SelectTrigger className="border-border/80 bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                <SelectItem value="us">US (lb, ft, in)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {unitSystem === "metric" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Weight (kg)">
              <Input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Height (cm)">
              <Input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Weight (lb)">
              <Input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={weightLb}
                onChange={(event) => setWeightLb(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Height (ft)">
              <Input
                inputMode="decimal"
                type="number"
                min="0"
                step="1"
                value={heightFt}
                onChange={(event) => setHeightFt(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Height (in)">
              <Input
                inputMode="decimal"
                type="number"
                min="0"
                step="0.5"
                value={heightIn}
                onChange={(event) => setHeightIn(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={unitSystem === "metric" ? resetMetric : resetUs}
            className="h-9"
          >
            Reset
          </Button>
        </div>
      </section>

      <ResultCard title="Result">
        {!result && <p>Enter valid weight and height values to calculate BMI.</p>}
        {result && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">
              BMI {formatNumber(result.bmi, 1)}
            </p>
            <p>
              Category: <span className="font-semibold">{result.category}</span>
            </p>
            <p>
              Healthy range for your height:{" "}
              <span className="font-semibold">{result.healthyRangeLabel}</span>
            </p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function MortgageCalculatorPanel() {
  const [homePrice, setHomePrice] = useState("450000");
  const [downPayment, setDownPayment] = useState("90000");
  const [interestRate, setInterestRate] = useState("6.5");
  const [termYears, setTermYears] = useState("30");
  const [propertyTaxYear, setPropertyTaxYear] = useState("4200");
  const [insuranceYear, setInsuranceYear] = useState("1200");
  const [hoaMonth, setHoaMonth] = useState("0");

  const result = useMemo(() => {
    const home = parseNumber(homePrice);
    const down = parseNumber(downPayment);
    const rate = parseNumber(interestRate);
    const years = parseNumber(termYears);
    const tax = parseNumber(propertyTaxYear);
    const insurance = parseNumber(insuranceYear);
    const hoa = parseNumber(hoaMonth);

    if (home <= 0 || years <= 0) return null;
    const loan = Math.max(0, home - Math.max(0, down));
    const months = Math.max(1, Math.round(years * 12));
    const monthlyPI = monthlyPayment(loan, rate, months);
    const monthlyTax = Math.max(0, tax) / 12;
    const monthlyInsurance = Math.max(0, insurance) / 12;
    const monthlyHoa = Math.max(0, hoa);
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyHoa;
    const totalPrincipalAndInterest = monthlyPI * months;
    const totalInterest = totalPrincipalAndInterest - loan;
    const rows = buildAmortizationRows(loan, rate, months, 12);

    return {
      loan,
      monthlyPI,
      monthlyTax,
      monthlyInsurance,
      monthlyHoa,
      totalMonthly,
      totalInterest,
      totalPrincipalAndInterest,
      months,
      rows,
    };
  }, [
    downPayment,
    hoaMonth,
    homePrice,
    insuranceYear,
    interestRate,
    propertyTaxYear,
    termYears,
  ]);

  const reset = () => {
    setHomePrice("450000");
    setDownPayment("90000");
    setInterestRate("6.5");
    setTermYears("30");
    setPropertyTaxYear("4200");
    setInsuranceYear("1200");
    setHoaMonth("0");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Home price">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              value={homePrice}
              onChange={(event) => setHomePrice(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Down payment">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              value={downPayment}
              onChange={(event) => setDownPayment(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Interest rate (%)">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={interestRate}
              onChange={(event) => setInterestRate(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Loan term (years)">
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={termYears}
              onChange={(event) => setTermYears(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Property tax (yearly)">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              value={propertyTaxYear}
              onChange={(event) => setPropertyTaxYear(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Home insurance (yearly)">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              value={insuranceYear}
              onChange={(event) => setInsuranceYear(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
        </div>
        <div className="mt-3 max-w-xs">
          <Field label="HOA (monthly)">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              value={hoaMonth}
              onChange={(event) => setHoaMonth(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9">
            Reset
          </Button>
        </div>
      </section>

      <ResultCard title="Payment summary">
        {!result && <p>Enter valid values to calculate mortgage payment.</p>}
        {result && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(result.totalMonthly)} / month
            </p>
            <p>
              Principal + interest:{" "}
              <span className="font-semibold">{formatCurrency(result.monthlyPI)}</span>
            </p>
            <p>
              Taxes: <span className="font-semibold">{formatCurrency(result.monthlyTax)}</span>
            </p>
            <p>
              Insurance:{" "}
              <span className="font-semibold">{formatCurrency(result.monthlyInsurance)}</span>
            </p>
            <p>
              HOA: <span className="font-semibold">{formatCurrency(result.monthlyHoa)}</span>
            </p>
            <p>
              Loan amount: <span className="font-semibold">{formatCurrency(result.loan)}</span>
            </p>
            <p>
              Total interest ({result.months} months):{" "}
              <span className="font-semibold">{formatCurrency(result.totalInterest)}</span>
            </p>
          </div>
        )}
      </ResultCard>

      {result && result.rows.length > 0 && (
        <section className="rounded-xl border border-border/80 bg-background/70 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            First 12 amortization rows
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border/80">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-[0.09em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Month</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Principal</th>
                  <th className="px-3 py-2 font-medium">Interest</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.month} className="border-t border-border/70">
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2">{formatCurrency(row.payment)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.principal)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.interest)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function LoanCalculatorPanel() {
  const [loanAmount, setLoanAmount] = useState("20000");
  const [interestRate, setInterestRate] = useState("8");
  const [termMonths, setTermMonths] = useState("60");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    const amount = parseNumber(loanAmount);
    const rate = parseNumber(interestRate);
    const months = Math.max(0, Math.round(parseNumber(termMonths)));
    const start = new Date(`${startDate}T00:00:00`);
    if (amount <= 0 || months <= 0 || Number.isNaN(start.getTime())) return null;

    const payment = monthlyPayment(amount, rate, months);
    const totalPayment = payment * months;
    const totalInterest = totalPayment - amount;
    const payoff = new Date(start);
    payoff.setMonth(payoff.getMonth() + months);
    const rows = buildAmortizationRows(amount, rate, months, 12);

    return {
      payment,
      totalPayment,
      totalInterest,
      payoffDate: payoff.toISOString().slice(0, 10),
      rows,
    };
  }, [interestRate, loanAmount, startDate, termMonths]);

  const reset = () => {
    setLoanAmount("20000");
    setInterestRate("8");
    setTermMonths("60");
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Loan amount">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Interest rate (%)">
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={interestRate}
              onChange={(event) => setInterestRate(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Term (months)">
            <Input
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={termMonths}
              onChange={(event) => setTermMonths(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9">
            Reset
          </Button>
        </div>
      </section>

      <ResultCard title="Loan summary">
        {!result && <p>Enter valid values to calculate your loan.</p>}
        {result && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(result.payment)} / month
            </p>
            <p>
              Total paid: <span className="font-semibold">{formatCurrency(result.totalPayment)}</span>
            </p>
            <p>
              Total interest:{" "}
              <span className="font-semibold">{formatCurrency(result.totalInterest)}</span>
            </p>
            <p>
              Estimated payoff date:{" "}
              <span className="font-semibold">{result.payoffDate}</span>
            </p>
          </div>
        )}
      </ResultCard>

      {result && result.rows.length > 0 && (
        <section className="rounded-xl border border-border/80 bg-background/70 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            First 12 payment rows
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border/80">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-[0.09em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Month</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Principal</th>
                  <th className="px-3 py-2 font-medium">Interest</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.month} className="border-t border-border/70">
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2">{formatCurrency(row.payment)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.principal)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.interest)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function InterestCalculatorPanel() {
  const [principal, setPrincipal] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("200");
  const [annualRate, setAnnualRate] = useState("7");
  const [years, setYears] = useState("10");

  const result = useMemo(() => {
    const initial = parseNumber(principal);
    const monthlyAdd = parseNumber(monthlyContribution);
    const rate = parseNumber(annualRate) / 100;
    const durationYears = parseNumber(years);
    if (initial < 0 || monthlyAdd < 0 || durationYears <= 0) return null;

    const months = Math.round(durationYears * 12);
    const monthlyRate = rate / 12;

    let balance = initial;
    let contributions = initial;
    let interestEarned = 0;

    const yearlySnapshots: Array<{ year: number; balance: number; interest: number }> = [];

    for (let month = 1; month <= months; month += 1) {
      const interest = balance * monthlyRate;
      interestEarned += interest;
      balance += interest + monthlyAdd;
      contributions += monthlyAdd;

      if (month % 12 === 0 || month === months) {
        yearlySnapshots.push({
          year: Math.ceil(month / 12),
          balance,
          interest: interestEarned,
        });
      }
    }

    return {
      finalBalance: balance,
      contributions,
      interestEarned,
      yearlySnapshots,
    };
  }, [annualRate, monthlyContribution, principal, years]);

  const reset = () => {
    setPrincipal("10000");
    setMonthlyContribution("200");
    setAnnualRate("7");
    setYears("10");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Initial principal">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Monthly contribution">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              value={monthlyContribution}
              onChange={(event) => setMonthlyContribution(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Annual interest rate (%)">
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={annualRate}
              onChange={(event) => setAnnualRate(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Duration (years)">
            <Input
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={years}
              onChange={(event) => setYears(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9">
            Reset
          </Button>
        </div>
      </section>

      <ResultCard title="Growth summary">
        {!result && <p>Enter valid values to calculate projected growth.</p>}
        {result && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(result.finalBalance)}
            </p>
            <p>
              Total contributions:{" "}
              <span className="font-semibold">{formatCurrency(result.contributions)}</span>
            </p>
            <p>
              Interest earned:{" "}
              <span className="font-semibold">{formatCurrency(result.interestEarned)}</span>
            </p>
          </div>
        )}
      </ResultCard>

      {result && result.yearlySnapshots.length > 0 && (
        <section className="rounded-xl border border-border/80 bg-background/70 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Yearly projection
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border/80">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-[0.09em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Year</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                  <th className="px-3 py-2 font-medium">Interest earned</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlySnapshots.map((entry) => (
                  <tr key={entry.year} className="border-t border-border/70">
                    <td className="px-3 py-2">{entry.year}</td>
                    <td className="px-3 py-2">{formatCurrency(entry.balance)}</td>
                    <td className="px-3 py-2">{formatCurrency(entry.interest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

type PercentageMode = "of" | "is" | "change";

function PercentageCalculatorPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isTip = title.includes("tip calculator");
  const isRatio = title.includes("ratio calculator");
  const isPercentError = title.includes("percent error");
  const isDiscount = title.includes("discount") || title.includes("percent off");
  const isMargin = title.includes("margin calculator");
  const isCommission = title.includes("commission");
  const [mode, setMode] = useState<PercentageMode>("of");
  const [a, setA] = useState("15");
  const [b, setB] = useState("120");
  const [tipBill, setTipBill] = useState("120");
  const [tipRate, setTipRate] = useState("18");
  const [splitCount, setSplitCount] = useState("2");
  const [ratioLeft, setRatioLeft] = useState("4");
  const [ratioRight, setRatioRight] = useState("5");
  const [ratioTarget, setRatioTarget] = useState("40");
  const [theoretical, setTheoretical] = useState("98");
  const [observed, setObserved] = useState("94");
  const [listPrice, setListPrice] = useState("199");
  const [salePrice, setSalePrice] = useState("149");
  const [revenue, setRevenue] = useState("1000");
  const [cost, setCost] = useState("650");
  const [commissionSales, setCommissionSales] = useState("12000");
  const [commissionRate, setCommissionRate] = useState("7.5");

  const result = useMemo(() => {
    if (isTip) {
      const bill = parseNumber(tipBill);
      const rate = parseNumber(tipRate);
      const people = Math.max(1, Math.round(parseNumber(splitCount)));
      if (bill <= 0 || rate < 0) return null;
      const tip = bill * (rate / 100);
      return {
        mode: "tip",
        tip,
        total: bill + tip,
        perPerson: (bill + tip) / people,
      } as const;
    }

    if (isRatio) {
      const left = parseNumber(ratioLeft);
      const right = parseNumber(ratioRight);
      const target = parseNumber(ratioTarget);
      if (left <= 0 || right <= 0 || target <= 0) return null;
      return {
        mode: "ratio",
        otherSide: (right / left) * target,
        simplified: `${formatNumber(left / right, 6)} : 1`,
      } as const;
    }

    if (isPercentError) {
      const expected = parseNumber(theoretical);
      const actual = parseNumber(observed);
      if (expected === 0) return null;
      const error = ((actual - expected) / expected) * 100;
      return {
        mode: "error",
        signedError: error,
        absoluteError: Math.abs(error),
      } as const;
    }

    if (isDiscount) {
      const original = parseNumber(listPrice);
      const sale = parseNumber(salePrice);
      if (original <= 0 || sale < 0 || sale > original) return null;
      const saved = original - sale;
      return {
        mode: "discount",
        saved,
        percentOff: (saved / original) * 100,
      } as const;
    }

    if (isMargin) {
      const sale = parseNumber(revenue);
      const expenses = parseNumber(cost);
      if (sale <= 0 || expenses < 0) return null;
      const profit = sale - expenses;
      return {
        mode: "margin",
        profit,
        marginPercent: (profit / sale) * 100,
        markupPercent: expenses > 0 ? (profit / expenses) * 100 : 0,
      } as const;
    }

    if (isCommission) {
      const sales = parseNumber(commissionSales);
      const rate = parseNumber(commissionRate);
      if (sales < 0 || rate < 0) return null;
      return {
        mode: "commission",
        commission: sales * (rate / 100),
      } as const;
    }

    const first = parseNumber(a);
    const second = parseNumber(b);

    if (mode === "of") {
      return {
        label: `${formatNumber(first)}% of ${formatNumber(second)}`,
        value: (first / 100) * second,
        equation: `(${first} / 100) × ${second}`,
      };
    }

    if (mode === "is") {
      if (second === 0) return null;
      return {
        label: `${formatNumber(first)} is what percent of ${formatNumber(second)}`,
        value: (first / second) * 100,
        equation: `(${first} ÷ ${second}) × 100`,
      };
    }

    if (first === 0) return null;
    return {
      label: `Percent change from ${formatNumber(first)} to ${formatNumber(second)}`,
      value: ((second - first) / first) * 100,
      equation: `((${second} - ${first}) ÷ ${first}) × 100`,
    } as const;
  }, [
    a,
    b,
    commissionRate,
    commissionSales,
    cost,
    isCommission,
    isDiscount,
    isMargin,
    isPercentError,
    isRatio,
    isTip,
    listPrice,
    mode,
    observed,
    ratioLeft,
    ratioRight,
    ratioTarget,
    revenue,
    salePrice,
    splitCount,
    theoretical,
    tipBill,
    tipRate,
  ]);

  const modeLabel = mode === "of" ? "Result" : "Percent";

  const reset = () => {
    setMode("of");
    setA("15");
    setB("120");
    setTipBill("120");
    setTipRate("18");
    setSplitCount("2");
    setRatioLeft("4");
    setRatioRight("5");
    setRatioTarget("40");
    setTheoretical("98");
    setObserved("94");
    setListPrice("199");
    setSalePrice("149");
    setRevenue("1000");
    setCost("650");
    setCommissionSales("12000");
    setCommissionRate("7.5");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isTip ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Bill amount">
              <Input value={tipBill} onChange={(event) => setTipBill(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Tip rate (%)">
              <Input value={tipRate} onChange={(event) => setTipRate(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Split people">
              <Input value={splitCount} onChange={(event) => setSplitCount(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isRatio ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Ratio left (A)">
              <Input value={ratioLeft} onChange={(event) => setRatioLeft(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Ratio right (B)">
              <Input value={ratioRight} onChange={(event) => setRatioRight(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Given A value">
              <Input value={ratioTarget} onChange={(event) => setRatioTarget(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isPercentError ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Theoretical value">
              <Input value={theoretical} onChange={(event) => setTheoretical(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Observed value">
              <Input value={observed} onChange={(event) => setObserved(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isDiscount ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Original price">
              <Input value={listPrice} onChange={(event) => setListPrice(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Sale price">
              <Input value={salePrice} onChange={(event) => setSalePrice(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isMargin ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Revenue">
              <Input value={revenue} onChange={(event) => setRevenue(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Cost">
              <Input value={cost} onChange={(event) => setCost(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isCommission ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sales amount">
              <Input value={commissionSales} onChange={(event) => setCommissionSales(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Commission rate (%)">
              <Input value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3">
            <Field label="Calculation mode">
              <Select value={mode} onValueChange={(value) => setMode(value as PercentageMode)}>
                <SelectTrigger className="border-border/80 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="of">What is X% of Y?</SelectItem>
                  <SelectItem value="is">X is what % of Y?</SelectItem>
                  <SelectItem value="change">Percent change (X to Y)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={mode === "change" ? "Original value (X)" : "X"}>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={a}
                  onChange={(event) => setA(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
              <Field label={mode === "change" ? "New value (Y)" : "Y"}>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={b}
                  onChange={(event) => setB(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9">
            Reset
          </Button>
        </div>
      </section>

      <ResultCard title="Output">
        {!result && <p>This mode requires valid numeric values.</p>}
        {result && "mode" in result && result.mode === "tip" && (
          <div className="space-y-2">
            <p>Tip: <span className="font-semibold">{formatCurrency(result.tip)}</span></p>
            <p>Total: <span className="font-semibold">{formatCurrency(result.total)}</span></p>
            <p>Per person: <span className="font-semibold">{formatCurrency(result.perPerson)}</span></p>
          </div>
        )}
        {result && "mode" in result && result.mode === "ratio" && (
          <div className="space-y-2">
            <p>Equivalent B value: <span className="font-semibold">{formatNumber(result.otherSide, 6)}</span></p>
            <p>Simplified ratio: <span className="font-semibold">{result.simplified}</span></p>
          </div>
        )}
        {result && "mode" in result && result.mode === "error" && (
          <div className="space-y-2">
            <p>Signed error: <span className="font-semibold">{formatNumber(result.signedError, 6)}%</span></p>
            <p>Absolute percent error: <span className="font-semibold">{formatNumber(result.absoluteError, 6)}%</span></p>
          </div>
        )}
        {result && "mode" in result && result.mode === "discount" && (
          <div className="space-y-2">
            <p>You save: <span className="font-semibold">{formatCurrency(result.saved)}</span></p>
            <p>Percent off: <span className="font-semibold">{formatNumber(result.percentOff, 4)}%</span></p>
          </div>
        )}
        {result && "mode" in result && result.mode === "margin" && (
          <div className="space-y-2">
            <p>Profit: <span className="font-semibold">{formatCurrency(result.profit)}</span></p>
            <p>Margin: <span className="font-semibold">{formatNumber(result.marginPercent, 4)}%</span></p>
            <p>Markup: <span className="font-semibold">{formatNumber(result.markupPercent, 4)}%</span></p>
          </div>
        )}
        {result && "mode" in result && result.mode === "commission" && (
          <p>Commission: <span className="font-semibold">{formatCurrency(result.commission)}</span></p>
        )}
        {result &&
          "value" in result &&
          typeof result.value === "number" &&
          "equation" in result && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">
              {modeLabel}: {formatNumber(result.value, 4)}
              {mode !== "of" ? "%" : ""}
            </p>
            <p>
              <span className="font-semibold">{result.label}</span>
            </p>
            <p className="text-muted-foreground">Formula: {result.equation}</p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function AgeCalculatorPanel() {
  const [birthDate, setBirthDate] = useState("1995-01-01");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));

  const result = useMemo(() => {
    const birth = new Date(`${birthDate}T00:00:00`);
    const target = new Date(`${targetDate}T00:00:00`);

    if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime())) return null;

    let start = birth;
    let end = target;
    let reverse = false;

    if (end < start) {
      reverse = true;
      start = target;
      end = birth;
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonth = end.getMonth() - 1 < 0 ? 11 : end.getMonth() - 1;
      const previousMonthYear =
        previousMonth === 11 ? end.getFullYear() - 1 : end.getFullYear();
      days += daysInMonth(previousMonthYear, previousMonth);
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalWeeks = totalDays / 7;
    const totalMonths = years * 12 + months + days / 30.4375;

    const nextBirthday = new Date(
      target.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );
    if (nextBirthday <= target) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil(
      (nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalMonths,
      reverse,
      daysUntilBirthday,
      nextBirthday: nextBirthday.toISOString().slice(0, 10),
    };
  }, [birthDate, targetDate]);

  const reset = () => {
    setBirthDate("1995-01-01");
    setTargetDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date of birth">
            <Input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
          <Field label="Target date">
            <Input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="border-border/80 bg-background/80"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="h-9">
            Reset
          </Button>
        </div>
      </section>

      <ResultCard title="Age result">
        {!result && <p>Enter valid dates to calculate age.</p>}
        {result && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">
              {result.years} years, {result.months} months, {result.days} days
            </p>
            <p>
              Total months: <span className="font-semibold">{formatNumber(result.totalMonths, 2)}</span>
            </p>
            <p>
              Total weeks: <span className="font-semibold">{formatNumber(result.totalWeeks, 2)}</span>
            </p>
            <p>
              Total days: <span className="font-semibold">{formatNumber(result.totalDays, 0)}</span>
            </p>
            <p>
              Next birthday: <span className="font-semibold">{result.nextBirthday}</span> (
              {result.daysUntilBirthday} days)
            </p>
            {result.reverse && (
              <p className="text-amber-500">
                Target date is earlier than birth date. Values shown are absolute difference.
              </p>
            )}
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function TimeCalculatorPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isDateCalculator = title === "date calculator";
  const isTimeCalculator = title === "time calculator";
  const isHoursCalculator = title.includes("hours calculator");
  const isTimeCard = title.includes("time card");
  const isTimeZone = title.includes("time zone");
  const isSleep = title.includes("sleep");
  const isDayCounter = title.includes("day counter");
  const isDayOfWeek = title.includes("day of the week");

  const today = formatDateInput(new Date());
  const nextWeek = formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState("30");
  const [allowOvernight, setAllowOvernight] = useState(true);
  const [includeEndDate, setIncludeEndDate] = useState(false);

  const [baseDate, setBaseDate] = useState(today);
  const [dateDirection, setDateDirection] = useState<"add" | "subtract">("add");
  const [shiftDays, setShiftDays] = useState("10");
  const [shiftWeeks, setShiftWeeks] = useState("0");
  const [shiftMonths, setShiftMonths] = useState("0");
  const [shiftYears, setShiftYears] = useState("0");

  const [baseTime, setBaseTime] = useState("09:30");
  const [timeDirection, setTimeDirection] = useState<"add" | "subtract">("add");
  const [shiftHours, setShiftHours] = useState("2");
  const [shiftMins, setShiftMins] = useState("15");

  const [timeZoneDateTime, setTimeZoneDateTime] = useState(formatDateTimeInput(new Date()));
  const [fromTimeZone, setFromTimeZone] = useState("America/New_York");
  const [toTimeZone, setToTimeZone] = useState("Europe/London");

  const [wakeTime, setWakeTime] = useState("07:00");
  const [bedTime, setBedTime] = useState("23:00");
  const [sleepLatency, setSleepLatency] = useState("15");

  const [dayOfWeekDate, setDayOfWeekDate] = useState(today);
  const [hourlyRate, setHourlyRate] = useState("28");
  const [timeCardRows, setTimeCardRows] = useState([
    { day: "Mon", start: "09:00", end: "17:00", breakMins: "30" },
    { day: "Tue", start: "09:00", end: "17:00", breakMins: "30" },
    { day: "Wed", start: "09:00", end: "17:00", breakMins: "30" },
    { day: "Thu", start: "09:00", end: "17:00", breakMins: "30" },
    { day: "Fri", start: "09:00", end: "17:00", breakMins: "30" },
    { day: "Sat", start: "", end: "", breakMins: "0" },
    { day: "Sun", start: "", end: "", breakMins: "0" },
  ]);

  const durationResult = useMemo(() => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const totalMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return {
      totalMinutes,
      totalHours: totalMinutes / 60,
      totalDays: totalMinutes / (60 * 24),
      clock: formatDurationFromMinutes(totalMinutes),
      direction: totalMinutes >= 0 ? "forward" : "reverse",
    };
  }, [endDate, endTime, startDate, startTime]);

  const hoursResult = useMemo(() => {
    const start = parseClockMinutes(startTime);
    const end = parseClockMinutes(endTime);
    const breakMins = Math.max(0, Math.round(parseNumber(breakMinutes)));
    if (start == null || end == null) return null;
    let diff = end - start;
    if (diff < 0 && allowOvernight) diff += 1440;
    if (diff < 0) return null;
    diff = Math.max(0, diff - breakMins);
    return {
      minutes: diff,
      hours: diff / 60,
      decimalHours: diff / 60,
    };
  }, [allowOvernight, breakMinutes, endTime, startTime]);

  const dayCounterResult = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const rawDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const days = includeEndDate ? rawDays + (rawDays >= 0 ? 1 : -1) : rawDays;
    const businessDays = includeEndDate
      ? countBusinessDays(start, end)
      : countBusinessDays(
          new Date(start.getTime() + (rawDays >= 0 ? 1 : -1) * 24 * 60 * 60 * 1000),
          end
        );
    return {
      days,
      weeks: days / 7,
      businessDays: rawDays === 0 && !includeEndDate ? 0 : businessDays,
      direction: rawDays >= 0 ? "forward" : "reverse",
    };
  }, [endDate, includeEndDate, startDate]);

  const dateShiftResult = useMemo(() => {
    const source = new Date(`${baseDate}T00:00:00`);
    if (Number.isNaN(source.getTime())) return null;
    const sign = dateDirection === "add" ? 1 : -1;
    const shifted = new Date(source);
    shifted.setFullYear(
      shifted.getFullYear() + sign * Math.round(parseNumber(shiftYears))
    );
    shifted.setMonth(shifted.getMonth() + sign * Math.round(parseNumber(shiftMonths)));
    shifted.setDate(
      shifted.getDate() +
        sign *
          (Math.round(parseNumber(shiftWeeks)) * 7 +
            Math.round(parseNumber(shiftDays)))
    );
    const dayName = shifted.toLocaleDateString("en-US", { weekday: "long" });
    return {
      shiftedDate: formatDateInput(shifted),
      dayName,
    };
  }, [baseDate, dateDirection, shiftDays, shiftMonths, shiftWeeks, shiftYears]);

  const timeShiftResult = useMemo(() => {
    const source = parseClockMinutes(baseTime);
    if (source == null) return null;
    const delta =
      Math.round(parseNumber(shiftHours)) * 60 + Math.round(parseNumber(shiftMins));
    const signedDelta = timeDirection === "add" ? delta : -delta;
    return {
      shiftedTime: formatClockMinutes(source + signedDelta),
      delta: formatDurationFromMinutes(signedDelta),
    };
  }, [baseTime, shiftHours, shiftMins, timeDirection]);

  const dayOfWeekResult = useMemo(() => {
    const date = new Date(`${dayOfWeekDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return {
      dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
      dayOfYear: Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      weekOfYear: Math.ceil(
        ((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
          (1000 * 60 * 60 * 24) +
          new Date(date.getFullYear(), 0, 1).getDay() +
          1) /
          7
      ),
    };
  }, [dayOfWeekDate]);

  const timeZoneResult = useMemo(() => {
    const utc = zonedDateTimeToUtc(timeZoneDateTime, fromTimeZone);
    if (!utc || Number.isNaN(utc.getTime())) return null;
    const sourceOffset =
      getTimeZoneOffsetMs(utc, fromTimeZone) / (1000 * 60 * 60);
    const targetOffset =
      getTimeZoneOffsetMs(utc, toTimeZone) / (1000 * 60 * 60);
    return {
      sourceLabel: formatDateInTimeZone(utc, fromTimeZone),
      targetLabel: formatDateInTimeZone(utc, toTimeZone),
      utcLabel: formatDateInTimeZone(utc, "UTC"),
      offsetDifference: targetOffset - sourceOffset,
    };
  }, [fromTimeZone, timeZoneDateTime, toTimeZone]);

  const sleepResult = useMemo(() => {
    const wake = parseClockMinutes(wakeTime);
    const bed = parseClockMinutes(bedTime);
    const latency = Math.max(0, Math.round(parseNumber(sleepLatency)));
    if (wake == null || bed == null) return null;
    const cycleLength = 90;
    const bedtimes = [6, 5, 4].map((cycles) => ({
      cycles,
      time: formatClockMinutes(wake - latency - cycles * cycleLength),
    }));
    const wakeTimes = [4, 5, 6].map((cycles) => ({
      cycles,
      time: formatClockMinutes(bed + latency + cycles * cycleLength),
    }));
    return { bedtimes, wakeTimes };
  }, [bedTime, sleepLatency, wakeTime]);

  const timeCardResult = useMemo(() => {
    const daily = timeCardRows.map((row) => {
      if (!row.start || !row.end) {
        return { ...row, minutes: 0, hours: 0 };
      }
      const start = parseClockMinutes(row.start);
      const end = parseClockMinutes(row.end);
      if (start == null || end == null) return { ...row, minutes: -1, hours: 0 };
      let minutes = end - start;
      if (minutes < 0 && allowOvernight) minutes += 1440;
      minutes -= Math.max(0, Math.round(parseNumber(row.breakMins)));
      minutes = Math.max(0, minutes);
      return { ...row, minutes, hours: minutes / 60 };
    });

    if (daily.some((row) => row.minutes < 0)) return null;
    const totalHours = daily.reduce((sum, row) => sum + row.hours, 0);
    const regularHours = Math.min(40, totalHours);
    const overtimeHours = Math.max(0, totalHours - 40);
    const rate = Math.max(0, parseNumber(hourlyRate));
    const pay = regularHours * rate + overtimeHours * rate * 1.5;
    return { daily, totalHours, regularHours, overtimeHours, pay };
  }, [allowOvernight, hourlyRate, timeCardRows]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isTimeCard ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Hourly rate ($)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
              <label className="inline-flex items-end gap-2 pb-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={allowOvernight}
                  onChange={(event) => setAllowOvernight(event.target.checked)}
                />
                Allow overnight shifts
              </label>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-muted/30 text-left uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Day</th>
                    <th className="px-2 py-2 font-medium">Start</th>
                    <th className="px-2 py-2 font-medium">End</th>
                    <th className="px-2 py-2 font-medium">Break (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {timeCardRows.map((row, index) => (
                    <tr key={row.day} className="border-t border-border/70">
                      <td className="px-2 py-2 font-medium">{row.day}</td>
                      <td className="px-2 py-2">
                        <Input
                          type="time"
                          value={row.start}
                          onChange={(event) =>
                            setTimeCardRows((prev) =>
                              prev.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, start: event.target.value }
                                  : entry
                              )
                            )
                          }
                          className="border-border/80 bg-background/80"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="time"
                          value={row.end}
                          onChange={(event) =>
                            setTimeCardRows((prev) =>
                              prev.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, end: event.target.value }
                                  : entry
                              )
                            )
                          }
                          className="border-border/80 bg-background/80"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          value={row.breakMins}
                          onChange={(event) =>
                            setTimeCardRows((prev) =>
                              prev.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, breakMins: event.target.value }
                                  : entry
                              )
                            )
                          }
                          className="border-border/80 bg-background/80"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : isTimeZone ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date and time">
              <Input
                type="datetime-local"
                value={timeZoneDateTime}
                onChange={(event) => setTimeZoneDateTime(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="From timezone">
              <Select value={fromTimeZone} onValueChange={setFromTimeZone}>
                <SelectTrigger className="border-border/80 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ZONE_OPTIONS.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="To timezone">
              <Select value={toTimeZone} onValueChange={setToTimeZone}>
                <SelectTrigger className="border-border/80 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ZONE_OPTIONS.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isSleep ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Target wake time">
              <Input
                type="time"
                value={wakeTime}
                onChange={(event) => setWakeTime(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Target bedtime">
              <Input
                type="time"
                value={bedTime}
                onChange={(event) => setBedTime(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Time to fall asleep (min)">
              <Input
                type="number"
                min="0"
                value={sleepLatency}
                onChange={(event) => setSleepLatency(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isDayOfWeek ? (
          <div className="max-w-xs">
            <Field label="Date">
              <Input
                type="date"
                value={dayOfWeekDate}
                onChange={(event) => setDayOfWeekDate(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isDateCalculator ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Base date">
              <Input
                type="date"
                value={baseDate}
                onChange={(event) => setBaseDate(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Operation">
              <Select
                value={dateDirection}
                onValueChange={(value) => setDateDirection(value as "add" | "subtract")}
              >
                <SelectTrigger className="border-border/80 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Days">
              <Input
                type="number"
                value={shiftDays}
                onChange={(event) => setShiftDays(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Weeks">
              <Input
                type="number"
                value={shiftWeeks}
                onChange={(event) => setShiftWeeks(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Months">
              <Input
                type="number"
                value={shiftMonths}
                onChange={(event) => setShiftMonths(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Years">
              <Input
                type="number"
                value={shiftYears}
                onChange={(event) => setShiftYears(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isTimeCalculator ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Base time">
              <Input
                type="time"
                value={baseTime}
                onChange={(event) => setBaseTime(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Operation">
              <Select
                value={timeDirection}
                onValueChange={(value) => setTimeDirection(value as "add" | "subtract")}
              >
                <SelectTrigger className="border-border/80 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Hours">
              <Input
                type="number"
                value={shiftHours}
                onChange={(event) => setShiftHours(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Minutes">
              <Input
                type="number"
                value={shiftMins}
                onChange={(event) => setShiftMins(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start date">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
              <Field label="End date">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
              <Field label="Start time">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
              <Field label="End time">
                <Input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="border-border/80 bg-background/80"
                />
              </Field>
            </div>
            {(isHoursCalculator || isDayCounter) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {isHoursCalculator && (
                  <Field label="Break (minutes)">
                    <Input
                      type="number"
                      min="0"
                      value={breakMinutes}
                      onChange={(event) => setBreakMinutes(event.target.value)}
                      className="border-border/80 bg-background/80"
                    />
                  </Field>
                )}
                <label className="inline-flex items-end gap-2 pb-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={isDayCounter ? includeEndDate : allowOvernight}
                    onChange={(event) =>
                      isDayCounter
                        ? setIncludeEndDate(event.target.checked)
                        : setAllowOvernight(event.target.checked)
                    }
                  />
                  {isDayCounter ? "Include end date" : "Allow overnight"}
                </label>
              </div>
            )}
          </div>
        )}
      </section>

      <ResultCard title={`${calculator.title} output`}>
        {isTimeCard && !timeCardResult && <p>Enter valid weekly entries.</p>}
        {isTimeCard && timeCardResult && (
          <div className="space-y-2">
            <p>Total hours: <span className="font-semibold">{formatNumber(timeCardResult.totalHours, 2)}</span></p>
            <p>Regular / overtime: <span className="font-semibold">{formatNumber(timeCardResult.regularHours, 2)}h / {formatNumber(timeCardResult.overtimeHours, 2)}h</span></p>
            <p>Estimated pay: <span className="font-semibold">{formatCurrency(timeCardResult.pay)}</span></p>
          </div>
        )}

        {isTimeZone && !timeZoneResult && <p>Enter a valid date/time and timezones.</p>}
        {isTimeZone && timeZoneResult && (
          <div className="space-y-2">
            <p>Source time: <span className="font-semibold">{timeZoneResult.sourceLabel}</span></p>
            <p>Target time: <span className="font-semibold">{timeZoneResult.targetLabel}</span></p>
            <p>UTC reference: <span className="font-semibold">{timeZoneResult.utcLabel}</span></p>
            <p>Offset difference: <span className="font-semibold">{formatNumber(timeZoneResult.offsetDifference, 2)} hours</span></p>
          </div>
        )}

        {isSleep && !sleepResult && <p>Enter valid sleep times.</p>}
        {isSleep && sleepResult && (
          <div className="space-y-2">
            <p className="font-semibold">Best bedtimes for your wake time:</p>
            <div className="space-y-1 text-muted-foreground">
              {sleepResult.bedtimes.map((entry) => (
                <p key={entry.cycles}>{entry.cycles} cycles: {entry.time}</p>
              ))}
            </div>
            <p className="font-semibold pt-1">Best wake times for your bedtime:</p>
            <div className="space-y-1 text-muted-foreground">
              {sleepResult.wakeTimes.map((entry) => (
                <p key={entry.cycles}>{entry.cycles} cycles: {entry.time}</p>
              ))}
            </div>
          </div>
        )}

        {isDayOfWeek && !dayOfWeekResult && <p>Enter a valid date.</p>}
        {isDayOfWeek && dayOfWeekResult && (
          <div className="space-y-2">
            <p>Day of week: <span className="font-semibold">{dayOfWeekResult.dayName}</span></p>
            <p>Day of year: <span className="font-semibold">{dayOfWeekResult.dayOfYear}</span></p>
            <p>Week of year: <span className="font-semibold">{dayOfWeekResult.weekOfYear}</span></p>
          </div>
        )}

        {isDateCalculator && !dateShiftResult && <p>Enter valid date values.</p>}
        {isDateCalculator && dateShiftResult && (
          <div className="space-y-2">
            <p>Result date: <span className="font-semibold">{dateShiftResult.shiftedDate}</span></p>
            <p>Day: <span className="font-semibold">{dateShiftResult.dayName}</span></p>
          </div>
        )}

        {isTimeCalculator && !timeShiftResult && <p>Enter valid time values.</p>}
        {isTimeCalculator && timeShiftResult && (
          <div className="space-y-2">
            <p>Result time: <span className="font-semibold">{timeShiftResult.shiftedTime}</span></p>
            <p>Applied delta: <span className="font-semibold">{timeShiftResult.delta}</span></p>
          </div>
        )}

        {isDayCounter && !dayCounterResult && <p>Enter valid dates.</p>}
        {isDayCounter && dayCounterResult && (
          <div className="space-y-2">
            <p>Direction: <span className="font-semibold">{dayCounterResult.direction}</span></p>
            <p>Total days: <span className="font-semibold">{dayCounterResult.days}</span></p>
            <p>Total weeks: <span className="font-semibold">{formatNumber(dayCounterResult.weeks, 3)}</span></p>
            <p>Business days: <span className="font-semibold">{dayCounterResult.businessDays}</span></p>
          </div>
        )}

        {isHoursCalculator && !hoursResult && <p>Enter valid hour values.</p>}
        {isHoursCalculator && hoursResult && (
          <div className="space-y-2">
            <p>Total duration: <span className="font-semibold">{formatDurationFromMinutes(hoursResult.minutes)}</span></p>
            <p>Decimal hours: <span className="font-semibold">{formatNumber(hoursResult.decimalHours, 3)}</span></p>
          </div>
        )}

        {!isDateCalculator &&
          !isTimeCalculator &&
          !isHoursCalculator &&
          !isTimeCard &&
          !isTimeZone &&
          !isSleep &&
          !isDayCounter &&
          !isDayOfWeek &&
          !durationResult && <p>Enter valid date/time values.</p>}
        {!isDateCalculator &&
          !isTimeCalculator &&
          !isHoursCalculator &&
          !isTimeCard &&
          !isTimeZone &&
          !isSleep &&
          !isDayCounter &&
          !isDayOfWeek &&
          durationResult && (
            <div className="space-y-2">
              <p>Direction: <span className="font-semibold">{durationResult.direction}</span></p>
              <p>Total days: <span className="font-semibold">{formatNumber(durationResult.totalDays, 4)}</span></p>
              <p>Total hours: <span className="font-semibold">{formatNumber(durationResult.totalHours, 2)}</span></p>
              <p>Total minutes: <span className="font-semibold">{formatNumber(durationResult.totalMinutes, 0)}</span></p>
              <p>Clock duration: <span className="font-semibold">{durationResult.clock}</span></p>
            </div>
          )}
      </ResultCard>
    </div>
  );
}

function TaxCalculatorPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const salesMode = title.includes("sales tax") || title.includes("vat");
  const [baseAmount, setBaseAmount] = useState("1000");
  const [taxRate, setTaxRate] = useState("8.25");
  const [stateRate, setStateRate] = useState("4");
  const [ficaRate, setFicaRate] = useState("7.65");

  const result = useMemo(() => {
    const amount = parseNumber(baseAmount);
    const rate = parseNumber(taxRate);
    if (amount < 0 || rate < 0) return null;

    if (salesMode) {
      const tax = amount * (rate / 100);
      return {
        mode: "sales",
        tax,
        total: amount + tax,
      } as const;
    }

    const fed = amount * (rate / 100);
    const state = amount * (parseNumber(stateRate) / 100);
    const fica = amount * (parseNumber(ficaRate) / 100);
    const totalTax = fed + state + fica;
    const net = amount - totalTax;
    return {
      mode: "income",
      fed,
      state,
      fica,
      totalTax,
      net,
    } as const;
  }, [baseAmount, ficaRate, salesMode, stateRate, taxRate]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={salesMode ? "Amount before tax" : "Gross amount"}>
            <Input type="number" min="0" inputMode="decimal" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
          <Field label={salesMode ? "Tax rate (%)" : "Federal rate (%)"}>
            <Input type="number" min="0" step="0.01" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
          {!salesMode && (
            <>
              <Field label="State/local rate (%)">
                <Input type="number" min="0" step="0.01" inputMode="decimal" value={stateRate} onChange={(e) => setStateRate(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
              <Field label="Payroll rate (FICA %)">
                <Input type="number" min="0" step="0.01" inputMode="decimal" value={ficaRate} onChange={(e) => setFicaRate(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            </>
          )}
        </div>
      </section>
      <ResultCard title="Tax output">
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "sales" && (
          <div className="space-y-2">
            <p>
              Tax: <span className="font-semibold">{formatCurrency(result.tax)}</span>
            </p>
            <p>
              Total: <span className="font-semibold">{formatCurrency(result.total)}</span>
            </p>
          </div>
        )}
        {result?.mode === "income" && (
          <div className="space-y-2">
            <p>Federal: <span className="font-semibold">{formatCurrency(result.fed)}</span></p>
            <p>State: <span className="font-semibold">{formatCurrency(result.state)}</span></p>
            <p>Payroll: <span className="font-semibold">{formatCurrency(result.fica)}</span></p>
            <p>Total tax: <span className="font-semibold">{formatCurrency(result.totalTax)}</span></p>
            <p>Net amount: <span className="font-semibold">{formatCurrency(result.net)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function DebtCalculatorPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isDti = title.includes("debt-to-income");
  const isBudget = title.includes("budget");

  const [balance, setBalance] = useState("12000");
  const [annualRate, setAnnualRate] = useState("18");
  const [monthlyPaymentValue, setMonthlyPaymentValue] = useState("350");
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState("7000");
  const [housingPayment, setHousingPayment] = useState("2200");
  const [otherDebtPayments, setOtherDebtPayments] = useState("600");
  const [budgetIncome, setBudgetIncome] = useState("7500");
  const [budgetHousing, setBudgetHousing] = useState("2200");
  const [budgetTransport, setBudgetTransport] = useState("600");
  const [budgetFood, setBudgetFood] = useState("750");
  const [budgetUtilities, setBudgetUtilities] = useState("320");
  const [budgetInsurance, setBudgetInsurance] = useState("290");
  const [budgetDebt, setBudgetDebt] = useState("450");
  const [budgetLifestyle, setBudgetLifestyle] = useState("500");

  const result = useMemo<
    | {
        mode: "payoff";
        months: number;
        years: number;
        totalInterest: number;
        totalPaid: number;
      }
    | { mode: "payoff-error"; message: string }
    | { mode: "dti"; frontEnd: number; backEnd: number; freeCashFlow: number }
    | {
        mode: "budget";
        totalExpenses: number;
        remaining: number;
        savingsRate: number;
        needsRatio: number;
        wantsRatio: number;
      }
    | null
  >(() => {
    if (isDti) {
      const income = parseNumber(grossMonthlyIncome);
      const housing = parseNumber(housingPayment);
      const otherDebts = parseNumber(otherDebtPayments);
      if (income <= 0 || housing < 0 || otherDebts < 0) return null;
      return {
        mode: "dti",
        frontEnd: (housing / income) * 100,
        backEnd: ((housing + otherDebts) / income) * 100,
        freeCashFlow: income - housing - otherDebts,
      };
    }

    if (isBudget) {
      const income = parseNumber(budgetIncome);
      if (income <= 0) return null;
      const housing = Math.max(0, parseNumber(budgetHousing));
      const transport = Math.max(0, parseNumber(budgetTransport));
      const food = Math.max(0, parseNumber(budgetFood));
      const utilities = Math.max(0, parseNumber(budgetUtilities));
      const insurance = Math.max(0, parseNumber(budgetInsurance));
      const debt = Math.max(0, parseNumber(budgetDebt));
      const lifestyle = Math.max(0, parseNumber(budgetLifestyle));
      const totalExpenses =
        housing + transport + food + utilities + insurance + debt + lifestyle;
      const needs = housing + transport + utilities + insurance + debt;
      const wants = food + lifestyle;
      const remaining = income - totalExpenses;

      return {
        mode: "budget",
        totalExpenses,
        remaining,
        savingsRate: (remaining / income) * 100,
        needsRatio: (needs / income) * 100,
        wantsRatio: (wants / income) * 100,
      };
    }

    let current = parseNumber(balance);
    const monthlyRate = parseNumber(annualRate) / 100 / 12;
    const payment = parseNumber(monthlyPaymentValue);

    if (current <= 0 || payment <= 0) return null;
    if (monthlyRate > 0 && payment <= current * monthlyRate) {
      return { mode: "payoff-error", message: "Payment is too low to cover monthly interest." };
    }

    let month = 0;
    let totalInterest = 0;
    while (current > 0 && month < 1200) {
      const interest = current * monthlyRate;
      totalInterest += interest;
      current += interest;
      const applied = Math.min(current, payment);
      current -= applied;
      month += 1;
    }

    return {
      mode: "payoff",
      months: month,
      years: month / 12,
      totalInterest,
      totalPaid: parseNumber(balance) + totalInterest,
    };
  }, [
    annualRate,
    balance,
    budgetDebt,
    budgetFood,
    budgetHousing,
    budgetIncome,
    budgetInsurance,
    budgetLifestyle,
    budgetTransport,
    budgetUtilities,
    grossMonthlyIncome,
    housingPayment,
    isBudget,
    isDti,
    monthlyPaymentValue,
    otherDebtPayments,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isDti ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Gross monthly income">
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={grossMonthlyIncome}
                onChange={(e) => setGrossMonthlyIncome(e.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Monthly housing payment">
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={housingPayment}
                onChange={(e) => setHousingPayment(e.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Other monthly debt">
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={otherDebtPayments}
                onChange={(e) => setOtherDebtPayments(e.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isBudget ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Monthly take-home income">
              <Input type="number" min="0" value={budgetIncome} onChange={(e) => setBudgetIncome(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Housing">
              <Input type="number" min="0" value={budgetHousing} onChange={(e) => setBudgetHousing(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Transport">
              <Input type="number" min="0" value={budgetTransport} onChange={(e) => setBudgetTransport(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Food">
              <Input type="number" min="0" value={budgetFood} onChange={(e) => setBudgetFood(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Utilities">
              <Input type="number" min="0" value={budgetUtilities} onChange={(e) => setBudgetUtilities(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Insurance">
              <Input type="number" min="0" value={budgetInsurance} onChange={(e) => setBudgetInsurance(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Debt payments">
              <Input type="number" min="0" value={budgetDebt} onChange={(e) => setBudgetDebt(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Lifestyle / misc">
              <Input type="number" min="0" value={budgetLifestyle} onChange={(e) => setBudgetLifestyle(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Current balance">
              <Input type="number" min="0" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="APR (%)">
              <Input type="number" min="0" step="0.01" inputMode="decimal" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly payment">
              <Input type="number" min="0" inputMode="decimal" value={monthlyPaymentValue} onChange={(e) => setMonthlyPaymentValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        )}
      </section>
      <ResultCard title={isDti ? "DTI output" : isBudget ? "Budget output" : "Payoff estimate"}>
        {!result && <p>Enter valid debt values.</p>}
        {result?.mode === "payoff-error" && <p className="text-amber-500">{result.message}</p>}
        {result?.mode === "dti" && (
          <div className="space-y-2">
            <p>Front-end DTI: <span className="font-semibold">{formatNumber(result.frontEnd, 2)}%</span></p>
            <p>Back-end DTI: <span className="font-semibold">{formatNumber(result.backEnd, 2)}%</span></p>
            <p>
              DTI tier:{" "}
              <span className="font-semibold">
                {result.backEnd <= 36 ? "Strong" : result.backEnd <= 43 ? "Acceptable" : "High risk"}
              </span>
            </p>
            <p>Free cash flow: <span className="font-semibold">{formatCurrency(result.freeCashFlow)}</span></p>
          </div>
        )}
        {result?.mode === "budget" && (
          <div className="space-y-2">
            <p>Total expenses: <span className="font-semibold">{formatCurrency(result.totalExpenses)}</span></p>
            <p>Monthly remainder: <span className="font-semibold">{formatCurrency(result.remaining)}</span></p>
            <p>Savings rate: <span className="font-semibold">{formatNumber(result.savingsRate, 2)}%</span></p>
            <p>Needs ratio: <span className="font-semibold">{formatNumber(result.needsRatio, 2)}%</span></p>
            <p>Wants ratio: <span className="font-semibold">{formatNumber(result.wantsRatio, 2)}%</span></p>
          </div>
        )}
        {result?.mode === "payoff" && (
          <div className="space-y-2">
            <p>Time to payoff: <span className="font-semibold">{result.months} months</span></p>
            <p>Equivalent years: <span className="font-semibold">{formatNumber(result.years, 2)}</span></p>
            <p>Total interest: <span className="font-semibold">{formatCurrency(result.totalInterest)}</span></p>
            <p>Total paid: <span className="font-semibold">{formatCurrency(result.totalPaid)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function calculateIrr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;
  let rate = 0.1;
  for (let i = 0; i < 100; i += 1) {
    let npv = 0;
    let derivative = 0;
    for (let t = 0; t < cashFlows.length; t += 1) {
      npv += cashFlows[t] / (1 + rate) ** t;
      derivative += (-t * cashFlows[t]) / (1 + rate) ** (t + 1);
    }
    if (!Number.isFinite(npv) || !Number.isFinite(derivative) || derivative === 0) return null;
    const next = rate - npv / derivative;
    if (!Number.isFinite(next)) return null;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }
  return rate;
}

function FinancialMetricsPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isIrr = title.includes("irr");
  const isRoi = title.includes("roi");
  const isAprOrRate = title.includes("apr") || title.includes("interest rate");
  const isPresentValue = title.includes("present value");
  const isFutureValue = title.includes("future value");
  const isPayback = title.includes("payback");
  const isCashBack = title.includes("cash back or low interest");
  const isGdp = title.includes("gdp");
  const isFinance = title === "finance calculator";

  const [a, setA] = useState("10000");
  const [b, setB] = useState("12500");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("5");
  const [months, setMonths] = useState("60");
  const [paymentValue, setPaymentValue] = useState("250");
  const [cashFlows, setCashFlows] = useState("-10000,3000,3200,3500,4000");
  const [cashPrice, setCashPrice] = useState("40000");
  const [cashBackAmount, setCashBackAmount] = useState("1000");
  const [cashNormalApr, setCashNormalApr] = useState("4.99");
  const [cashLowApr, setCashLowApr] = useState("1.99");
  const [cashTermMonths, setCashTermMonths] = useState("60");
  const [cashDownPayment, setCashDownPayment] = useState("12000");
  const [cashTaxRate, setCashTaxRate] = useState("8.75");
  const [cashFees, setCashFees] = useState("2000");
  const [consumption, setConsumption] = useState("15000");
  const [investment, setInvestment] = useState("4000");
  const [governmentSpending, setGovernmentSpending] = useState("3800");
  const [exportsValue, setExportsValue] = useState("2200");
  const [importsValue, setImportsValue] = useState("1700");
  const [gnp, setGnp] = useState("22000");
  const [indirectTaxes, setIndirectTaxes] = useState("900");
  const [depreciation, setDepreciation] = useState("1400");
  const [foreignIncome, setForeignIncome] = useState("300");

  const result = useMemo<
    | {
        mode: "single";
        label: string;
        value: number;
        style: "currency" | "percent" | "years" | "number";
        decimals?: number;
      }
    | {
        mode: "cash-back";
        cashPayment: number;
        lowPayment: number;
        cashTotal: number;
        lowTotal: number;
        savings: number;
        better: "cash-back" | "low-rate" | "tie";
      }
    | {
        mode: "gdp";
        expenditure: number;
        income: number;
        variance: number;
      }
    | {
        mode: "finance";
        futureValue: number;
        annuityFuture: number;
        totalContribution: number;
        estimatedInterest: number;
      }
    | null
  >(() => {
    if (isIrr) {
      const parsed = cashFlows
        .split(",")
        .map((token) => parseNumber(token.trim()))
        .filter((n) => Number.isFinite(n));
      const irr = calculateIrr(parsed);
      return irr == null
        ? null
        : { mode: "single", label: "IRR", value: irr * 100, style: "percent", decimals: 4 };
    }

    if (isCashBack) {
      const price = parseNumber(cashPrice);
      const rebate = parseNumber(cashBackAmount);
      const down = parseNumber(cashDownPayment);
      const fees = parseNumber(cashFees);
      const tax = parseNumber(cashTaxRate) / 100;
      const term = Math.max(1, Math.round(parseNumber(cashTermMonths)));
      const lowApr = parseNumber(cashLowApr);
      const standardApr = parseNumber(cashNormalApr);
      if (price <= 0 || term <= 0) return null;

      const taxCost = price * tax;
      const principalCashBack = Math.max(0, price - rebate - down + taxCost + fees);
      const principalLowRate = Math.max(0, price - down + taxCost + fees);
      const cashPayment = monthlyPayment(principalCashBack, standardApr, term);
      const lowPayment = monthlyPayment(principalLowRate, lowApr, term);
      const cashTotal = down + cashPayment * term;
      const lowTotal = down + lowPayment * term;
      const better =
        Math.abs(cashTotal - lowTotal) < 0.01
          ? "tie"
          : cashTotal < lowTotal
            ? "cash-back"
            : "low-rate";

      return {
        mode: "cash-back",
        cashPayment,
        lowPayment,
        cashTotal,
        lowTotal,
        savings: Math.abs(cashTotal - lowTotal),
        better,
      };
    }

    if (isGdp) {
      const c = parseNumber(consumption);
      const i = parseNumber(investment);
      const g = parseNumber(governmentSpending);
      const x = parseNumber(exportsValue);
      const m = parseNumber(importsValue);
      const income = parseNumber(gnp) + parseNumber(indirectTaxes) + parseNumber(depreciation) + parseNumber(foreignIncome);
      const expenditure = c + i + g + (x - m);
      return { mode: "gdp", expenditure, income, variance: expenditure - income };
    }

    if (isFinance) {
      const principal = parseNumber(a);
      const monthlyContribution = parseNumber(b);
      const annual = parseNumber(rate) / 100;
      const yearsValue = parseNumber(years);
      if (principal < 0 || monthlyContribution < 0 || yearsValue <= 0) return null;

      const fvLump = principal * (1 + annual) ** yearsValue;
      const monthCount = Math.max(1, Math.round(yearsValue * 12));
      const monthlyRate = annual / 12;
      const fvContribution =
        monthlyRate === 0
          ? monthlyContribution * monthCount
          : monthlyContribution * (((1 + monthlyRate) ** monthCount - 1) / monthlyRate);
      const annuityFuture = fvLump + fvContribution;
      const totalContribution = principal + monthlyContribution * monthCount;

      return {
        mode: "finance",
        futureValue: fvLump,
        annuityFuture,
        totalContribution,
        estimatedInterest: annuityFuture - totalContribution,
      };
    }

    if (isRoi) {
      const initial = parseNumber(a);
      const finalValue = parseNumber(b);
      if (initial === 0) return null;
      const roi = ((finalValue - initial) / initial) * 100;
      return { mode: "single", label: "ROI", value: roi, style: "percent" };
    }

    if (isAprOrRate) {
      const principal = parseNumber(a);
      const payment = parseNumber(paymentValue);
      const n = Math.max(1, Math.round(parseNumber(months)));
      if (principal <= 0 || payment <= 0) return null;
      let low = 0;
      let high = 1;
      for (let i = 0; i < 80; i += 1) {
        const mid = (low + high) / 2;
        const mRate = mid / 12;
        const guess =
          mRate === 0
            ? principal / n
            : (principal * mRate * (1 + mRate) ** n) / ((1 + mRate) ** n - 1);
        if (guess > payment) high = mid;
        else low = mid;
      }
      return {
        mode: "single",
        label: "Estimated annual rate",
        value: ((low + high) / 2) * 100,
        style: "percent",
        decimals: 4,
      };
    }

    if (isPresentValue) {
      const future = parseNumber(b);
      const annual = parseNumber(rate) / 100;
      const y = parseNumber(years);
      if (y <= 0) return null;
      return {
        mode: "single",
        label: "Present value",
        value: future / (1 + annual) ** y,
        style: "currency",
      };
    }

    if (isFutureValue) {
      const present = parseNumber(a);
      const annual = parseNumber(rate) / 100;
      const y = parseNumber(years);
      if (y <= 0) return null;
      return {
        mode: "single",
        label: "Future value",
        value: present * (1 + annual) ** y,
        style: "currency",
      };
    }

    if (isPayback) {
      const initial = parseNumber(a);
      const annualCashIn = parseNumber(b);
      if (initial <= 0 || annualCashIn <= 0) return null;
      return {
        mode: "single",
        label: "Payback period",
        value: initial / annualCashIn,
        style: "years",
      };
    }

    return null;
  }, [
    a,
    b,
    cashBackAmount,
    cashDownPayment,
    cashFees,
    cashFlows,
    cashLowApr,
    cashNormalApr,
    cashPrice,
    cashTaxRate,
    cashTermMonths,
    consumption,
    depreciation,
    exportsValue,
    foreignIncome,
    gnp,
    governmentSpending,
    importsValue,
    indirectTaxes,
    investment,
    isAprOrRate,
    isCashBack,
    isFinance,
    isFutureValue,
    isGdp,
    isIrr,
    isPayback,
    isPresentValue,
    isRoi,
    months,
    paymentValue,
    rate,
    years,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isIrr ? (
          <Field label="Cash flows (comma-separated)">
            <Input value={cashFlows} onChange={(e) => setCashFlows(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
        ) : isCashBack ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Vehicle price">
              <Input type="number" inputMode="decimal" value={cashPrice} onChange={(e) => setCashPrice(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Cash back amount">
              <Input type="number" inputMode="decimal" value={cashBackAmount} onChange={(e) => setCashBackAmount(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Standard APR (%)">
              <Input type="number" inputMode="decimal" value={cashNormalApr} onChange={(e) => setCashNormalApr(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Low-rate APR (%)">
              <Input type="number" inputMode="decimal" value={cashLowApr} onChange={(e) => setCashLowApr(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Term (months)">
              <Input type="number" inputMode="decimal" value={cashTermMonths} onChange={(e) => setCashTermMonths(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Down payment">
              <Input type="number" inputMode="decimal" value={cashDownPayment} onChange={(e) => setCashDownPayment(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Sales tax (%)">
              <Input type="number" inputMode="decimal" value={cashTaxRate} onChange={(e) => setCashTaxRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Fees">
              <Input type="number" inputMode="decimal" value={cashFees} onChange={(e) => setCashFees(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isGdp ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Personal consumption (C)">
              <Input type="number" inputMode="decimal" value={consumption} onChange={(e) => setConsumption(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Gross investment (I)">
              <Input type="number" inputMode="decimal" value={investment} onChange={(e) => setInvestment(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Government spending (G)">
              <Input type="number" inputMode="decimal" value={governmentSpending} onChange={(e) => setGovernmentSpending(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Exports (X)">
              <Input type="number" inputMode="decimal" value={exportsValue} onChange={(e) => setExportsValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Imports (M)">
              <Input type="number" inputMode="decimal" value={importsValue} onChange={(e) => setImportsValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="GNP">
              <Input type="number" inputMode="decimal" value={gnp} onChange={(e) => setGnp(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Indirect business taxes">
              <Input type="number" inputMode="decimal" value={indirectTaxes} onChange={(e) => setIndirectTaxes(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Depreciation">
              <Input type="number" inputMode="decimal" value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Net foreign income">
              <Input type="number" inputMode="decimal" value={foreignIncome} onChange={(e) => setForeignIncome(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isFinance ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Initial principal">
              <Input type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly contribution">
              <Input type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Expected annual return (%)">
              <Input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Years">
              <Input type="number" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Value A">
              <Input type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Value B">
              <Input type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Rate (%)">
              <Input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Years">
              <Input type="number" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            {isAprOrRate && (
              <>
                <Field label="Months">
                  <Input type="number" inputMode="decimal" value={months} onChange={(e) => setMonths(e.target.value)} className="border-border/80 bg-background/80" />
                </Field>
                <Field label="Monthly payment">
                  <Input type="number" inputMode="decimal" value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)} className="border-border/80 bg-background/80" />
                </Field>
              </>
            )}
          </div>
        )}
      </section>
      <ResultCard title="Metric output">
        {!result && <p>Enter valid values to calculate this metric.</p>}
        {result?.mode === "single" && (
          <p className="text-2xl font-semibold text-foreground">
            {result.label}:{" "}
            {result.style === "currency" && formatCurrency(result.value)}
            {result.style === "percent" && `${formatNumber(result.value, result.decimals ?? 2)}%`}
            {result.style === "years" && `${formatNumber(result.value, 2)} years`}
            {result.style === "number" && formatNumber(result.value, result.decimals ?? 4)}
          </p>
        )}
        {result?.mode === "cash-back" && (
          <div className="space-y-2">
            <p>
              Better offer:{" "}
              <span className="font-semibold">
                {result.better === "tie"
                  ? "Tie"
                  : result.better === "cash-back"
                    ? "Cash back offer"
                    : "Low-rate offer"}
              </span>
            </p>
            <p>Monthly payment (cash back): <span className="font-semibold">{formatCurrency(result.cashPayment)}</span></p>
            <p>Monthly payment (low rate): <span className="font-semibold">{formatCurrency(result.lowPayment)}</span></p>
            <p>Total cost (cash back): <span className="font-semibold">{formatCurrency(result.cashTotal)}</span></p>
            <p>Total cost (low rate): <span className="font-semibold">{formatCurrency(result.lowTotal)}</span></p>
            <p>Savings spread: <span className="font-semibold">{formatCurrency(result.savings)}</span></p>
          </div>
        )}
        {result?.mode === "gdp" && (
          <div className="space-y-2">
            <p>GDP (expenditure approach): <span className="font-semibold">{formatCurrency(result.expenditure)}</span></p>
            <p>GDP (income approach): <span className="font-semibold">{formatCurrency(result.income)}</span></p>
            <p>Approach variance: <span className="font-semibold">{formatCurrency(result.variance)}</span></p>
          </div>
        )}
        {result?.mode === "finance" && (
          <div className="space-y-2">
            <p>Future value (lump sum): <span className="font-semibold">{formatCurrency(result.futureValue)}</span></p>
            <p>Future value (with contributions): <span className="font-semibold">{formatCurrency(result.annuityFuture)}</span></p>
            <p>Total contributions: <span className="font-semibold">{formatCurrency(result.totalContribution)}</span></p>
            <p>Estimated growth: <span className="font-semibold">{formatCurrency(result.estimatedInterest)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function AffordabilityPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isRentVsBuy = title.includes("rent vs. buy");
  const isRent = title === "rent calculator";
  const isRealEstate = title.includes("real estate");

  const [annualIncome, setAnnualIncome] = useState("120000");
  const [monthlyDebt, setMonthlyDebt] = useState("900");
  const [downPayment, setDownPayment] = useState("80000");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("30");
  const [maxDti, setMaxDti] = useState("36");
  const [rentRatio, setRentRatio] = useState("30");
  const [rvbHomePrice, setRvbHomePrice] = useState("500000");
  const [rvbDownPct, setRvbDownPct] = useState("20");
  const [rvbMortgageRate, setRvbMortgageRate] = useState("6.5");
  const [rvbLoanYears, setRvbLoanYears] = useState("30");
  const [rvbMonthlyRent, setRvbMonthlyRent] = useState("2600");
  const [rvbRentIncrease, setRvbRentIncrease] = useState("3");
  const [rvbStayYears, setRvbStayYears] = useState("7");
  const [rvbAppreciation, setRvbAppreciation] = useState("3");
  const [rvbPropertyTax, setRvbPropertyTax] = useState("1.2");
  const [rvbMaintenance, setRvbMaintenance] = useState("1");
  const [rvbInsuranceYear, setRvbInsuranceYear] = useState("1800");
  const [rvbClosingCostPct, setRvbClosingCostPct] = useState("3");
  const [rvbSellingCostPct, setRvbSellingCostPct] = useState("6");
  const [rvbInvestmentReturn, setRvbInvestmentReturn] = useState("5");
  const [rePurchasePrice, setRePurchasePrice] = useState("350000");
  const [reMonthlyRent, setReMonthlyRent] = useState("2800");
  const [reMonthlyCosts, setReMonthlyCosts] = useState("850");
  const [reVacancyRate, setReVacancyRate] = useState("6");
  const [reHoldYears, setReHoldYears] = useState("10");
  const [reAppreciation, setReAppreciation] = useState("3");

  const result = useMemo<
    | { mode: "affordability"; housingBudget: number; loanAmount: number; homePrice: number }
    | { mode: "rent"; maxRent: number; ratioBudget: number; discretionary: number }
    | {
        mode: "rent-vs-buy";
        monthlyOwnerCost: number;
        rentTotal: number;
        netBuyCost: number;
        difference: number;
        decision: "buy" | "rent" | "tie";
      }
    | {
        mode: "real-estate";
        monthlyCashFlow: number;
        annualNoi: number;
        capRate: number;
        roi: number;
        projectedValue: number;
      }
    | null
  >(() => {
    if (isRent) {
      const monthlyIncome = parseNumber(annualIncome) / 12;
      const debtPayments = parseNumber(monthlyDebt);
      const targetRatio = parseNumber(rentRatio) / 100;
      if (monthlyIncome <= 0 || targetRatio <= 0) return null;
      const ratioBudget = monthlyIncome * targetRatio;
      const maxRent = ratioBudget - debtPayments;
      return {
        mode: "rent",
        maxRent,
        ratioBudget,
        discretionary: monthlyIncome - debtPayments - Math.max(0, maxRent),
      };
    }

    if (isRentVsBuy) {
      const homePrice = parseNumber(rvbHomePrice);
      const downPct = parseNumber(rvbDownPct) / 100;
      const mortgageRate = parseNumber(rvbMortgageRate);
      const loanYears = parseNumber(rvbLoanYears);
      const monthlyRent = parseNumber(rvbMonthlyRent);
      const rentIncrease = parseNumber(rvbRentIncrease) / 100;
      const stayYears = parseNumber(rvbStayYears);
      const appreciation = parseNumber(rvbAppreciation) / 100;
      const propertyTax = parseNumber(rvbPropertyTax) / 100;
      const maintenance = parseNumber(rvbMaintenance) / 100;
      const insurance = parseNumber(rvbInsuranceYear);
      const closingPct = parseNumber(rvbClosingCostPct) / 100;
      const sellingPct = parseNumber(rvbSellingCostPct) / 100;
      const investReturn = parseNumber(rvbInvestmentReturn) / 100;

      if (
        homePrice <= 0 ||
        loanYears <= 0 ||
        stayYears <= 0 ||
        monthlyRent < 0 ||
        downPct < 0 ||
        downPct >= 1
      ) {
        return null;
      }

      const down = homePrice * downPct;
      const loan = Math.max(0, homePrice - down);
      const termMonths = Math.max(1, Math.round(loanYears * 12));
      const stayMonths = Math.max(1, Math.round(stayYears * 12));
      const monthlyPi = monthlyPayment(loan, mortgageRate, termMonths);
      const monthlyOwnerCost =
        monthlyPi + (homePrice * (propertyTax + maintenance) + insurance) / 12;

      const monthlyRate = mortgageRate / 100 / 12;
      let remainingBalance = 0;
      if (stayMonths < termMonths) {
        if (monthlyRate === 0) {
          remainingBalance = Math.max(0, loan - (loan / termMonths) * stayMonths);
        } else {
          const growthTerm = (1 + monthlyRate) ** termMonths;
          const growthStay = (1 + monthlyRate) ** stayMonths;
          remainingBalance = (loan * (growthTerm - growthStay)) / (growthTerm - 1);
        }
      }

      const futureHomeValue = homePrice * (1 + appreciation) ** stayYears;
      const saleProceeds = futureHomeValue * (1 - sellingPct) - remainingBalance;
      const closingCosts = homePrice * closingPct;
      const ownershipOutflow = down + closingCosts + monthlyOwnerCost * stayMonths;
      const downPaymentOpportunityCost = down * ((1 + investReturn) ** stayYears - 1);
      const netBuyCost = ownershipOutflow - saleProceeds + downPaymentOpportunityCost;

      const monthlyRentGrowth =
        rentIncrease <= -1 ? -0.999 : (1 + rentIncrease) ** (1 / 12) - 1;
      const rentTotal =
        Math.abs(monthlyRentGrowth) < 1e-8
          ? monthlyRent * stayMonths
          : monthlyRent * (((1 + monthlyRentGrowth) ** stayMonths - 1) / monthlyRentGrowth);

      const difference = rentTotal - netBuyCost;
      const decision =
        Math.abs(difference) < 1
          ? "tie"
          : difference > 0
            ? "buy"
            : "rent";

      return {
        mode: "rent-vs-buy",
        monthlyOwnerCost,
        rentTotal,
        netBuyCost,
        difference: Math.abs(difference),
        decision,
      };
    }

    if (isRealEstate) {
      const purchase = parseNumber(rePurchasePrice);
      const monthlyRentIncome = parseNumber(reMonthlyRent);
      const monthlyCosts = parseNumber(reMonthlyCosts);
      const vacancy = clamp(parseNumber(reVacancyRate) / 100, 0, 0.95);
      const holdYears = parseNumber(reHoldYears);
      const appreciation = parseNumber(reAppreciation) / 100;
      if (purchase <= 0 || holdYears <= 0) return null;

      const annualNoi = monthlyRentIncome * 12 * (1 - vacancy) - monthlyCosts * 12;
      const monthlyCashFlow = annualNoi / 12;
      const capRate = (annualNoi / purchase) * 100;
      const projectedValue = purchase * (1 + appreciation) ** holdYears;
      const totalProfit = annualNoi * holdYears + (projectedValue - purchase);
      const roi = (totalProfit / purchase) * 100;

      return {
        mode: "real-estate",
        monthlyCashFlow,
        annualNoi,
        capRate,
        roi,
        projectedValue,
      };
    }

    const monthlyIncome = parseNumber(annualIncome) / 12;
    const maxDebtBudget = monthlyIncome * (parseNumber(maxDti) / 100);
    const housingBudget = maxDebtBudget - parseNumber(monthlyDebt);
    const months = Math.max(1, Math.round(parseNumber(years) * 12));
    const annualRate = parseNumber(rate);
    if (housingBudget <= 0 || months <= 0) return null;

    const mRate = annualRate / 100 / 12;
    const loanAmount =
      mRate === 0
        ? housingBudget * months
        : (housingBudget * ((1 + mRate) ** months - 1)) / (mRate * (1 + mRate) ** months);
    const homePrice = loanAmount + parseNumber(downPayment);
    return {
      mode: "affordability",
      housingBudget,
      loanAmount,
      homePrice,
    };
  }, [
    annualIncome,
    downPayment,
    isRealEstate,
    isRent,
    isRentVsBuy,
    maxDti,
    monthlyDebt,
    rate,
    reAppreciation,
    reHoldYears,
    reMonthlyCosts,
    reMonthlyRent,
    rePurchasePrice,
    reVacancyRate,
    rentRatio,
    rvbAppreciation,
    rvbClosingCostPct,
    rvbDownPct,
    rvbHomePrice,
    rvbInsuranceYear,
    rvbInvestmentReturn,
    rvbLoanYears,
    rvbMaintenance,
    rvbMonthlyRent,
    rvbMortgageRate,
    rvbPropertyTax,
    rvbRentIncrease,
    rvbSellingCostPct,
    rvbStayYears,
    years,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isRent ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Annual gross income">
              <Input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Target rent ratio (%)">
              <Input type="number" value={rentRatio} onChange={(e) => setRentRatio(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly debt obligations">
              <Input type="number" value={monthlyDebt} onChange={(e) => setMonthlyDebt(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isRentVsBuy ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Home price">
              <Input type="number" value={rvbHomePrice} onChange={(e) => setRvbHomePrice(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Down payment (%)">
              <Input type="number" value={rvbDownPct} onChange={(e) => setRvbDownPct(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Mortgage rate (%)">
              <Input type="number" value={rvbMortgageRate} onChange={(e) => setRvbMortgageRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Loan term (years)">
              <Input type="number" value={rvbLoanYears} onChange={(e) => setRvbLoanYears(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly rent">
              <Input type="number" value={rvbMonthlyRent} onChange={(e) => setRvbMonthlyRent(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Annual rent increase (%)">
              <Input type="number" value={rvbRentIncrease} onChange={(e) => setRvbRentIncrease(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Planned stay (years)">
              <Input type="number" value={rvbStayYears} onChange={(e) => setRvbStayYears(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Home appreciation (%)">
              <Input type="number" value={rvbAppreciation} onChange={(e) => setRvbAppreciation(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Property tax (%)">
              <Input type="number" value={rvbPropertyTax} onChange={(e) => setRvbPropertyTax(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Maintenance (%)">
              <Input type="number" value={rvbMaintenance} onChange={(e) => setRvbMaintenance(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Insurance per year">
              <Input type="number" value={rvbInsuranceYear} onChange={(e) => setRvbInsuranceYear(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Closing costs (%)">
              <Input type="number" value={rvbClosingCostPct} onChange={(e) => setRvbClosingCostPct(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Selling costs (%)">
              <Input type="number" value={rvbSellingCostPct} onChange={(e) => setRvbSellingCostPct(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Alternative return (%)">
              <Input type="number" value={rvbInvestmentReturn} onChange={(e) => setRvbInvestmentReturn(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isRealEstate ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Purchase price">
              <Input type="number" value={rePurchasePrice} onChange={(e) => setRePurchasePrice(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly gross rent">
              <Input type="number" value={reMonthlyRent} onChange={(e) => setReMonthlyRent(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly expenses">
              <Input type="number" value={reMonthlyCosts} onChange={(e) => setReMonthlyCosts(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Vacancy rate (%)">
              <Input type="number" value={reVacancyRate} onChange={(e) => setReVacancyRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Hold period (years)">
              <Input type="number" value={reHoldYears} onChange={(e) => setReHoldYears(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Appreciation (%)">
              <Input type="number" value={reAppreciation} onChange={(e) => setReAppreciation(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Annual income">
              <Input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Monthly debt">
              <Input type="number" value={monthlyDebt} onChange={(e) => setMonthlyDebt(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Down payment">
              <Input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Rate (%)">
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Term (years)">
              <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Max DTI (%)">
              <Input type="number" value={maxDti} onChange={(e) => setMaxDti(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        )}
      </section>
      <ResultCard
        title={
          isRent
            ? "Rent estimate"
            : isRentVsBuy
              ? "Rent vs. buy estimate"
              : isRealEstate
                ? "Real-estate estimate"
                : "Affordability estimate"
        }
      >
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "affordability" && (
          <div className="space-y-2">
            <p>Housing budget (monthly): <span className="font-semibold">{formatCurrency(result.housingBudget)}</span></p>
            <p>Estimated loan size: <span className="font-semibold">{formatCurrency(result.loanAmount)}</span></p>
            <p>Estimated home price: <span className="font-semibold">{formatCurrency(result.homePrice)}</span></p>
          </div>
        )}
        {result?.mode === "rent" && (
          <div className="space-y-2">
            <p>Target housing budget: <span className="font-semibold">{formatCurrency(result.ratioBudget)}</span></p>
            <p>Estimated max rent: <span className="font-semibold">{formatCurrency(result.maxRent)}</span></p>
            <p>Discretionary cash after rent: <span className="font-semibold">{formatCurrency(result.discretionary)}</span></p>
          </div>
        )}
        {result?.mode === "rent-vs-buy" && (
          <div className="space-y-2">
            <p>Estimated owner monthly carrying cost: <span className="font-semibold">{formatCurrency(result.monthlyOwnerCost)}</span></p>
            <p>Total rent outflow: <span className="font-semibold">{formatCurrency(result.rentTotal)}</span></p>
            <p>Total buy net cost: <span className="font-semibold">{formatCurrency(result.netBuyCost)}</span></p>
            <p>
              Financially better:{" "}
              <span className="font-semibold">
                {result.decision === "tie" ? "Tie" : result.decision === "buy" ? "Buy" : "Rent"}
              </span>
            </p>
            <p>Cost spread: <span className="font-semibold">{formatCurrency(result.difference)}</span></p>
          </div>
        )}
        {result?.mode === "real-estate" && (
          <div className="space-y-2">
            <p>Monthly cash flow: <span className="font-semibold">{formatCurrency(result.monthlyCashFlow)}</span></p>
            <p>Annual NOI: <span className="font-semibold">{formatCurrency(result.annualNoi)}</span></p>
            <p>Cap rate: <span className="font-semibold">{formatNumber(result.capRate, 2)}%</span></p>
            <p>Projected value: <span className="font-semibold">{formatCurrency(result.projectedValue)}</span></p>
            <p>Total ROI (hold period): <span className="font-semibold">{formatNumber(result.roi, 2)}%</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function InflationPanel() {
  const [amount, setAmount] = useState("1000");
  const [annualRate, setAnnualRate] = useState("2.8");
  const [years, setYears] = useState("10");

  const result = useMemo(() => {
    const principal = parseNumber(amount);
    const rate = parseNumber(annualRate) / 100;
    const duration = parseNumber(years);
    if (principal < 0 || duration < 0) return null;
    const futureCost = principal * (1 + rate) ** duration;
    const purchasingPower = principal / (1 + rate) ** duration;
    return { futureCost, purchasingPower };
  }, [amount, annualRate, years]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount today">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
          <Field label="Annual inflation (%)">
            <Input type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
          <Field label="Years">
            <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
        </div>
      </section>
      <ResultCard title="Inflation output">
        {!result && <p>Enter valid values.</p>}
        {result && (
          <div className="space-y-2">
            <p>Equivalent future cost: <span className="font-semibold">{formatCurrency(result.futureCost)}</span></p>
            <p>Future purchasing power: <span className="font-semibold">{formatCurrency(result.purchasingPower)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function CurrencyPanel() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [output, setOutput] = useState<{ value: number; rate: number; date: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "SGD", "CHF"];

  const convert = async () => {
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const value = parseNumber(amount);
      const response = await fetch(
        `https://api.frankfurter.app/latest?amount=${encodeURIComponent(value)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!response.ok) {
        setError(`Rate request failed with status ${response.status}.`);
        return;
      }
      const data = (await response.json()) as { rates?: Record<string, number>; date?: string };
      const converted = data.rates?.[to];
      if (typeof converted !== "number") {
        setError("Rate response was incomplete.");
        return;
      }
      setOutput({
        value: converted,
        rate: value === 0 ? 0 : converted / value,
        date: data.date ?? "",
      });
    } catch {
      setError("Currency request failed. Check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void convert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
          <Field label="From">
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent>{currencyOptions.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="To">
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent>{currencyOptions.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <Button type="button" size="sm" className="h-9" onClick={() => void convert()} disabled={loading}>
            {loading ? "Converting..." : "Convert"}
          </Button>
        </div>
      </section>
      <ResultCard title="Conversion">
        {error && <p className="text-amber-500">{error}</p>}
        {!error && !output && <p>Run conversion to fetch the latest rate.</p>}
        {output && (
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-foreground">{formatNumber(output.value, 4)} {to}</p>
            <p>Rate: <span className="font-semibold">1 {from} = {formatNumber(output.rate, 6)} {to}</span></p>
            {output.date && <p>Rate date: <span className="font-semibold">{output.date}</span></p>}
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function CaloriePanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isBmr = title.includes("bmr");
  const isMacro = title.includes("macro");
  const isCarb = title.includes("carbohydrate");
  const isBurned = title.includes("calories burned");
  const isProtein = title.includes("protein");
  const isFatIntake = title.includes("fat intake");
  const isTdee = title.includes("tdee");
  const isWeightWatcher = title.includes("weight watcher");

  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("30");
  const [weight, setWeight] = useState("75");
  const [height, setHeight] = useState("178");
  const [activity, setActivity] = useState("1.55");
  const [proteinTarget, setProteinTarget] = useState("1.6");
  const [metValue, setMetValue] = useState("8");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [satFat, setSatFat] = useState("12");
  const [fiber, setFiber] = useState("8");
  const [wwCalories, setWwCalories] = useState("420");
  const [macroProteinPct, setMacroProteinPct] = useState("30");
  const [macroFatPct, setMacroFatPct] = useState("30");
  const [macroCarbPct, setMacroCarbPct] = useState("40");

  const result = useMemo<
    | { mode: "bmr"; bmr: number }
    | { mode: "tdee"; bmr: number; tdee: number }
    | { mode: "calorie"; bmr: number; tdee: number; cut: number; bulk: number }
    | { mode: "macro"; calories: number; proteinG: number; fatG: number; carbsG: number }
    | { mode: "carb"; lowG: number; highG: number; recommendedG: number }
    | { mode: "protein"; minimumG: number; targetG: number; highG: number }
    | { mode: "fat"; lowG: number; highG: number; saturatedLimitG: number }
    | { mode: "burned"; caloriesBurned: number }
    | { mode: "ww"; points: number; pointsRounded: number }
    | null
  >(() => {
    if (isWeightWatcher) {
      const calories = parseNumber(wwCalories);
      const sat = parseNumber(satFat);
      const fib = parseNumber(fiber);
      if (calories < 0 || sat < 0 || fib < 0) return null;
      const points = Math.max(0, calories / 50 + sat / 12 - Math.min(4, fib) / 5);
      return { mode: "ww", points, pointsRounded: Math.round(points * 10) / 10 };
    }

    if (isBurned) {
      const kg = parseNumber(weight);
      const minutes = parseNumber(durationMinutes);
      const met = parseNumber(metValue);
      if (kg <= 0 || minutes <= 0 || met <= 0) return null;
      return {
        mode: "burned",
        caloriesBurned: (minutes * met * kg) / 200,
      };
    }

    const ageN = parseNumber(age);
    const weightN = parseNumber(weight);
    const heightN = parseNumber(height);
    if (ageN <= 0 || weightN <= 0 || heightN <= 0) return null;

    const bmr =
      sex === "male"
        ? 10 * weightN + 6.25 * heightN - 5 * ageN + 5
        : 10 * weightN + 6.25 * heightN - 5 * ageN - 161;
    const tdee = bmr * parseNumber(activity);

    if (isBmr) {
      return { mode: "bmr", bmr };
    }
    if (isTdee) {
      return { mode: "tdee", bmr, tdee };
    }
    if (isProtein) {
      const gPerKg = parseNumber(proteinTarget);
      if (gPerKg <= 0) return null;
      const targetG = weightN * gPerKg;
      return {
        mode: "protein",
        minimumG: weightN * 0.8,
        targetG,
        highG: weightN * 2,
      };
    }
    if (isFatIntake) {
      return {
        mode: "fat",
        lowG: (tdee * 0.2) / 9,
        highG: (tdee * 0.35) / 9,
        saturatedLimitG: (tdee * 0.1) / 9,
      };
    }
    if (isCarb) {
      return {
        mode: "carb",
        lowG: (tdee * 0.45) / 4,
        highG: (tdee * 0.65) / 4,
        recommendedG: (tdee * 0.55) / 4,
      };
    }
    if (isMacro) {
      const p = Math.max(0, parseNumber(macroProteinPct));
      const f = Math.max(0, parseNumber(macroFatPct));
      const c = Math.max(0, parseNumber(macroCarbPct));
      const total = p + f + c;
      if (total <= 0) return null;
      const np = p / total;
      const nf = f / total;
      const nc = c / total;
      return {
        mode: "macro",
        calories: tdee,
        proteinG: (tdee * np) / 4,
        fatG: (tdee * nf) / 9,
        carbsG: (tdee * nc) / 4,
      };
    }

    return {
      mode: "calorie",
      bmr,
      tdee,
      cut: tdee - 500,
      bulk: tdee + 300,
    };
  }, [
    activity,
    age,
    durationMinutes,
    fiber,
    height,
    isBmr,
    isBurned,
    isCarb,
    isFatIntake,
    isMacro,
    isProtein,
    isTdee,
    isWeightWatcher,
    macroCarbPct,
    macroFatPct,
    macroProteinPct,
    metValue,
    proteinTarget,
    satFat,
    sex,
    weight,
    wwCalories,
  ]);

  const caloriesTitle = isBmr
    ? "BMR estimate"
    : isTdee
      ? "TDEE estimate"
      : isBurned
        ? "Calories burned estimate"
        : isWeightWatcher
          ? "Points estimate"
          : isProtein
            ? "Protein estimate"
            : isFatIntake
              ? "Fat intake estimate"
              : isCarb
                ? "Carbohydrate estimate"
                : isMacro
                  ? "Macro estimate"
                  : "Calorie estimate";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isBurned ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Weight (kg)">
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Duration (minutes)">
              <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="MET value">
              <Select value={metValue} onValueChange={setMetValue}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Walking (3.0)</SelectItem>
                  <SelectItem value="5">Cycling light (5.0)</SelectItem>
                  <SelectItem value="6">Jogging light (6.0)</SelectItem>
                  <SelectItem value="8">Running moderate (8.0)</SelectItem>
                  <SelectItem value="10">Running fast (10.0)</SelectItem>
                  <SelectItem value="11">Jump rope (11.0)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isWeightWatcher ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Calories">
              <Input type="number" value={wwCalories} onChange={(e) => setWwCalories(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Saturated fat (g)">
              <Input type="number" value={satFat} onChange={(e) => setSatFat(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Fiber (g)">
              <Input type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sex">
                <Select value={sex} onValueChange={(value) => setSex(value as "male" | "female")}>
                  <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Activity factor">
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.2">Sedentary</SelectItem>
                    <SelectItem value="1.375">Light</SelectItem>
                    <SelectItem value="1.55">Moderate</SelectItem>
                    <SelectItem value="1.725">Very active</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Age">
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
              <Field label="Weight (kg)">
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
              <Field label="Height (cm)">
                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            </div>
            {isProtein && (
              <div className="mt-3 max-w-sm">
                <Field label="Protein target (g/kg/day)">
                  <Select value={proteinTarget} onValueChange={setProteinTarget}>
                    <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">Sedentary (0.8)</SelectItem>
                      <SelectItem value="1.2">Light training (1.2)</SelectItem>
                      <SelectItem value="1.6">Active training (1.6)</SelectItem>
                      <SelectItem value="2.0">Athletic high (2.0)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
            {isMacro && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Protein (%)">
                  <Input type="number" value={macroProteinPct} onChange={(e) => setMacroProteinPct(e.target.value)} className="border-border/80 bg-background/80" />
                </Field>
                <Field label="Fat (%)">
                  <Input type="number" value={macroFatPct} onChange={(e) => setMacroFatPct(e.target.value)} className="border-border/80 bg-background/80" />
                </Field>
                <Field label="Carbs (%)">
                  <Input type="number" value={macroCarbPct} onChange={(e) => setMacroCarbPct(e.target.value)} className="border-border/80 bg-background/80" />
                </Field>
              </div>
            )}
          </>
        )}
      </section>
      <ResultCard title={caloriesTitle}>
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "bmr" && (
          <p>BMR: <span className="font-semibold">{formatNumber(result.bmr, 0)} kcal/day</span></p>
        )}
        {result?.mode === "tdee" && (
          <div className="space-y-2">
            <p>BMR: <span className="font-semibold">{formatNumber(result.bmr, 0)} kcal/day</span></p>
            <p>TDEE: <span className="font-semibold">{formatNumber(result.tdee, 0)} kcal/day</span></p>
          </div>
        )}
        {result?.mode === "calorie" && (
          <div className="space-y-2">
            <p>BMR: <span className="font-semibold">{formatNumber(result.bmr, 0)} kcal/day</span></p>
            <p>Maintenance (TDEE): <span className="font-semibold">{formatNumber(result.tdee, 0)} kcal/day</span></p>
            <p>Cut target: <span className="font-semibold">{formatNumber(result.cut, 0)} kcal/day</span></p>
            <p>Bulk target: <span className="font-semibold">{formatNumber(result.bulk, 0)} kcal/day</span></p>
          </div>
        )}
        {result?.mode === "macro" && (
          <div className="space-y-2">
            <p>Calories used: <span className="font-semibold">{formatNumber(result.calories, 0)} kcal/day</span></p>
            <p>Protein: <span className="font-semibold">{formatNumber(result.proteinG, 0)} g/day</span></p>
            <p>Fat: <span className="font-semibold">{formatNumber(result.fatG, 0)} g/day</span></p>
            <p>Carbs: <span className="font-semibold">{formatNumber(result.carbsG, 0)} g/day</span></p>
          </div>
        )}
        {result?.mode === "carb" && (
          <div className="space-y-2">
            <p>Suggested range (45-65%): <span className="font-semibold">{formatNumber(result.lowG, 0)} - {formatNumber(result.highG, 0)} g/day</span></p>
            <p>Mid target (~55%): <span className="font-semibold">{formatNumber(result.recommendedG, 0)} g/day</span></p>
          </div>
        )}
        {result?.mode === "protein" && (
          <div className="space-y-2">
            <p>Minimum (RDA): <span className="font-semibold">{formatNumber(result.minimumG, 0)} g/day</span></p>
            <p>Target: <span className="font-semibold">{formatNumber(result.targetG, 0)} g/day</span></p>
            <p>High athletic range: <span className="font-semibold">{formatNumber(result.highG, 0)} g/day</span></p>
          </div>
        )}
        {result?.mode === "fat" && (
          <div className="space-y-2">
            <p>Suggested range (20-35%): <span className="font-semibold">{formatNumber(result.lowG, 0)} - {formatNumber(result.highG, 0)} g/day</span></p>
            <p>Saturated fat upper limit (~10%): <span className="font-semibold">{formatNumber(result.saturatedLimitG, 0)} g/day</span></p>
          </div>
        )}
        {result?.mode === "burned" && (
          <p>Estimated calories burned: <span className="font-semibold">{formatNumber(result.caloriesBurned, 0)} kcal</span></p>
        )}
        {result?.mode === "ww" && (
          <div className="space-y-2">
            <p>Points estimate: <span className="font-semibold">{formatNumber(result.pointsRounded, 1)}</span></p>
            <p className="text-muted-foreground">Legacy-style estimate from calories, saturated fat, and fiber.</p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function BodyFatPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isGfr = title.includes("gfr");
  const isBac = title.includes("bac");
  const isBsa = title.includes("body surface area");
  const isLean = title.includes("lean body mass");
  const isBodyType = title.includes("body type");
  const isArmy = title.includes("army body fat");

  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("35");
  const [heightCm, setHeightCm] = useState("178");
  const [weightKg, setWeightKg] = useState("78");
  const [neckCm, setNeckCm] = useState("38");
  const [waistCm, setWaistCm] = useState("88");
  const [hipCm, setHipCm] = useState("98");
  const [creatinine, setCreatinine] = useState("1");
  const [raceBlack, setRaceBlack] = useState(false);
  const [drinks, setDrinks] = useState("3");
  const [drinkSizeOz, setDrinkSizeOz] = useState("12");
  const [abv, setAbv] = useState("5");
  const [hoursElapsed, setHoursElapsed] = useState("2");

  const result = useMemo<
    | {
        mode: "body-fat";
        bodyFat: number;
        leanMassKg: number;
        category: string;
        armyPass: string | null;
      }
    | { mode: "lean"; leanMassKg: number; fatFreeMassIndex: number }
    | { mode: "bsa"; mosteller: number; dubois: number; haycock: number }
    | { mode: "body-type"; ratio: number; category: string }
    | { mode: "gfr"; ckdEpi: number; mdrd: number; stage: string }
    | { mode: "bac"; bac: number; status: string }
    | null
  >(() => {
    if (isGfr) {
      const scr = parseNumber(creatinine);
      const ageN = parseNumber(age);
      if (scr <= 0 || ageN <= 0) return null;
      const k = sex === "female" ? 0.7 : 0.9;
      const alpha = sex === "female" ? -0.329 : -0.411;
      const sexFactor = sex === "female" ? 1.018 : 1;
      const raceFactor = raceBlack ? 1.159 : 1;
      const scrByK = scr / k;
      const ckdEpi =
        141 *
        Math.min(scrByK, 1) ** alpha *
        Math.max(scrByK, 1) ** -1.209 *
        0.993 ** ageN *
        sexFactor *
        raceFactor;
      const mdrd =
        175 *
        scr ** -1.154 *
        ageN ** -0.203 *
        (sex === "female" ? 0.742 : 1) *
        (raceBlack ? 1.212 : 1);
      const stage =
        ckdEpi >= 90
          ? "G1 (normal/high)"
          : ckdEpi >= 60
            ? "G2 (mildly decreased)"
            : ckdEpi >= 45
              ? "G3a (mild-moderate)"
              : ckdEpi >= 30
                ? "G3b (moderate-severe)"
                : ckdEpi >= 15
                  ? "G4 (severely decreased)"
                  : "G5 (kidney failure)";
      return { mode: "gfr", ckdEpi, mdrd, stage };
    }

    if (isBac) {
      const weight = parseNumber(weightKg);
      const drinksN = parseNumber(drinks);
      const sizeOz = parseNumber(drinkSizeOz);
      const abvPct = parseNumber(abv);
      const elapsed = parseNumber(hoursElapsed);
      if (weight <= 0 || drinksN < 0 || sizeOz <= 0 || abvPct <= 0 || elapsed < 0) return null;
      const alcoholMl = drinksN * sizeOz * 29.5735 * (abvPct / 100);
      const alcoholGrams = alcoholMl * 0.789;
      const r = sex === "male" ? 0.68 : 0.55;
      const bac = Math.max(0, (alcoholGrams / (weight * 1000 * r)) * 100 - 0.015 * elapsed);
      const status =
        bac < 0.03
          ? "Minimal impairment"
          : bac < 0.08
            ? "Impairment likely"
            : bac < 0.2
              ? "Legally intoxicated in many regions"
              : "Severe impairment risk";
      return { mode: "bac", bac, status };
    }

    if (isBsa) {
      const weight = parseNumber(weightKg);
      const height = parseNumber(heightCm);
      if (weight <= 0 || height <= 0) return null;
      return {
        mode: "bsa",
        mosteller: Math.sqrt((weight * height) / 3600),
        dubois: 0.007184 * weight ** 0.425 * height ** 0.725,
        haycock: 0.024265 * weight ** 0.5378 * height ** 0.3964,
      };
    }

    if (isLean) {
      const weight = parseNumber(weightKg);
      const height = parseNumber(heightCm);
      if (weight <= 0 || height <= 0) return null;
      const leanMassKg =
        sex === "male"
          ? 0.407 * weight + 0.267 * height - 19.2
          : 0.252 * weight + 0.473 * height - 48.3;
      const fatFreeMassIndex = leanMassKg / (height / 100) ** 2;
      return { mode: "lean", leanMassKg, fatFreeMassIndex };
    }

    if (isBodyType) {
      const waist = parseNumber(waistCm);
      const height = parseNumber(heightCm);
      if (waist <= 0 || height <= 0) return null;
      const ratio = waist / height;
      const category =
        ratio < 0.4
          ? "Slim build"
          : ratio < 0.47
            ? "Fit/average"
            : ratio < 0.53
              ? "Central fat tendency"
              : "Higher central-adiposity risk";
      return { mode: "body-type", ratio, category };
    }

    const hIn = parseNumber(heightCm) / 2.54;
    const nIn = parseNumber(neckCm) / 2.54;
    const wIn = parseNumber(waistCm) / 2.54;
    const hipIn = parseNumber(hipCm) / 2.54;
    const weight = parseNumber(weightKg);
    if (hIn <= 0 || nIn <= 0 || wIn <= 0 || weight <= 0) return null;

    let bodyFat = 0;
    if (sex === "male") {
      const x = wIn - nIn;
      if (x <= 0) return null;
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(x) + 0.15456 * Math.log10(hIn)) - 450;
    } else {
      const x = wIn + hipIn - nIn;
      if (x <= 0 || hipIn <= 0) return null;
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(x) + 0.221 * Math.log10(hIn)) - 450;
    }
    const leanMassKg = weight * (1 - bodyFat / 100);
    const category =
      sex === "male"
        ? bodyFat < 6
          ? "Essential range"
          : bodyFat < 14
            ? "Athletic"
            : bodyFat < 18
              ? "Fit"
              : bodyFat < 25
                ? "Average"
                : "High"
        : bodyFat < 14
          ? "Essential range"
          : bodyFat < 21
            ? "Athletic"
            : bodyFat < 25
              ? "Fit"
              : bodyFat < 32
                ? "Average"
                : "High";
    let armyPass: string | null = null;
    if (isArmy) {
      const ageN = parseNumber(age);
      if (ageN > 0) {
        if (sex === "male") {
          const limit = ageN <= 20 ? 20 : ageN <= 27 ? 22 : ageN <= 39 ? 24 : 26;
          armyPass = bodyFat <= limit ? `Within Army limit (<= ${limit}%)` : `Above Army limit (${limit}%)`;
        } else {
          const limit = ageN <= 20 ? 30 : ageN <= 27 ? 32 : ageN <= 39 ? 34 : 36;
          armyPass = bodyFat <= limit ? `Within Army limit (<= ${limit}%)` : `Above Army limit (${limit}%)`;
        }
      }
    }
    return { mode: "body-fat", bodyFat, leanMassKg, category, armyPass };
  }, [
    abv,
    age,
    creatinine,
    drinkSizeOz,
    drinks,
    heightCm,
    hipCm,
    hoursElapsed,
    isArmy,
    isBac,
    isBodyType,
    isBsa,
    isGfr,
    isLean,
    neckCm,
    raceBlack,
    sex,
    waistCm,
    weightKg,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isGfr ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sex">
              <Select value={sex} onValueChange={(value) => setSex(value as "male" | "female")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Age">
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Serum creatinine (mg/dL)">
              <Input type="number" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <label className="mt-7 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={raceBlack} onChange={(e) => setRaceBlack(e.target.checked)} />
              Black race factor (legacy equations)
            </label>
          </div>
        ) : isBac ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sex">
              <Select value={sex} onValueChange={(value) => setSex(value as "male" | "female")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Body weight (kg)">
              <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Number of drinks">
              <Input type="number" value={drinks} onChange={(e) => setDrinks(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Drink size (fl oz)">
              <Input type="number" value={drinkSizeOz} onChange={(e) => setDrinkSizeOz(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="ABV (%)">
              <Input type="number" value={abv} onChange={(e) => setAbv(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Hours since first drink">
              <Input type="number" value={hoursElapsed} onChange={(e) => setHoursElapsed(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isBsa || isLean ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sex">
              <Select value={sex} onValueChange={(value) => setSex(value as "male" | "female")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isBodyType ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Waist (cm)">
              <Input type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sex">
              <Select value={sex} onValueChange={(value) => setSex(value as "male" | "female")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {isArmy && (
              <Field label="Age">
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            )}
            <Field label="Weight (kg)">
              <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Neck (cm)">
              <Input type="number" value={neckCm} onChange={(e) => setNeckCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Waist (cm)">
              <Input type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            {sex === "female" && (
              <Field label="Hip (cm)">
                <Input type="number" value={hipCm} onChange={(e) => setHipCm(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            )}
          </div>
        )}
      </section>
      <ResultCard title={calculator.title}>
        {!result && <p>Enter valid measurements.</p>}
        {result?.mode === "body-fat" && (
          <div className="space-y-2">
            <p>Body fat: <span className="font-semibold">{formatNumber(result.bodyFat, 2)}%</span></p>
            <p>Lean mass estimate: <span className="font-semibold">{formatNumber(result.leanMassKg, 1)} kg</span></p>
            <p>Category: <span className="font-semibold">{result.category}</span></p>
            {result.armyPass && <p>{result.armyPass}</p>}
          </div>
        )}
        {result?.mode === "lean" && (
          <div className="space-y-2">
            <p>Lean body mass: <span className="font-semibold">{formatNumber(result.leanMassKg, 2)} kg</span></p>
            <p>FFMI: <span className="font-semibold">{formatNumber(result.fatFreeMassIndex, 2)}</span></p>
          </div>
        )}
        {result?.mode === "bsa" && (
          <div className="space-y-2">
            <p>Mosteller BSA: <span className="font-semibold">{formatNumber(result.mosteller, 3)} m²</span></p>
            <p>Du Bois BSA: <span className="font-semibold">{formatNumber(result.dubois, 3)} m²</span></p>
            <p>Haycock BSA: <span className="font-semibold">{formatNumber(result.haycock, 3)} m²</span></p>
          </div>
        )}
        {result?.mode === "body-type" && (
          <div className="space-y-2">
            <p>Waist-to-height ratio: <span className="font-semibold">{formatNumber(result.ratio, 3)}</span></p>
            <p>Body type signal: <span className="font-semibold">{result.category}</span></p>
          </div>
        )}
        {result?.mode === "gfr" && (
          <div className="space-y-2">
            <p>CKD-EPI eGFR: <span className="font-semibold">{formatNumber(result.ckdEpi, 1)} mL/min/1.73m²</span></p>
            <p>MDRD eGFR: <span className="font-semibold">{formatNumber(result.mdrd, 1)} mL/min/1.73m²</span></p>
            <p>CKD stage estimate: <span className="font-semibold">{result.stage}</span></p>
          </div>
        )}
        {result?.mode === "bac" && (
          <div className="space-y-2">
            <p>BAC estimate: <span className="font-semibold">{formatNumber(result.bac, 3)}%</span></p>
            <p>Status: <span className="font-semibold">{result.status}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function PregnancyPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isWeightGain = title.includes("weight gain");
  const isPeriod = title.includes("period");
  const isOvulation = title.includes("ovulation");
  const isDueDate = title.includes("due date");
  const isConception = title.includes("conception");

  const [lmpDate, setLmpDate] = useState(new Date().toISOString().slice(0, 10));
  const [cycleLength, setCycleLength] = useState("28");
  const [periodLength, setPeriodLength] = useState("5");
  const [preWeightKg, setPreWeightKg] = useState("68");
  const [preHeightCm, setPreHeightCm] = useState("165");
  const [currentWeek, setCurrentWeek] = useState("20");
  const [currentWeightKg, setCurrentWeightKg] = useState("74");

  const toIso = (date: Date) => date.toISOString().slice(0, 10);

  const result = useMemo<
    | {
        mode: "timeline";
        due: string;
        ovulation: string;
        fertileStart: string;
        fertileEnd: string;
        conception: string;
        nextPeriod: string;
        nextPeriodEnd: string;
        weeks: number;
        trimester: string;
      }
    | {
        mode: "weight-gain";
        preBmi: number;
        bmiClass: string;
        totalMin: number;
        totalMax: number;
        weekMin: number;
        weekMax: number;
        targetWeightMin: number;
        targetWeightMax: number;
        status: string;
      }
    | null
  >(() => {
    if (isWeightGain) {
      const weight = parseNumber(preWeightKg);
      const height = parseNumber(preHeightCm);
      const week = Math.max(0, Math.round(parseNumber(currentWeek)));
      const currentWeight = parseNumber(currentWeightKg);
      if (weight <= 0 || height <= 0) return null;

      const bmi = weight / (height / 100) ** 2;
      const ranges =
        bmi < 18.5
          ? { bmiClass: "Underweight", totalMin: 12.5, totalMax: 18, weekMin: 0.44, weekMax: 0.58 }
          : bmi < 25
            ? { bmiClass: "Normal", totalMin: 11.5, totalMax: 16, weekMin: 0.35, weekMax: 0.5 }
            : bmi < 30
              ? { bmiClass: "Overweight", totalMin: 7, totalMax: 11.5, weekMin: 0.23, weekMax: 0.33 }
              : { bmiClass: "Obese", totalMin: 5, totalMax: 9, weekMin: 0.17, weekMax: 0.27 };
      const firstTrimesterMin = 0.5;
      const firstTrimesterMax = 2;
      const weekMin =
        week <= 13
          ? (week / 13) * firstTrimesterMin
          : firstTrimesterMin + ranges.weekMin * (week - 13);
      const weekMax =
        week <= 13
          ? (week / 13) * firstTrimesterMax
          : firstTrimesterMax + ranges.weekMax * (week - 13);
      const targetWeightMin = weight + weekMin;
      const targetWeightMax = weight + weekMax;
      const status =
        currentWeight <= 0
          ? "Enter current weight for comparison."
          : currentWeight < targetWeightMin
            ? "Below recommended range."
            : currentWeight > targetWeightMax
              ? "Above recommended range."
              : "Within recommended range.";

      return {
        mode: "weight-gain",
        preBmi: bmi,
        bmiClass: ranges.bmiClass,
        totalMin: ranges.totalMin,
        totalMax: ranges.totalMax,
        weekMin,
        weekMax,
        targetWeightMin,
        targetWeightMax,
        status,
      };
    }

    const lmp = new Date(`${lmpDate}T00:00:00`);
    if (Number.isNaN(lmp.getTime())) return null;
    const cycle = clamp(Math.round(parseNumber(cycleLength)), 20, 44);
    const bleedDays = clamp(Math.round(parseNumber(periodLength)), 1, 10);

    const due = new Date(lmp);
    due.setDate(due.getDate() + 280 + (cycle - 28));
    const ovulation = new Date(lmp);
    ovulation.setDate(ovulation.getDate() + (cycle - 14));
    const conception = new Date(ovulation);
    const fertileStart = new Date(ovulation);
    fertileStart.setDate(ovulation.getDate() - 5);
    const fertileEnd = new Date(ovulation);
    fertileEnd.setDate(ovulation.getDate() + 1);
    const nextPeriod = new Date(lmp);
    nextPeriod.setDate(nextPeriod.getDate() + cycle);
    const nextPeriodEnd = new Date(nextPeriod);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + bleedDays - 1);

    const today = new Date();
    const weeks = Math.max(0, Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7)));
    const trimester = weeks < 14 ? "First trimester" : weeks < 28 ? "Second trimester" : "Third trimester";

    return {
      mode: "timeline",
      due: toIso(due),
      ovulation: toIso(ovulation),
      fertileStart: toIso(fertileStart),
      fertileEnd: toIso(fertileEnd),
      conception: toIso(conception),
      nextPeriod: toIso(nextPeriod),
      nextPeriodEnd: toIso(nextPeriodEnd),
      weeks,
      trimester,
    };
  }, [
    currentWeek,
    currentWeightKg,
    cycleLength,
    isWeightGain,
    lmpDate,
    periodLength,
    preHeightCm,
    preWeightKg,
  ]);

  const panelTitle = isWeightGain
    ? "Pregnancy weight gain estimate"
    : isPeriod
      ? "Period and ovulation estimate"
      : isOvulation
        ? "Ovulation estimate"
        : isDueDate
          ? "Due date estimate"
          : isConception
            ? "Conception estimate"
            : "Pregnancy timeline estimate";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isWeightGain ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pre-pregnancy weight (kg)">
              <Input type="number" value={preWeightKg} onChange={(e) => setPreWeightKg(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" value={preHeightCm} onChange={(e) => setPreHeightCm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Current pregnancy week">
              <Input type="number" value={currentWeek} onChange={(e) => setCurrentWeek(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Current weight (kg)">
              <Input type="number" value={currentWeightKg} onChange={(e) => setCurrentWeightKg(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="LMP date">
              <Input type="date" value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Cycle length (days)">
              <Input type="number" min="20" max="44" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Period length (days)">
              <Input type="number" min="1" max="10" value={periodLength} onChange={(e) => setPeriodLength(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        )}
      </section>
      <ResultCard title={panelTitle}>
        {!result && <p>Enter valid dates and values.</p>}
        {result?.mode === "timeline" && (
          <div className="space-y-2">
            {(isDueDate || (!isPeriod && !isOvulation && !isConception)) && (
              <p>Estimated due date: <span className="font-semibold">{result.due}</span></p>
            )}
            {(isOvulation || isConception || isPeriod || (!isDueDate && !isWeightGain)) && (
              <>
                <p>Estimated ovulation: <span className="font-semibold">{result.ovulation}</span></p>
                <p>Fertile window: <span className="font-semibold">{result.fertileStart} to {result.fertileEnd}</span></p>
                <p>Estimated conception day: <span className="font-semibold">{result.conception}</span></p>
              </>
            )}
            {isPeriod && (
              <>
                <p>Next period start: <span className="font-semibold">{result.nextPeriod}</span></p>
                <p>Next period end: <span className="font-semibold">{result.nextPeriodEnd}</span></p>
              </>
            )}
            {!isWeightGain && (
              <p>Weeks from LMP today: <span className="font-semibold">{result.weeks} weeks ({result.trimester})</span></p>
            )}
          </div>
        )}
        {result?.mode === "weight-gain" && (
          <div className="space-y-2">
            <p>Pre-pregnancy BMI: <span className="font-semibold">{formatNumber(result.preBmi, 2)} ({result.bmiClass})</span></p>
            <p>Total recommended gain: <span className="font-semibold">{formatNumber(result.totalMin, 1)} - {formatNumber(result.totalMax, 1)} kg</span></p>
            <p>Week-specific gain target: <span className="font-semibold">{formatNumber(result.weekMin, 1)} - {formatNumber(result.weekMax, 1)} kg</span></p>
            <p>Target weight now: <span className="font-semibold">{formatNumber(result.targetWeightMin, 1)} - {formatNumber(result.targetWeightMax, 1)} kg</span></p>
            <p>Status: <span className="font-semibold">{result.status}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function PacePanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const [distanceKm, setDistanceKm] = useState("10");
  const [timeMinutes, setTimeMinutes] = useState("50");
  const [weight, setWeight] = useState("100");
  const [reps, setReps] = useState("5");
  const [age, setAge] = useState("30");

  const result = useMemo(() => {
    if (title.includes("one rep")) {
      const w = parseNumber(weight);
      const r = parseNumber(reps);
      if (w <= 0 || r <= 0) return null;
      return { mode: "orm", value: w * (1 + r / 30) } as const;
    }
    if (title.includes("heart rate")) {
      const a = parseNumber(age);
      if (a <= 0) return null;
      const maxHr = 220 - a;
      return {
        mode: "hr",
        maxHr,
        low: maxHr * 0.5,
        high: maxHr * 0.85,
      } as const;
    }

    const distance = parseNumber(distanceKm);
    const minutes = parseNumber(timeMinutes);
    if (distance <= 0 || minutes <= 0) return null;
    const pace = minutes / distance;
    const speed = distance / (minutes / 60);
    return { mode: "pace", pace, speed } as const;
  }, [age, distanceKm, reps, timeMinutes, title, weight]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {title.includes("one rep") ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Lifted weight">
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Reps completed">
              <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : title.includes("heart rate") ? (
          <div className="max-w-xs">
            <Field label="Age">
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Distance (km)">
              <Input type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Time (minutes)">
              <Input type="number" value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        )}
      </section>
      <ResultCard title="Fitness output">
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "pace" && (
          <div className="space-y-2">
            <p>Pace: <span className="font-semibold">{formatNumber(result.pace, 2)} min/km</span></p>
            <p>Speed: <span className="font-semibold">{formatNumber(result.speed, 2)} km/h</span></p>
          </div>
        )}
        {result?.mode === "orm" && <p>Estimated 1RM: <span className="font-semibold">{formatNumber(result.value, 1)}</span></p>}
        {result?.mode === "hr" && (
          <div className="space-y-2">
            <p>Max heart rate: <span className="font-semibold">{formatNumber(result.maxHr, 0)} bpm</span></p>
            <p>Target zone: <span className="font-semibold">{formatNumber(result.low, 0)} - {formatNumber(result.high, 0)} bpm</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function safeEvaluateExpression(raw: string): number | null {
  const expression = raw.trim().replace(/\^/g, "**");
  if (!expression) return null;
  if (!/^[0-9+\-*/().,%\s*]+$/.test(expression)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`\"use strict\"; return (${expression});`)();
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function gcdInt(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcmInt(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((Math.trunc(a) * Math.trunc(b)) / gcdInt(a, b));
}

function listFactors(n: number): number[] {
  const value = Math.abs(Math.trunc(n));
  if (value === 0) return [];
  const factors: number[] = [];
  for (let i = 1; i <= Math.floor(Math.sqrt(value)); i += 1) {
    if (value % i === 0) {
      factors.push(i);
      if (i !== value / i) factors.push(value / i);
    }
  }
  return factors.sort((a, b) => a - b);
}

function primeFactors(n: number): number[] {
  let value = Math.abs(Math.trunc(n));
  if (value < 2) return [value];
  const factors: number[] = [];
  while (value % 2 === 0) {
    factors.push(2);
    value /= 2;
  }
  for (let i = 3; i * i <= value; i += 2) {
    while (value % i === 0) {
      factors.push(i);
      value /= i;
    }
  }
  if (value > 1) factors.push(value);
  return factors;
}

function ScientificPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isFraction = title.includes("fraction");
  const isExponent = title.includes("exponent");
  const isQuadratic = title.includes("quadratic");
  const isLog = title.includes("log calculator");
  const isRoot = title.includes("root calculator");
  const isLcm = title.includes("least common multiple");
  const isGcf = title.includes("greatest common factor") || title.includes("common factor");
  const isFactor = title.includes("factor calculator");
  const isPrimeFactorization = title.includes("prime factorization");
  const isRounding = title.includes("rounding");
  const isMatrix = title.includes("matrix");
  const isSciNotation = title.includes("scientific notation");
  const isBigNumber = title.includes("big number");
  const isBinary = title.includes("binary");
  const isHex = title.includes("hex");
  const isLongDivision = title.includes("long division");

  const [expression, setExpression] = useState("((12 + 8) * 3) / 4");
  const [valueA, setValueA] = useState("12");
  const [valueB, setValueB] = useState("8");
  const [valueC, setValueC] = useState("2");
  const [valueD, setValueD] = useState("1");
  const [textValue, setTextValue] = useState("10101");
  const [roundPlaces, setRoundPlaces] = useState("2");
  const [bigMode, setBigMode] = useState<"add" | "subtract" | "multiply">("add");

  const result = useMemo<
    | { mode: "expression"; value: number }
    | { mode: "fraction"; reducedN: number; reducedD: number; decimal: number; whole: number; remainder: number }
    | { mode: "exponent"; value: number }
    | { mode: "quadratic"; discriminant: number; root1: string; root2: string }
    | { mode: "log"; value: number }
    | { mode: "root"; value: number }
    | { mode: "lcmgcf"; gcf: number; lcm: number }
    | { mode: "factor"; factors: number[] }
    | { mode: "prime"; factors: number[] }
    | { mode: "rounding"; rounded: number; floor: number; ceil: number }
    | { mode: "matrix"; determinant: number; inverse: string | null }
    | { mode: "notation"; scientific: string; engineering: string }
    | { mode: "big"; result: string }
    | { mode: "base"; decimal: number; binary: string; hex: string }
    | { mode: "long-division"; quotient: number; remainder: number }
    | null
  >(() => {
    if (isFraction) {
      const n = Math.trunc(parseNumber(valueA));
      const d = Math.trunc(parseNumber(valueB));
      if (d === 0) return null;
      const g = gcdInt(n, d);
      const reducedN = n / g;
      const reducedD = d / g;
      const decimal = n / d;
      return {
        mode: "fraction",
        reducedN,
        reducedD,
        decimal,
        whole: Math.trunc(decimal),
        remainder: Math.abs(reducedN % reducedD),
      };
    }
    if (isExponent) {
      const base = parseNumber(valueA);
      const exp = parseNumber(valueB);
      const v = base ** exp;
      return Number.isFinite(v) ? { mode: "exponent", value: v } : null;
    }
    if (isQuadratic) {
      const a = parseNumber(valueA);
      const b = parseNumber(valueB);
      const c = parseNumber(valueC);
      if (a === 0) return null;
      const d = b * b - 4 * a * c;
      if (d >= 0) {
        const sqrtD = Math.sqrt(d);
        const r1 = (-b + sqrtD) / (2 * a);
        const r2 = (-b - sqrtD) / (2 * a);
        return {
          mode: "quadratic",
          discriminant: d,
          root1: formatNumber(r1, 8),
          root2: formatNumber(r2, 8),
        };
      }
      const real = -b / (2 * a);
      const imag = Math.sqrt(-d) / (2 * a);
      return {
        mode: "quadratic",
        discriminant: d,
        root1: `${formatNumber(real, 6)} + ${formatNumber(imag, 6)}i`,
        root2: `${formatNumber(real, 6)} - ${formatNumber(imag, 6)}i`,
      };
    }
    if (isLog) {
      const n = parseNumber(valueA);
      const base = parseNumber(valueB);
      if (n <= 0 || base <= 0 || base === 1) return null;
      return { mode: "log", value: Math.log(n) / Math.log(base) };
    }
    if (isRoot) {
      const n = parseNumber(valueA);
      const degree = parseNumber(valueB);
      if (degree === 0) return null;
      if (n < 0 && Math.abs(degree % 2) < 1e-9) return null;
      const value = n < 0 ? -((-n) ** (1 / degree)) : n ** (1 / degree);
      return Number.isFinite(value) ? { mode: "root", value } : null;
    }
    if (isLcm || isGcf) {
      const a = Math.trunc(parseNumber(valueA));
      const b = Math.trunc(parseNumber(valueB));
      if (a === 0 && b === 0) return null;
      return { mode: "lcmgcf", gcf: gcdInt(a, b), lcm: lcmInt(a, b) };
    }
    if (isPrimeFactorization) {
      const n = Math.trunc(parseNumber(valueA));
      if (n === 0) return null;
      return { mode: "prime", factors: primeFactors(n) };
    }
    if (isFactor) {
      const n = Math.trunc(parseNumber(valueA));
      if (n === 0) return null;
      return { mode: "factor", factors: listFactors(n) };
    }
    if (isRounding) {
      const n = parseNumber(valueA);
      const places = Math.max(0, Math.round(parseNumber(roundPlaces)));
      const p = 10 ** places;
      return {
        mode: "rounding",
        rounded: Math.round(n * p) / p,
        floor: Math.floor(n),
        ceil: Math.ceil(n),
      };
    }
    if (isMatrix) {
      const m11 = parseNumber(valueA);
      const m12 = parseNumber(valueB);
      const m21 = parseNumber(valueC);
      const m22 = parseNumber(valueD);
      const det = m11 * m22 - m12 * m21;
      if (det === 0) return { mode: "matrix", determinant: det, inverse: null };
      const inv = `[[${formatNumber(m22 / det, 6)}, ${formatNumber(-m12 / det, 6)}], [${formatNumber(-m21 / det, 6)}, ${formatNumber(m11 / det, 6)}]]`;
      return { mode: "matrix", determinant: det, inverse: inv };
    }
    if (isSciNotation) {
      const n = parseNumber(valueA);
      if (!Number.isFinite(n)) return null;
      const scientific = n.toExponential(6);
      const exp = Number(scientific.split("e")[1] ?? "0");
      const engExp = Math.floor(exp / 3) * 3;
      const engMantissa = n / 10 ** engExp;
      return {
        mode: "notation",
        scientific,
        engineering: `${formatNumber(engMantissa, 6)}e${engExp >= 0 ? "+" : ""}${engExp}`,
      };
    }
    if (isBigNumber) {
      try {
        const a = BigInt(valueA.trim());
        const b = BigInt(valueB.trim());
        const resultText =
          bigMode === "add"
            ? (a + b).toString()
            : bigMode === "subtract"
              ? (a - b).toString()
              : (a * b).toString();
        return { mode: "big", result: resultText };
      } catch {
        return null;
      }
    }
    if (isBinary || isHex) {
      const base = isBinary ? 2 : 16;
      const clean = textValue.trim();
      if (!clean) return null;
      const decimal = Number.parseInt(clean, base);
      if (!Number.isFinite(decimal)) return null;
      return {
        mode: "base",
        decimal,
        binary: decimal.toString(2),
        hex: decimal.toString(16).toUpperCase(),
      };
    }
    if (isLongDivision) {
      const dividend = Math.trunc(parseNumber(valueA));
      const divisor = Math.trunc(parseNumber(valueB));
      if (divisor === 0) return null;
      return {
        mode: "long-division",
        quotient: Math.trunc(dividend / divisor),
        remainder: dividend % divisor,
      };
    }
    const evaluated = safeEvaluateExpression(expression);
    return evaluated == null ? null : { mode: "expression", value: evaluated };
  }, [
    bigMode,
    expression,
    isBigNumber,
    isBinary,
    isExponent,
    isFactor,
    isFraction,
    isGcf,
    isHex,
    isLcm,
    isLog,
    isLongDivision,
    isMatrix,
    isPrimeFactorization,
    isQuadratic,
    isRoot,
    isRounding,
    isSciNotation,
    roundPlaces,
    textValue,
    valueA,
    valueB,
    valueC,
    valueD,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isFraction ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Numerator">
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Denominator">
              <Input value={valueB} onChange={(e) => setValueB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isExponent ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Base">
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Exponent">
              <Input value={valueB} onChange={(e) => setValueB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isQuadratic ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="a">
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="b">
              <Input value={valueB} onChange={(e) => setValueB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="c">
              <Input value={valueC} onChange={(e) => setValueC(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isLog || isRoot || isLcm || isGcf || isLongDivision ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={isLog ? "Value" : isRoot ? "Number" : "Value A"}>
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label={isLog ? "Log base" : isRoot ? "Root degree" : "Value B"}>
              <Input value={valueB} onChange={(e) => setValueB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isFactor || isPrimeFactorization || isSciNotation ? (
          <Field label="Input value">
            <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
        ) : isRounding ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Number">
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Decimal places">
              <Input value={roundPlaces} onChange={(e) => setRoundPlaces(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isMatrix ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="m11">
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="m12">
              <Input value={valueB} onChange={(e) => setValueB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="m21">
              <Input value={valueC} onChange={(e) => setValueC(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="m22">
              <Input value={valueD} onChange={(e) => setValueD(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isBigNumber ? (
          <div className="grid gap-3">
            <Field label="Big integer A">
              <Input value={valueA} onChange={(e) => setValueA(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Big integer B">
              <Input value={valueB} onChange={(e) => setValueB(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Operation">
              <Select value={bigMode} onValueChange={(value) => setBigMode(value as "add" | "subtract" | "multiply")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">A + B</SelectItem>
                  <SelectItem value="subtract">A - B</SelectItem>
                  <SelectItem value="multiply">A × B</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isBinary || isHex ? (
          <Field label={isBinary ? "Binary input" : "Hex input"}>
            <Input value={textValue} onChange={(e) => setTextValue(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
        ) : (
          <>
            <Field label="Expression">
              <Input value={expression} onChange={(e) => setExpression(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <p className="mt-2 text-xs text-muted-foreground">Supports numbers, parentheses, and operators: + - * / % ^</p>
          </>
        )}
      </section>
      <ResultCard title="Result">
        {!result && <p>Enter valid input values.</p>}
        {result?.mode === "expression" && (
          <p className="text-2xl font-semibold text-foreground">{formatNumber(result.value, 8)}</p>
        )}
        {result?.mode === "fraction" && (
          <div className="space-y-2">
            <p>Reduced: <span className="font-semibold">{result.reducedN}/{result.reducedD}</span></p>
            <p>Decimal: <span className="font-semibold">{formatNumber(result.decimal, 8)}</span></p>
            <p>Mixed: <span className="font-semibold">{result.whole} {result.remainder}/{Math.abs(result.reducedD)}</span></p>
          </div>
        )}
        {result?.mode === "exponent" && <p className="text-2xl font-semibold text-foreground">{formatNumber(result.value, 8)}</p>}
        {result?.mode === "quadratic" && (
          <div className="space-y-2">
            <p>Discriminant: <span className="font-semibold">{formatNumber(result.discriminant, 8)}</span></p>
            <p>Root 1: <span className="font-semibold">{result.root1}</span></p>
            <p>Root 2: <span className="font-semibold">{result.root2}</span></p>
          </div>
        )}
        {result?.mode === "log" && <p>Log result: <span className="font-semibold">{formatNumber(result.value, 8)}</span></p>}
        {result?.mode === "root" && <p>Root result: <span className="font-semibold">{formatNumber(result.value, 8)}</span></p>}
        {result?.mode === "lcmgcf" && (
          <div className="space-y-2">
            <p>GCF: <span className="font-semibold">{result.gcf}</span></p>
            <p>LCM: <span className="font-semibold">{result.lcm}</span></p>
          </div>
        )}
        {result?.mode === "factor" && <p>Factors: <span className="font-semibold">{result.factors.join(", ")}</span></p>}
        {result?.mode === "prime" && <p>Prime factors: <span className="font-semibold">{result.factors.join(" × ")}</span></p>}
        {result?.mode === "rounding" && (
          <div className="space-y-2">
            <p>Rounded: <span className="font-semibold">{formatNumber(result.rounded, 8)}</span></p>
            <p>Floor: <span className="font-semibold">{result.floor}</span></p>
            <p>Ceil: <span className="font-semibold">{result.ceil}</span></p>
          </div>
        )}
        {result?.mode === "matrix" && (
          <div className="space-y-2">
            <p>Determinant: <span className="font-semibold">{formatNumber(result.determinant, 8)}</span></p>
            <p>Inverse: <span className="font-semibold">{result.inverse ?? "Not invertible (det = 0)"}</span></p>
          </div>
        )}
        {result?.mode === "notation" && (
          <div className="space-y-2">
            <p>Scientific: <span className="font-semibold">{result.scientific}</span></p>
            <p>Engineering: <span className="font-semibold">{result.engineering}</span></p>
          </div>
        )}
        {result?.mode === "big" && <p className="break-all font-semibold">{result.result}</p>}
        {result?.mode === "base" && (
          <div className="space-y-2">
            <p>Decimal: <span className="font-semibold">{result.decimal}</span></p>
            <p>Binary: <span className="font-semibold">{result.binary}</span></p>
            <p>Hex: <span className="font-semibold">{result.hex}</span></p>
          </div>
        )}
        {result?.mode === "long-division" && (
          <div className="space-y-2">
            <p>Quotient: <span className="font-semibold">{result.quotient}</span></p>
            <p>Remainder: <span className="font-semibold">{result.remainder}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function GeometryPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isDistance = title.includes("distance");
  const isSlope = title.includes("slope");
  const isCircle = title.includes("circle");
  const isVolume = title.includes("volume");
  const isSurface = title.includes("surface area");
  const isArea = title.includes("area calculator");
  const isPythagorean = title.includes("pythagorean");
  const isRightTriangle = title.includes("right triangle");
  const isTriangle = title.includes("triangle");

  const [x1, setX1] = useState("0");
  const [y1, setY1] = useState("0");
  const [x2, setX2] = useState("3");
  const [y2, setY2] = useState("4");
  const [radius, setRadius] = useState("5");
  const [base, setBase] = useState("10");
  const [height, setHeight] = useState("8");
  const [length, setLength] = useState("12");
  const [width, setWidth] = useState("9");
  const [depth, setDepth] = useState("2");
  const [triA, setTriA] = useState("3");
  const [triB, setTriB] = useState("4");
  const [triC, setTriC] = useState("5");
  const [areaShape, setAreaShape] = useState<"rectangle" | "circle" | "triangle">("rectangle");

  const result = useMemo<
    | { kind: "line"; distance: number; slope: number | null; intercept: number | null }
    | { kind: "circle"; area: number; circumference: number }
    | { kind: "prism"; volume: number; surfaceArea: number }
    | { kind: "area"; area: number; perimeter: number; shape: "rectangle" | "circle" | "triangle" }
    | { kind: "triangle"; area: number; perimeter: number; valid: boolean }
    | { kind: "right"; hypotenuse: number; area: number; perimeter: number }
    | null
  >(() => {
    if (isDistance || isSlope) {
      const dx = parseNumber(x2) - parseNumber(x1);
      const dy = parseNumber(y2) - parseNumber(y1);
      const slope = dx === 0 ? null : dy / dx;
      const intercept = slope == null ? null : parseNumber(y1) - slope * parseNumber(x1);
      return {
        kind: "line",
        distance: Math.sqrt(dx * dx + dy * dy),
        slope,
        intercept,
      };
    }
    if (isCircle) {
      const r = parseNumber(radius);
      if (r <= 0) return null;
      return {
        kind: "circle",
        area: Math.PI * r * r,
        circumference: 2 * Math.PI * r,
      };
    }
    if (isVolume || isSurface) {
      const l = parseNumber(length);
      const w = parseNumber(width);
      const d = parseNumber(depth);
      if (l <= 0 || w <= 0 || d <= 0) return null;
      return {
        kind: "prism",
        volume: l * w * d,
        surfaceArea: 2 * (l * w + l * d + w * d),
      };
    }
    if (isArea) {
      if (areaShape === "rectangle") {
        const l = parseNumber(length);
        const w = parseNumber(width);
        if (l <= 0 || w <= 0) return null;
        return { kind: "area", area: l * w, perimeter: 2 * (l + w), shape: "rectangle" };
      }
      if (areaShape === "circle") {
        const r = parseNumber(radius);
        if (r <= 0) return null;
        return {
          kind: "area",
          area: Math.PI * r * r,
          perimeter: 2 * Math.PI * r,
          shape: "circle",
        };
      }
      const b = parseNumber(base);
      const h = parseNumber(height);
      const a = parseNumber(triA);
      const c = parseNumber(triC);
      if (b <= 0 || h <= 0 || a <= 0 || c <= 0) return null;
      return { kind: "area", area: 0.5 * b * h, perimeter: a + b + c, shape: "triangle" };
    }
    if (isPythagorean || isRightTriangle) {
      const a = parseNumber(triA);
      const b = parseNumber(triB);
      if (a <= 0 || b <= 0) return null;
      const hypotenuse = Math.sqrt(a * a + b * b);
      return {
        kind: "right",
        hypotenuse,
        area: 0.5 * a * b,
        perimeter: a + b + hypotenuse,
      };
    }
    if (isTriangle) {
      const a = parseNumber(triA);
      const b = parseNumber(triB);
      const c = parseNumber(triC);
      if (a <= 0 || b <= 0 || c <= 0) return null;
      const s = (a + b + c) / 2;
      const areaSq = s * (s - a) * (s - b) * (s - c);
      const valid = areaSq > 0;
      return {
        kind: "triangle",
        area: valid ? Math.sqrt(areaSq) : 0,
        perimeter: a + b + c,
        valid,
      };
    }
    const l = parseNumber(length);
    const w = parseNumber(width);
    if (l <= 0 || w <= 0) return null;
    return { kind: "area", area: l * w, perimeter: 2 * (l + w), shape: "rectangle" };
  }, [
    areaShape,
    base,
    depth,
    height,
    isArea,
    isCircle,
    isDistance,
    isPythagorean,
    isRightTriangle,
    isSlope,
    isSurface,
    isTriangle,
    isVolume,
    length,
    radius,
    triA,
    triB,
    triC,
    width,
    x1,
    x2,
    y1,
    y2,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {(isDistance || isSlope) ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="x1"><Input type="number" value={x1} onChange={(e) => setX1(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="y1"><Input type="number" value={y1} onChange={(e) => setY1(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="x2"><Input type="number" value={x2} onChange={(e) => setX2(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="y2"><Input type="number" value={y2} onChange={(e) => setY2(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : isCircle ? (
          <Field label="Radius">
            <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
        ) : (isVolume || isSurface) ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Length"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Width"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Depth"><Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : isArea ? (
          <div className="grid gap-3">
            <Field label="Shape">
              <Select value={areaShape} onValueChange={(value) => setAreaShape(value as "rectangle" | "circle" | "triangle")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="triangle">Triangle</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {areaShape === "rectangle" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Length"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="border-border/80 bg-background/80" /></Field>
                <Field label="Width"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="border-border/80 bg-background/80" /></Field>
              </div>
            )}
            {areaShape === "circle" && (
              <Field label="Radius">
                <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            )}
            {areaShape === "triangle" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Base"><Input type="number" value={base} onChange={(e) => setBase(e.target.value)} className="border-border/80 bg-background/80" /></Field>
                <Field label="Height"><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="border-border/80 bg-background/80" /></Field>
                <Field label="Side A"><Input type="number" value={triA} onChange={(e) => setTriA(e.target.value)} className="border-border/80 bg-background/80" /></Field>
                <Field label="Side C"><Input type="number" value={triC} onChange={(e) => setTriC(e.target.value)} className="border-border/80 bg-background/80" /></Field>
              </div>
            )}
          </div>
        ) : (isPythagorean || isRightTriangle) ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Leg A"><Input type="number" value={triA} onChange={(e) => setTriA(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Leg B"><Input type="number" value={triB} onChange={(e) => setTriB(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : isTriangle ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Side A"><Input type="number" value={triA} onChange={(e) => setTriA(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Side B"><Input type="number" value={triB} onChange={(e) => setTriB(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Side C"><Input type="number" value={triC} onChange={(e) => setTriC(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Length"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Width"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        )}
      </section>
      <ResultCard title="Geometry output">
        {!result && <p>Enter valid values.</p>}
        {result && result.kind === "line" && (
          <div className="space-y-2">
            <p>Distance: <span className="font-semibold">{formatNumber(result.distance, 6)}</span></p>
            <p>Slope: <span className="font-semibold">{result.slope == null ? "Undefined" : formatNumber(result.slope, 6)}</span></p>
            {result.intercept != null && <p>Y-intercept: <span className="font-semibold">{formatNumber(result.intercept, 6)}</span></p>}
          </div>
        )}
        {result && result.kind === "circle" && (
          <div className="space-y-2">
            <p>Area: <span className="font-semibold">{formatNumber(result.area, 6)}</span></p>
            <p>Circumference: <span className="font-semibold">{formatNumber(result.circumference, 6)}</span></p>
          </div>
        )}
        {result && result.kind === "prism" && (
          <div className="space-y-2">
            <p>Volume: <span className="font-semibold">{formatNumber(result.volume, 6)}</span></p>
            <p>Surface area: <span className="font-semibold">{formatNumber(result.surfaceArea, 6)}</span></p>
          </div>
        )}
        {result && result.kind === "area" && (
          <div className="space-y-2">
            <p>Shape: <span className="font-semibold">{result.shape}</span></p>
            <p>Area: <span className="font-semibold">{formatNumber(result.area, 6)}</span></p>
            <p>Perimeter: <span className="font-semibold">{formatNumber(result.perimeter, 6)}</span></p>
          </div>
        )}
        {result && result.kind === "triangle" && (
          <div className="space-y-2">
            {!result.valid && <p className="text-amber-500">Triangle sides are invalid (triangle inequality fails).</p>}
            {result.valid && (
              <>
                <p>Triangle area: <span className="font-semibold">{formatNumber(result.area, 6)}</span></p>
                <p>Perimeter: <span className="font-semibold">{formatNumber(result.perimeter, 6)}</span></p>
              </>
            )}
          </div>
        )}
        {result && result.kind === "right" && (
          <div className="space-y-2">
            <p>Hypotenuse: <span className="font-semibold">{formatNumber(result.hypotenuse, 6)}</span></p>
            <p>Area: <span className="font-semibold">{formatNumber(result.area, 6)}</span></p>
            <p>Perimeter: <span className="font-semibold">{formatNumber(result.perimeter, 6)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function erfApprox(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) *
      Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erfApprox(x / Math.sqrt(2)));
}

function factorial(n: number): number {
  const value = Math.max(0, Math.floor(n));
  if (value > 170) return Number.POSITIVE_INFINITY;
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

function StatisticsPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isNumberSequence = title.includes("number sequence");
  const isHalfLife = title.includes("half-life");
  const isSampleSize = title.includes("sample size");
  const isProbability = title.includes("probability");
  const isPermutation = title.includes("permutation and combination");
  const isZScore = title.includes("z-score");
  const isConfidenceInterval = title.includes("confidence interval");
  const isPValue = title.includes("p-value");

  const [series, setSeries] = useState("3,5,7,10,10,12,14");
  const [confidence, setConfidence] = useState("95");
  const [startValue, setStartValue] = useState("2");
  const [difference, setDifference] = useState("3");
  const [termNumber, setTermNumber] = useState("10");
  const [initialAmount, setInitialAmount] = useState("1000");
  const [halfLifePeriod, setHalfLifePeriod] = useState("5");
  const [elapsedTime, setElapsedTime] = useState("12");
  const [populationProp, setPopulationProp] = useState("0.5");
  const [marginError, setMarginError] = useState("5");
  const [successCount, setSuccessCount] = useState("3");
  const [totalCount, setTotalCount] = useState("10");
  const [nValue, setNValue] = useState("10");
  const [rValue, setRValue] = useState("3");
  const [xValue, setXValue] = useState("85");
  const [pValueZ, setPValueZ] = useState("1.96");
  const [meanValue, setMeanValue] = useState("75");
  const [stdValue, setStdValue] = useState("8");
  const [sampleN, setSampleN] = useState("30");

  const result = useMemo<
    | {
        mode: "series";
        n: number;
        sum: number;
        mean: number;
        median: number;
        modeValue: number;
        min: number;
        max: number;
        std: number;
        margin: number;
        ciLow: number;
        ciHigh: number;
      }
    | { mode: "sequence"; nth: number; sumN: number; sequencePreview: string }
    | { mode: "half-life"; remaining: number; elapsedHalfLives: number }
    | { mode: "sample-size"; sampleSize: number }
    | { mode: "probability"; probability: number; odds: string }
    | { mode: "perm-comb"; permutation: number; combination: number }
    | { mode: "z"; zScore: number; percentile: number }
    | { mode: "ci"; margin: number; low: number; high: number }
    | { mode: "p-value"; oneTailed: number; twoTailed: number }
    | null
  >(() => {
    if (isNumberSequence) {
      const a1 = parseNumber(startValue);
      const d = parseNumber(difference);
      const n = Math.max(1, Math.round(parseNumber(termNumber)));
      const nth = a1 + (n - 1) * d;
      const sumN = (n / 2) * (2 * a1 + (n - 1) * d);
      const preview = Array.from({ length: Math.min(6, n) }, (_, idx) => a1 + idx * d).join(", ");
      return { mode: "sequence", nth, sumN, sequencePreview: preview };
    }
    if (isHalfLife) {
      const initial = parseNumber(initialAmount);
      const half = parseNumber(halfLifePeriod);
      const elapsed = parseNumber(elapsedTime);
      if (initial <= 0 || half <= 0 || elapsed < 0) return null;
      const elapsedHalfLives = elapsed / half;
      const remaining = initial * 0.5 ** elapsedHalfLives;
      return { mode: "half-life", remaining, elapsedHalfLives };
    }
    if (isSampleSize) {
      const z =
        parseNumber(confidence) >= 99
          ? 2.576
          : parseNumber(confidence) >= 95
            ? 1.96
            : parseNumber(confidence) >= 90
              ? 1.645
              : 1.282;
      const p = clamp(parseNumber(populationProp), 0.01, 0.99);
      const e = Math.max(0.001, parseNumber(marginError) / 100);
      const sampleSize = (z * z * p * (1 - p)) / (e * e);
      return { mode: "sample-size", sampleSize: Math.ceil(sampleSize) };
    }
    if (isProbability) {
      const success = parseNumber(successCount);
      const total = parseNumber(totalCount);
      if (total <= 0 || success < 0 || success > total) return null;
      const probability = success / total;
      return {
        mode: "probability",
        probability,
        odds: `${formatNumber(success, 0)}:${formatNumber(Math.max(0, total - success), 0)}`,
      };
    }
    if (isPermutation) {
      const n = Math.max(0, Math.floor(parseNumber(nValue)));
      const r = Math.max(0, Math.floor(parseNumber(rValue)));
      if (r > n) return null;
      const permutation = factorial(n) / factorial(n - r);
      const combination = permutation / factorial(r);
      return { mode: "perm-comb", permutation, combination };
    }
    if (isZScore) {
      const x = parseNumber(xValue);
      const mean = parseNumber(meanValue);
      const std = parseNumber(stdValue);
      if (std <= 0) return null;
      const zScore = (x - mean) / std;
      return { mode: "z", zScore, percentile: normalCdf(zScore) * 100 };
    }
    if (isConfidenceInterval) {
      const mean = parseNumber(meanValue);
      const std = parseNumber(stdValue);
      const n = Math.max(2, Math.round(parseNumber(sampleN)));
      if (std <= 0) return null;
      const z =
        parseNumber(confidence) >= 99
          ? 2.576
          : parseNumber(confidence) >= 95
            ? 1.96
            : parseNumber(confidence) >= 90
              ? 1.645
              : 1.282;
      const margin = z * (std / Math.sqrt(n));
      return { mode: "ci", margin, low: mean - margin, high: mean + margin };
    }
    if (isPValue) {
      const z = parseNumber(pValueZ);
      const oneTailed = 1 - normalCdf(Math.abs(z));
      return { mode: "p-value", oneTailed, twoTailed: Math.min(1, oneTailed * 2) };
    }

    const values = series
      .split(",")
      .map((token) => parseNumber(token.trim()))
      .filter((n) => Number.isFinite(n));
    const n = values.length;
    if (n === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, cur) => acc + cur, 0);
    const mean = sum / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = values.reduce((acc, cur) => acc + (cur - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const z = parseNumber(confidence) >= 99 ? 2.576 : parseNumber(confidence) >= 95 ? 1.96 : 1.645;
    const margin = z * (std / Math.sqrt(n));
    const modeMap = new Map<number, number>();
    for (const value of values) {
      modeMap.set(value, (modeMap.get(value) ?? 0) + 1);
    }
    let modeValue = values[0];
    let modeCount = 0;
    for (const [value, count] of modeMap.entries()) {
      if (count > modeCount) {
        modeValue = value;
        modeCount = count;
      }
    }
    return {
      mode: "series",
      n,
      sum,
      mean,
      median,
      modeValue,
      min: sorted[0],
      max: sorted[n - 1],
      std,
      margin,
      ciLow: mean - margin,
      ciHigh: mean + margin,
    };
  }, [
    confidence,
    difference,
    elapsedTime,
    halfLifePeriod,
    initialAmount,
    isConfidenceInterval,
    isHalfLife,
    isNumberSequence,
    isPValue,
    isPermutation,
    isProbability,
    isSampleSize,
    isZScore,
    marginError,
    meanValue,
    nValue,
    populationProp,
    pValueZ,
    rValue,
    sampleN,
    series,
    startValue,
    stdValue,
    successCount,
    termNumber,
    totalCount,
    xValue,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isNumberSequence ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Start value">
              <Input value={startValue} onChange={(e) => setStartValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Common difference">
              <Input value={difference} onChange={(e) => setDifference(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Term number (n)">
              <Input value={termNumber} onChange={(e) => setTermNumber(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isHalfLife ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Initial amount">
              <Input value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Half-life period">
              <Input value={halfLifePeriod} onChange={(e) => setHalfLifePeriod(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Elapsed time">
              <Input value={elapsedTime} onChange={(e) => setElapsedTime(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isSampleSize ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Confidence (%)">
              <Input value={confidence} onChange={(e) => setConfidence(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Population proportion (0-1)">
              <Input value={populationProp} onChange={(e) => setPopulationProp(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Margin of error (%)">
              <Input value={marginError} onChange={(e) => setMarginError(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isProbability ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Successful outcomes">
              <Input value={successCount} onChange={(e) => setSuccessCount(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Total outcomes">
              <Input value={totalCount} onChange={(e) => setTotalCount(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isPermutation ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="n">
              <Input value={nValue} onChange={(e) => setNValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="r">
              <Input value={rValue} onChange={(e) => setRValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isZScore ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Observed value (x)">
              <Input value={xValue} onChange={(e) => setXValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Mean">
              <Input value={meanValue} onChange={(e) => setMeanValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Std deviation">
              <Input value={stdValue} onChange={(e) => setStdValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isConfidenceInterval ? (
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Mean">
              <Input value={meanValue} onChange={(e) => setMeanValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Std deviation">
              <Input value={stdValue} onChange={(e) => setStdValue(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Sample size (n)">
              <Input value={sampleN} onChange={(e) => setSampleN(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Confidence (%)">
              <Input value={confidence} onChange={(e) => setConfidence(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isPValue ? (
          <div className="max-w-xs">
            <Field label="Z statistic">
              <Input value={pValueZ} onChange={(e) => setPValueZ(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Data series (comma-separated)">
              <Input value={series} onChange={(e) => setSeries(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <div className="mt-3 max-w-xs">
              <Field label="Confidence (%)">
                <Input type="number" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            </div>
          </>
        )}
      </section>
      <ResultCard title="Statistics output">
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "sequence" && (
          <div className="space-y-2">
            <p>Sequence preview: <span className="font-semibold">{result.sequencePreview}</span></p>
            <p>n-th term: <span className="font-semibold">{formatNumber(result.nth, 6)}</span></p>
            <p>Sum of first n terms: <span className="font-semibold">{formatNumber(result.sumN, 6)}</span></p>
          </div>
        )}
        {result?.mode === "half-life" && (
          <div className="space-y-2">
            <p>Elapsed half-lives: <span className="font-semibold">{formatNumber(result.elapsedHalfLives, 4)}</span></p>
            <p>Remaining amount: <span className="font-semibold">{formatNumber(result.remaining, 6)}</span></p>
          </div>
        )}
        {result?.mode === "sample-size" && (
          <p>Required sample size: <span className="font-semibold">{formatNumber(result.sampleSize, 0)}</span></p>
        )}
        {result?.mode === "probability" && (
          <div className="space-y-2">
            <p>Probability: <span className="font-semibold">{formatNumber(result.probability * 100, 4)}%</span></p>
            <p>Odds (success:failure): <span className="font-semibold">{result.odds}</span></p>
          </div>
        )}
        {result?.mode === "perm-comb" && (
          <div className="space-y-2">
            <p>Permutation nPr: <span className="font-semibold">{formatNumber(result.permutation, 0)}</span></p>
            <p>Combination nCr: <span className="font-semibold">{formatNumber(result.combination, 0)}</span></p>
          </div>
        )}
        {result?.mode === "z" && (
          <div className="space-y-2">
            <p>Z-score: <span className="font-semibold">{formatNumber(result.zScore, 6)}</span></p>
            <p>Percentile: <span className="font-semibold">{formatNumber(result.percentile, 4)}%</span></p>
          </div>
        )}
        {result?.mode === "ci" && (
          <div className="space-y-2">
            <p>Margin of error: <span className="font-semibold">{formatNumber(result.margin, 6)}</span></p>
            <p>Confidence interval: <span className="font-semibold">{formatNumber(result.low, 6)} to {formatNumber(result.high, 6)}</span></p>
          </div>
        )}
        {result?.mode === "p-value" && (
          <div className="space-y-2">
            <p>One-tailed p-value: <span className="font-semibold">{formatNumber(result.oneTailed, 8)}</span></p>
            <p>Two-tailed p-value: <span className="font-semibold">{formatNumber(result.twoTailed, 8)}</span></p>
          </div>
        )}
        {result?.mode === "series" && (
          <div className="space-y-1">
            <p>Count: <span className="font-semibold">{result.n}</span></p>
            <p>Mean: <span className="font-semibold">{formatNumber(result.mean, 6)}</span></p>
            <p>Median: <span className="font-semibold">{formatNumber(result.median, 6)}</span></p>
            <p>Mode: <span className="font-semibold">{formatNumber(result.modeValue, 6)}</span></p>
            <p>Std dev: <span className="font-semibold">{formatNumber(result.std, 6)}</span></p>
            <p>Min / max: <span className="font-semibold">{formatNumber(result.min, 6)} / {formatNumber(result.max, 6)}</span></p>
            <p>Confidence interval: <span className="font-semibold">{formatNumber(result.ciLow, 6)} to {formatNumber(result.ciHigh, 6)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function RandomPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [diceCount, setDiceCount] = useState("2");
  const [sides, setSides] = useState("6");
  const [nameA, setNameA] = useState("Alex");
  const [nameB, setNameB] = useState("Sam");
  const [result, setResult] = useState<string>("");

  const run = () => {
    if (title.includes("dice")) {
      const c = Math.max(1, Math.round(parseNumber(diceCount)));
      const s = Math.max(2, Math.round(parseNumber(sides)));
      const rolls = Array.from({ length: c }, () => Math.floor(Math.random() * s) + 1);
      setResult(`${rolls.join(", ")} (total: ${rolls.reduce((a, b) => a + b, 0)})`);
      return;
    }
    if (title.includes("love")) {
      const input = `${nameA.trim().toLowerCase()}|${nameB.trim().toLowerCase()}`;
      let hash = 0;
      for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) % 101;
      }
      setResult(`${nameA} + ${nameB}: ${hash}% compatibility`);
      return;
    }
    const low = Math.round(parseNumber(min));
    const high = Math.round(parseNumber(max));
    if (high < low) {
      setResult("Max must be greater than or equal to min.");
      return;
    }
    const value = Math.floor(Math.random() * (high - low + 1)) + low;
    setResult(value.toString());
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {title.includes("dice") ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dice count"><Input type="number" value={diceCount} onChange={(e) => setDiceCount(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Sides per die"><Input type="number" value={sides} onChange={(e) => setSides(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : title.includes("love") ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name A"><Input value={nameA} onChange={(e) => setNameA(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Name B"><Input value={nameB} onChange={(e) => setNameB(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Min"><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Max"><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        )}
        <div className="mt-4">
          <Button type="button" size="sm" className="h-9" onClick={run}>Generate</Button>
        </div>
      </section>
      <ResultCard title="Generated result">
        {result ? <p className="text-lg font-semibold">{result}</p> : <p>Click generate to produce output.</p>}
      </ResultCard>
    </div>
  );
}

function PasswordGeneratorPanel() {
  const [length, setLength] = useState("16");
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const generate = () => {
    const len = Math.max(4, Math.round(parseNumber(length)));
    const pools = [
      useUpper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
      useLower ? "abcdefghijklmnopqrstuvwxyz" : "",
      useNumbers ? "0123456789" : "",
      useSymbols ? "!@#$%^&*()_+-=[]{}<>?" : "",
    ].join("");

    if (!pools) {
      setPassword("Select at least one character set.");
      return;
    }

    let output = "";
    for (let i = 0; i < len; i += 1) {
      output += pools[Math.floor(Math.random() * pools.length)];
    }
    setPassword(output);
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Password length">
            <Input type="number" min="4" max="128" value={length} onChange={(e) => setLength(e.target.value)} className="border-border/80 bg-background/80" />
          </Field>
          <div className="pt-7 text-sm text-muted-foreground">Toggle character sets:</div>
        </div>
        <div className="mt-2 grid gap-2 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} /> Uppercase</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} /> Lowercase</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} /> Numbers</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} /> Symbols</label>
        </div>
        <div className="mt-4"><Button type="button" size="sm" className="h-9" onClick={generate}>Generate password</Button></div>
      </section>
      <ResultCard title="Password">
        {password ? <p className="text-lg font-semibold break-all">{password}</p> : <p>Generate a password.</p>}
      </ResultCard>
    </div>
  );
}

function GradePanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const [mode, setMode] = useState<"grade" | "gpa">(
    title.includes("gpa") ? "gpa" : "grade"
  );
  const [score, setScore] = useState("86");
  const [total, setTotal] = useState("100");
  const [points, setPoints] = useState("3.7,3.3,4.0");
  const [credits, setCredits] = useState("3,3,4");

  const result = useMemo(() => {
    if (mode === "grade") {
      const s = parseNumber(score);
      const t = parseNumber(total);
      if (t <= 0) return null;
      const pct = (s / t) * 100;
      const letter = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
      return { mode: "grade", pct, letter } as const;
    }
    const pointValues = points.split(",").map((v) => parseNumber(v.trim()));
    const creditValues = credits.split(",").map((v) => parseNumber(v.trim()));
    if (pointValues.length === 0 || pointValues.length !== creditValues.length) return null;
    const totalCredits = creditValues.reduce((a, b) => a + b, 0);
    if (totalCredits <= 0) return null;
    const weighted = pointValues.reduce((acc, cur, index) => acc + cur * creditValues[index], 0);
    return { mode: "gpa", gpa: weighted / totalCredits, credits: totalCredits } as const;
  }, [credits, mode, points, score, total]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <Field label="Mode">
          <Select value={mode} onValueChange={(value) => setMode(value as "grade" | "gpa")}>
            <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="grade">Grade percentage</SelectItem>
              <SelectItem value="gpa">GPA (weighted)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {mode === "grade" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Score"><Input type="number" value={score} onChange={(e) => setScore(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Total"><Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            <Field label="Grade points (comma-separated)">
              <Input value={points} onChange={(e) => setPoints(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Credits (comma-separated)">
              <Input value={credits} onChange={(e) => setCredits(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        )}
      </section>
      <ResultCard title="Academic result">
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "grade" && (
          <div className="space-y-2">
            <p>Percent: <span className="font-semibold">{formatNumber(result.pct, 2)}%</span></p>
            <p>Letter: <span className="font-semibold">{result.letter}</span></p>
          </div>
        )}
        {result?.mode === "gpa" && (
          <div className="space-y-2">
            <p>GPA: <span className="font-semibold">{formatNumber(result.gpa, 3)}</span></p>
            <p>Total credits: <span className="font-semibold">{formatNumber(result.credits, 1)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function ConversionPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [shoeSize, setShoeSize] = useState("9");
  const [shoeFrom, setShoeFrom] = useState("us-men");
  const [shoeTo, setShoeTo] = useState("eu");
  const [massValue, setMassValue] = useState("100");
  const [volumeValue, setVolumeValue] = useState("250");
  const [massUnit, setMassUnit] = useState("g");
  const [volumeUnit, setVolumeUnit] = useState("ml");
  const [densityValue, setDensityValue] = useState("1");
  const [gravityValue, setGravityValue] = useState("9.80665");
  const [molesValue, setMolesValue] = useState("0.5");
  const [solutionVolume, setSolutionVolume] = useState("1");
  const [formula, setFormula] = useState("C6H12O6");
  const [tireWidth, setTireWidth] = useState("225");
  const [tireAspect, setTireAspect] = useState("55");
  const [tireRim, setTireRim] = useState("17");
  const [transferSize, setTransferSize] = useState("2");
  const [transferUnit, setTransferUnit] = useState("GB");
  const [transferSpeed, setTransferSpeed] = useState("100");
  const [transferSpeedUnit, setTransferSpeedUnit] = useState("Mbps");

  const isRoman = title.includes("roman numeral");
  const isShoe = title.includes("shoe size");
  const isDensity = title.includes("density calculator");
  const isMass = title === "mass calculator";
  const isWeight = title === "weight calculator";
  const isMolarity = title.includes("molarity");
  const isMolecular = title.includes("molecular weight");
  const isTire = title.includes("tire size");
  const isBandwidth = title.includes("bandwidth");
  const isHeight = title.includes("height calculator");

  const result = useMemo(() => {
    if (isRoman) {
      const numeric = parseNumber(value);
      if (numeric <= 0) return null;
      return { mode: "roman", label: toRoman(numeric) } as const;
    }

    if (isShoe) {
      const input = parseNumber(shoeSize);
      if (input <= 0) return null;
      const toUsMen = (size: number, system: string) => {
        if (system === "us-men") return size;
        if (system === "us-women") return size - 1.5;
        if (system === "uk") return size + 0.5;
        return size - 33;
      };
      const fromUsMen = (size: number, system: string) => {
        if (system === "us-men") return size;
        if (system === "us-women") return size + 1.5;
        if (system === "uk") return size - 0.5;
        return size + 33;
      };
      const usMen = toUsMen(input, shoeFrom);
      return {
        mode: "shoe",
        converted: fromUsMen(usMen, shoeTo),
        usMen,
      } as const;
    }

    if (isDensity) {
      const massFactors: Record<string, number> = { g: 1, kg: 1000, lb: 453.59237 };
      const volumeFactors: Record<string, number> = { ml: 1, l: 1000, ft3: 28316.8466 };
      const massG = parseNumber(massValue) * (massFactors[massUnit] ?? 1);
      const volumeMl = parseNumber(volumeValue) * (volumeFactors[volumeUnit] ?? 1);
      if (massG <= 0 || volumeMl <= 0) return null;
      const densityGPerMl = massG / volumeMl;
      return {
        mode: "density",
        densityGPerMl,
        densityKgPerM3: densityGPerMl * 1000,
      } as const;
    }

    if (isMass) {
      const density = parseNumber(densityValue);
      const volumeMl = parseNumber(volumeValue);
      if (density <= 0 || volumeMl <= 0) return null;
      const massG = density * volumeMl;
      return {
        mode: "mass",
        grams: massG,
        kilograms: massG / 1000,
        pounds: massG / 453.59237,
      } as const;
    }

    if (isWeight) {
      const massKg = parseNumber(massValue);
      const gravity = parseNumber(gravityValue);
      if (massKg <= 0 || gravity <= 0) return null;
      const newtons = massKg * gravity;
      return {
        mode: "weight",
        newtons,
        lbf: newtons * 0.224809,
      } as const;
    }

    if (isMolarity) {
      const moles = parseNumber(molesValue);
      const liters = parseNumber(solutionVolume);
      if (moles <= 0 || liters <= 0) return null;
      return {
        mode: "molarity",
        molarity: moles / liters,
      } as const;
    }

    if (isMolecular) {
      const parsed = parseChemicalFormula(formula);
      if (!parsed) return null;
      if (parsed.unknown.length > 0) {
        return {
          mode: "molecular-unknown",
          unknown: parsed.unknown,
        } as const;
      }
      const breakdown = Object.entries(parsed.counts).map(([symbol, count]) => ({
        symbol,
        count,
        atomicWeight: ATOMIC_WEIGHTS[symbol],
        contribution: ATOMIC_WEIGHTS[symbol] * count,
      }));
      const molecularWeight = breakdown.reduce(
        (sum, item) => sum + item.contribution,
        0
      );
      return {
        mode: "molecular",
        molecularWeight,
        breakdown,
      } as const;
    }

    if (isTire) {
      const widthMm = parseNumber(tireWidth);
      const aspectRatio = parseNumber(tireAspect);
      const rimInches = parseNumber(tireRim);
      if (widthMm <= 0 || aspectRatio <= 0 || rimInches <= 0) return null;
      const sidewallMm = widthMm * (aspectRatio / 100);
      const diameterMm = rimInches * 25.4 + sidewallMm * 2;
      const circumferenceMm = diameterMm * Math.PI;
      return {
        mode: "tire",
        diameterIn: diameterMm / 25.4,
        circumferenceIn: circumferenceMm / 25.4,
        revsPerMile: 63360 / (circumferenceMm / 25.4),
      } as const;
    }

    if (isBandwidth) {
      const sizeValue = parseNumber(transferSize);
      const speedValue = parseNumber(transferSpeed);
      if (sizeValue <= 0 || speedValue <= 0) return null;
      const sizeFactors: Record<string, number> = {
        KB: 1024,
        MB: 1024 ** 2,
        GB: 1024 ** 3,
        TB: 1024 ** 4,
      };
      const speedFactors: Record<string, number> = {
        "Kbps": 1000 / 8,
        "Mbps": 1_000_000 / 8,
        "Gbps": 1_000_000_000 / 8,
        "MB/s": 1024 ** 2,
        "GB/s": 1024 ** 3,
      };
      const bytes = sizeValue * (sizeFactors[transferUnit] ?? 1);
      const bytesPerSecond = speedValue * (speedFactors[transferSpeedUnit] ?? 1);
      if (bytesPerSecond <= 0) return null;
      const seconds = bytes / bytesPerSecond;
      const roundedSeconds = Math.max(0, Math.round(seconds));
      const hours = Math.floor(roundedSeconds / 3600);
      const minutes = Math.floor((roundedSeconds % 3600) / 60);
      const secs = roundedSeconds % 60;
      return {
        mode: "bandwidth",
        seconds,
        formatted: `${hours}h ${minutes}m ${secs}s`,
      } as const;
    }

    const numeric = parseNumber(value);
    if (!Number.isFinite(numeric)) return null;
    const unitMeta: Record<string, { kind: string; factor?: number }> = {
      mm: { kind: "length", factor: 0.001 },
      cm: { kind: "length", factor: 0.01 },
      m: { kind: "length", factor: 1 },
      km: { kind: "length", factor: 1000 },
      in: { kind: "length", factor: 0.0254 },
      ft: { kind: "length", factor: 0.3048 },
      yd: { kind: "length", factor: 0.9144 },
      mi: { kind: "length", factor: 1609.344 },
      g: { kind: "mass", factor: 0.001 },
      kg: { kind: "mass", factor: 1 },
      lb: { kind: "mass", factor: 0.45359237 },
      oz: { kind: "mass", factor: 0.028349523125 },
      ml: { kind: "volume", factor: 0.001 },
      l: { kind: "volume", factor: 1 },
      gal: { kind: "volume", factor: 3.78541 },
      c: { kind: "temperature" },
      f: { kind: "temperature" },
      k: { kind: "temperature" },
    };
    const source = unitMeta[from];
    const target = unitMeta[to];
    if (!source || !target || source.kind !== target.kind) return null;

    if (source.kind === "temperature") {
      let celsius = numeric;
      if (from === "f") celsius = (numeric - 32) * (5 / 9);
      if (from === "k") celsius = numeric - 273.15;
      let converted = celsius;
      if (to === "f") converted = celsius * (9 / 5) + 32;
      if (to === "k") converted = celsius + 273.15;
      return { mode: "conversion", label: `${formatNumber(converted, 6)} ${to}` } as const;
    }

    if (!source.factor || !target.factor) return null;
    const converted = (numeric * source.factor) / target.factor;
    const feetInches =
      isHeight && to === "ft"
        ? `${Math.floor(converted)} ft ${formatNumber((converted % 1) * 12, 2)} in`
        : null;
    return {
      mode: "conversion",
      label: `${formatNumber(converted, 6)} ${to}`,
      feetInches,
    } as const;
  }, [
    densityValue,
    formula,
    from,
    gravityValue,
    isBandwidth,
    isDensity,
    isHeight,
    isMass,
    isMolarity,
    isMolecular,
    isRoman,
    isShoe,
    isTire,
    isWeight,
    massUnit,
    massValue,
    molesValue,
    shoeFrom,
    shoeSize,
    shoeTo,
    solutionVolume,
    tireAspect,
    tireRim,
    tireWidth,
    to,
    transferSize,
    transferSpeed,
    transferSpeedUnit,
    transferUnit,
    value,
    volumeUnit,
    volumeValue,
  ]);

  const conversionUnits = isHeight
    ? [
        { value: "cm", label: "cm" },
        { value: "m", label: "m" },
        { value: "in", label: "in" },
        { value: "ft", label: "ft" },
      ]
    : [
        { value: "mm", label: "mm" },
        { value: "cm", label: "cm" },
        { value: "m", label: "m" },
        { value: "km", label: "km" },
        { value: "in", label: "in" },
        { value: "ft", label: "ft" },
        { value: "yd", label: "yd" },
        { value: "mi", label: "mi" },
        { value: "g", label: "g" },
        { value: "kg", label: "kg" },
        { value: "lb", label: "lb" },
        { value: "oz", label: "oz" },
        { value: "ml", label: "mL" },
        { value: "l", label: "L" },
        { value: "gal", label: "gal" },
        { value: "c", label: "°C" },
        { value: "f", label: "°F" },
        { value: "k", label: "K" },
      ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isRoman ? (
          <div className="max-w-xs">
            <Field label="Number">
              <Input
                type="number"
                min="1"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isShoe ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Size">
              <Input
                type="number"
                step="0.5"
                value={shoeSize}
                onChange={(event) => setShoeSize(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="From">
              <Select value={shoeFrom} onValueChange={setShoeFrom}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-men">US Men</SelectItem>
                  <SelectItem value="us-women">US Women</SelectItem>
                  <SelectItem value="uk">UK</SelectItem>
                  <SelectItem value="eu">EU</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="To">
              <Select value={shoeTo} onValueChange={setShoeTo}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-men">US Men</SelectItem>
                  <SelectItem value="us-women">US Women</SelectItem>
                  <SelectItem value="uk">UK</SelectItem>
                  <SelectItem value="eu">EU</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isDensity ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mass">
              <Input
                type="number"
                min="0"
                value={massValue}
                onChange={(event) => setMassValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Mass unit">
              <Select value={massUnit} onValueChange={setMassUnit}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Volume">
              <Input
                type="number"
                min="0"
                value={volumeValue}
                onChange={(event) => setVolumeValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Volume unit">
              <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">mL</SelectItem>
                  <SelectItem value="l">L</SelectItem>
                  <SelectItem value="ft3">ft³</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isMass ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Density (g/mL)">
              <Input
                type="number"
                min="0"
                value={densityValue}
                onChange={(event) => setDensityValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Volume (mL)">
              <Input
                type="number"
                min="0"
                value={volumeValue}
                onChange={(event) => setVolumeValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isWeight ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mass (kg)">
              <Input
                type="number"
                min="0"
                value={massValue}
                onChange={(event) => setMassValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Gravity (m/s²)">
              <Input
                type="number"
                min="0"
                step="0.00001"
                value={gravityValue}
                onChange={(event) => setGravityValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isMolarity ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Moles of solute">
              <Input
                type="number"
                min="0"
                value={molesValue}
                onChange={(event) => setMolesValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Solution volume (L)">
              <Input
                type="number"
                min="0"
                value={solutionVolume}
                onChange={(event) => setSolutionVolume(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isMolecular ? (
          <div className="max-w-sm">
            <Field label="Chemical formula">
              <Input
                value={formula}
                onChange={(event) => setFormula(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isTire ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Width (mm)">
              <Input
                type="number"
                min="0"
                value={tireWidth}
                onChange={(event) => setTireWidth(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Aspect ratio (%)">
              <Input
                type="number"
                min="0"
                value={tireAspect}
                onChange={(event) => setTireAspect(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Rim diameter (in)">
              <Input
                type="number"
                min="0"
                value={tireRim}
                onChange={(event) => setTireRim(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : isBandwidth ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Transfer size">
              <Input
                type="number"
                min="0"
                value={transferSize}
                onChange={(event) => setTransferSize(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Size unit">
              <Select value={transferUnit} onValueChange={setTransferUnit}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KB">KB</SelectItem>
                  <SelectItem value="MB">MB</SelectItem>
                  <SelectItem value="GB">GB</SelectItem>
                  <SelectItem value="TB">TB</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Transfer speed">
              <Input
                type="number"
                min="0"
                value={transferSpeed}
                onChange={(event) => setTransferSpeed(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Speed unit">
              <Select value={transferSpeedUnit} onValueChange={setTransferSpeedUnit}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kbps">Kbps</SelectItem>
                  <SelectItem value="Mbps">Mbps</SelectItem>
                  <SelectItem value="Gbps">Gbps</SelectItem>
                  <SelectItem value="MB/s">MB/s</SelectItem>
                  <SelectItem value="GB/s">GB/s</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Value">
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="From">
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {conversionUnits.map((unit) => (
                    <SelectItem key={`from-${unit.value}`} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="To">
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {conversionUnits.map((unit) => (
                    <SelectItem key={`to-${unit.value}`} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </section>
      <ResultCard title={`${calculator.title} result`}>
        {!result && <p>Enter valid input values.</p>}
        {result?.mode === "roman" && <p className="text-xl font-semibold">{result.label}</p>}
        {result?.mode === "shoe" && (
          <div className="space-y-2">
            <p>Converted size: <span className="font-semibold">{formatNumber(result.converted, 2)}</span></p>
            <p>US men equivalent: <span className="font-semibold">{formatNumber(result.usMen, 2)}</span></p>
          </div>
        )}
        {result?.mode === "density" && (
          <div className="space-y-2">
            <p>Density: <span className="font-semibold">{formatNumber(result.densityGPerMl, 6)} g/mL</span></p>
            <p>Density: <span className="font-semibold">{formatNumber(result.densityKgPerM3, 2)} kg/m³</span></p>
          </div>
        )}
        {result?.mode === "mass" && (
          <div className="space-y-2">
            <p>Mass: <span className="font-semibold">{formatNumber(result.grams, 4)} g</span></p>
            <p>Mass: <span className="font-semibold">{formatNumber(result.kilograms, 6)} kg</span></p>
            <p>Mass: <span className="font-semibold">{formatNumber(result.pounds, 6)} lb</span></p>
          </div>
        )}
        {result?.mode === "weight" && (
          <div className="space-y-2">
            <p>Weight force: <span className="font-semibold">{formatNumber(result.newtons, 6)} N</span></p>
            <p>Weight force: <span className="font-semibold">{formatNumber(result.lbf, 6)} lbf</span></p>
          </div>
        )}
        {result?.mode === "molarity" && (
          <p>Molarity: <span className="font-semibold">{formatNumber(result.molarity, 6)} mol/L (M)</span></p>
        )}
        {result?.mode === "molecular-unknown" && (
          <p>Unknown element symbol(s): <span className="font-semibold">{result.unknown.join(", ")}</span></p>
        )}
        {result?.mode === "molecular" && (
          <div className="space-y-2">
            <p>Molecular weight: <span className="font-semibold">{formatNumber(result.molecularWeight, 6)} g/mol</span></p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border/70 p-2 text-xs">
              {result.breakdown.map((item) => (
                <p key={item.symbol}>
                  {item.symbol} × {item.count}: {formatNumber(item.contribution, 6)}
                </p>
              ))}
            </div>
          </div>
        )}
        {result?.mode === "tire" && (
          <div className="space-y-2">
            <p>Overall diameter: <span className="font-semibold">{formatNumber(result.diameterIn, 3)} in</span></p>
            <p>Circumference: <span className="font-semibold">{formatNumber(result.circumferenceIn, 3)} in</span></p>
            <p>Revolutions per mile: <span className="font-semibold">{formatNumber(result.revsPerMile, 2)}</span></p>
          </div>
        )}
        {result?.mode === "bandwidth" && (
          <div className="space-y-2">
            <p>Estimated transfer time: <span className="font-semibold">{result.formatted}</span></p>
            <p>Total seconds: <span className="font-semibold">{formatNumber(result.seconds, 2)}</span></p>
          </div>
        )}
        {result?.mode === "conversion" && (
          <div className="space-y-2">
            <p className="text-xl font-semibold">{result.label}</p>
            {result.feetInches && <p>Height breakdown: <span className="font-semibold">{result.feetInches}</span></p>}
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function SpeedPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const [distance, setDistance] = useState("100");
  const [timeHours, setTimeHours] = useState("2");
  const [torque, setTorque] = useState("300");
  const [rpm, setRpm] = useState("6000");

  const result = useMemo<
    | { kind: "hp"; hp: number }
    | { kind: "speed"; speed: number }
    | null
  >(() => {
    if (title.includes("horsepower")) {
      const hp = (parseNumber(torque) * parseNumber(rpm)) / 5252;
      return Number.isFinite(hp) ? { kind: "hp", hp } : null;
    }
    const d = parseNumber(distance);
    const t = parseNumber(timeHours);
    if (d <= 0 || t <= 0) return null;
    return { kind: "speed", speed: d / t };
  }, [distance, rpm, timeHours, title, torque]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {title.includes("horsepower") ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Torque (lb-ft)"><Input value={torque} onChange={(e) => setTorque(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="RPM"><Input value={rpm} onChange={(e) => setRpm(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Distance"><Input value={distance} onChange={(e) => setDistance(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Time (hours)"><Input value={timeHours} onChange={(e) => setTimeHours(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          </div>
        )}
      </section>
      <ResultCard title="Speed output">
        {!result && <p>Enter valid values.</p>}
        {result && result.kind === "hp" && <p>Horsepower: <span className="font-semibold">{formatNumber(result.hp, 2)} hp</span></p>}
        {result && result.kind === "speed" && <p>Speed: <span className="font-semibold">{formatNumber(result.speed, 4)} units/hour</span></p>}
      </ResultCard>
    </div>
  );
}

function FuelPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isMileageMode =
    title.includes("gas mileage") || title === "mileage calculator";
  const [distanceValue, setDistanceValue] = useState("120");
  const [distanceUnit, setDistanceUnit] = useState("mi");
  const [fuelValue, setFuelValue] = useState("4");
  const [fuelUnit, setFuelUnit] = useState("gal");
  const [efficiency, setEfficiency] = useState("7");
  const [fuelPrice, setFuelPrice] = useState("4");

  const result = useMemo(() => {
    if (isMileageMode) {
      const distance = parseNumber(distanceValue);
      const fuel = parseNumber(fuelValue);
      const price = parseNumber(fuelPrice);
      if (distance <= 0 || fuel <= 0 || price < 0) return null;
      const miles = distanceUnit === "km" ? distance * 0.621371 : distance;
      const gallons = fuelUnit === "l" ? fuel * 0.264172 : fuel;
      const mpg = miles / gallons;
      const kmPerL = (miles * 1.60934) / (gallons * 3.78541);
      const lPer100 = kmPerL > 0 ? 100 / kmPerL : 0;
      const totalCost = fuel * price;
      return {
        mode: "mileage",
        mpg,
        kmPerL,
        lPer100,
        totalCost,
        costPerMile: miles > 0 ? totalCost / miles : 0,
      } as const;
    }

    const distance = parseNumber(distanceValue);
    const lPer100 = parseNumber(efficiency);
    const price = parseNumber(fuelPrice);
    if (distance <= 0 || lPer100 <= 0 || price < 0) return null;
    const litersUsed = (distance / 100) * lPer100;
    return {
      mode: "cost",
      litersUsed,
      cost: litersUsed * price,
      costPerKm: (litersUsed * price) / distance,
    } as const;
  }, [
    distanceUnit,
    distanceValue,
    efficiency,
    fuelPrice,
    fuelUnit,
    fuelValue,
    isMileageMode,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isMileageMode ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Distance">
              <Input
                type="number"
                min="0"
                value={distanceValue}
                onChange={(event) => setDistanceValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Distance unit">
              <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mi">Miles</SelectItem>
                  <SelectItem value="km">Kilometers</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fuel used">
              <Input
                type="number"
                min="0"
                value={fuelValue}
                onChange={(event) => setFuelValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Fuel unit">
              <Select value={fuelUnit} onValueChange={setFuelUnit}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gal">Gallons</SelectItem>
                  <SelectItem value="l">Liters</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fuel price / selected fuel unit">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fuelPrice}
                onChange={(event) => setFuelPrice(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Distance (km)">
              <Input
                value={distanceValue}
                onChange={(event) => setDistanceValue(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Efficiency (L/100km)">
              <Input
                value={efficiency}
                onChange={(event) => setEfficiency(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
            <Field label="Fuel price / liter">
              <Input
                value={fuelPrice}
                onChange={(event) => setFuelPrice(event.target.value)}
                className="border-border/80 bg-background/80"
              />
            </Field>
          </div>
        )}
      </section>
      <ResultCard title={`${calculator.title} result`}>
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "mileage" && (
          <div className="space-y-2">
            <p>Fuel economy: <span className="font-semibold">{formatNumber(result.mpg, 4)} mpg</span></p>
            <p>Fuel economy: <span className="font-semibold">{formatNumber(result.kmPerL, 4)} km/L</span></p>
            <p>Fuel economy: <span className="font-semibold">{formatNumber(result.lPer100, 4)} L/100km</span></p>
            <p>Total fuel cost: <span className="font-semibold">{formatCurrency(result.totalCost)}</span></p>
            <p>Cost per mile: <span className="font-semibold">{formatCurrency(result.costPerMile)}</span></p>
          </div>
        )}
        {result?.mode === "cost" && (
          <div className="space-y-2">
            <p>Fuel used: <span className="font-semibold">{formatNumber(result.litersUsed, 2)} L</span></p>
            <p>Trip cost: <span className="font-semibold">{formatCurrency(result.cost)}</span></p>
            <p>Cost per km: <span className="font-semibold">{formatCurrency(result.costPerKm)}</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function ConstructionPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isBtu = title.includes("btu");
  const isStair = title.includes("stair");
  const isRoofing = title.includes("roofing");
  const isTile = title.includes("tile");
  const isSquareFootage = title.includes("square footage");
  const isMulch = title.includes("mulch");
  const isGravel = title.includes("gravel");
  const isConcrete = title.includes("concrete");

  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("10");
  const [depthInches, setDepthInches] = useState("4");
  const [wastePercent, setWastePercent] = useState("10");
  const [tileLength, setTileLength] = useState("12");
  const [tileWidth, setTileWidth] = useState("12");
  const [roofPitch, setRoofPitch] = useState("6/12");
  const [roomHeight, setRoomHeight] = useState("8");
  const [insulationLevel, setInsulationLevel] = useState("average");
  const [totalRise, setTotalRise] = useState("108");
  const [targetRiser, setTargetRiser] = useState("7");
  const [treadDepth, setTreadDepth] = useState("10");

  const result = useMemo(() => {
    const l = parseNumber(length);
    const w = parseNumber(width);
    const dFeet = parseNumber(depthInches) / 12;

    if (isBtu) {
      const h = parseNumber(roomHeight);
      if (l <= 0 || w <= 0 || h <= 0) return null;
      const area = l * w;
      const btuFactorByInsulation: Record<string, number> = {
        poor: 30,
        average: 24,
        good: 18,
      };
      const factor = btuFactorByInsulation[insulationLevel] ?? 24;
      return {
        mode: "btu",
        area,
        volume: area * h,
        btu: area * factor,
      } as const;
    }

    if (isStair) {
      const rise = parseNumber(totalRise);
      const riser = parseNumber(targetRiser);
      const tread = parseNumber(treadDepth);
      if (rise <= 0 || riser <= 0 || tread <= 0) return null;
      const steps = Math.max(1, Math.ceil(rise / riser));
      const actualRiser = rise / steps;
      const totalRun = Math.max(0, (steps - 1) * tread);
      const angle = Math.atan(actualRiser / tread) * (180 / Math.PI);
      return {
        mode: "stair",
        steps,
        actualRiser,
        totalRun,
        angle,
      } as const;
    }

    if (isRoofing) {
      if (l <= 0 || w <= 0) return null;
      const baseArea = l * w;
      const pitchMultiplier: Record<string, number> = {
        "2/12": 1.0138,
        "4/12": 1.0541,
        "6/12": 1.1180,
        "8/12": 1.2019,
        "10/12": 1.3017,
      };
      const adjustedArea = baseArea * (pitchMultiplier[roofPitch] ?? 1.118);
      const waste = Math.max(0, parseNumber(wastePercent));
      const totalArea = adjustedArea * (1 + waste / 100);
      return {
        mode: "roofing",
        totalArea,
        roofSquares: totalArea / 100,
        bundles: totalArea / 33.3,
      } as const;
    }

    if (isTile) {
      const tLen = parseNumber(tileLength);
      const tWid = parseNumber(tileWidth);
      if (l <= 0 || w <= 0 || tLen <= 0 || tWid <= 0) return null;
      const area = l * w;
      const tileArea = (tLen * tWid) / 144;
      const waste = Math.max(0, parseNumber(wastePercent));
      return {
        mode: "tile",
        area,
        tiles: (area / tileArea) * (1 + waste / 100),
      } as const;
    }

    if (isSquareFootage) {
      if (l <= 0 || w <= 0) return null;
      return {
        mode: "square",
        area: l * w,
        perimeter: 2 * (l + w),
      } as const;
    }

    if (l <= 0 || w <= 0 || dFeet <= 0) return null;
    const cubicFeet = l * w * dFeet;
    const cubicYards = cubicFeet / 27;
    if (isConcrete) {
      return {
        mode: "concrete",
        cubicFeet,
        cubicYards,
        bags60lb: cubicFeet / 0.45,
        bags80lb: cubicFeet / 0.6,
      } as const;
    }
    if (isMulch) {
      return {
        mode: "mulch",
        cubicFeet,
        cubicYards,
        bags2CuFt: cubicFeet / 2,
      } as const;
    }
    if (isGravel) {
      return {
        mode: "gravel",
        cubicFeet,
        cubicYards,
        tons: cubicYards * 1.4,
      } as const;
    }
    return {
      mode: "generic",
      squareFeet: l * w,
      cubicFeet,
      cubicYards,
    } as const;
  }, [
    depthInches,
    insulationLevel,
    isBtu,
    isConcrete,
    isGravel,
    isMulch,
    isRoofing,
    isSquareFootage,
    isStair,
    isTile,
    length,
    roofPitch,
    roomHeight,
    targetRiser,
    tileLength,
    tileWidth,
    totalRise,
    treadDepth,
    wastePercent,
    width,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isBtu ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Room length (ft)">
              <Input value={length} onChange={(event) => setLength(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Room width (ft)">
              <Input value={width} onChange={(event) => setWidth(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Ceiling height (ft)">
              <Input value={roomHeight} onChange={(event) => setRoomHeight(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Insulation quality">
              <Select value={insulationLevel} onValueChange={setInsulationLevel}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isStair ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Total rise (in)">
              <Input value={totalRise} onChange={(event) => setTotalRise(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Target riser (in)">
              <Input value={targetRiser} onChange={(event) => setTargetRiser(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Tread depth (in)">
              <Input value={treadDepth} onChange={(event) => setTreadDepth(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isRoofing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Roof length (ft)">
              <Input value={length} onChange={(event) => setLength(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Roof width (ft)">
              <Input value={width} onChange={(event) => setWidth(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Pitch">
              <Select value={roofPitch} onValueChange={setRoofPitch}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2/12">2/12</SelectItem>
                  <SelectItem value="4/12">4/12</SelectItem>
                  <SelectItem value="6/12">6/12</SelectItem>
                  <SelectItem value="8/12">8/12</SelectItem>
                  <SelectItem value="10/12">10/12</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Waste (%)">
              <Input value={wastePercent} onChange={(event) => setWastePercent(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isTile ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Floor length (ft)">
              <Input value={length} onChange={(event) => setLength(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Floor width (ft)">
              <Input value={width} onChange={(event) => setWidth(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Waste (%)">
              <Input value={wastePercent} onChange={(event) => setWastePercent(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Tile length (in)">
              <Input value={tileLength} onChange={(event) => setTileLength(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Tile width (in)">
              <Input value={tileWidth} onChange={(event) => setTileWidth(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Length (ft)">
              <Input value={length} onChange={(event) => setLength(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Width (ft)">
              <Input value={width} onChange={(event) => setWidth(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            {!isSquareFootage && (
              <Field label="Depth (in)">
                <Input value={depthInches} onChange={(event) => setDepthInches(event.target.value)} className="border-border/80 bg-background/80" />
              </Field>
            )}
          </div>
        )}
      </section>
      <ResultCard title={`${calculator.title} result`}>
        {!result && <p>Enter valid dimensions.</p>}
        {result?.mode === "btu" && (
          <div className="space-y-2">
            <p>Area: <span className="font-semibold">{formatNumber(result.area, 2)} sq ft</span></p>
            <p>Volume: <span className="font-semibold">{formatNumber(result.volume, 2)} cu ft</span></p>
            <p>Estimated BTU/h: <span className="font-semibold">{formatNumber(result.btu, 0)}</span></p>
          </div>
        )}
        {result?.mode === "stair" && (
          <div className="space-y-2">
            <p>Number of steps: <span className="font-semibold">{result.steps}</span></p>
            <p>Actual riser: <span className="font-semibold">{formatNumber(result.actualRiser, 3)} in</span></p>
            <p>Total run: <span className="font-semibold">{formatNumber(result.totalRun, 2)} in</span></p>
            <p>Stair angle: <span className="font-semibold">{formatNumber(result.angle, 2)}°</span></p>
          </div>
        )}
        {result?.mode === "roofing" && (
          <div className="space-y-2">
            <p>Total roof area: <span className="font-semibold">{formatNumber(result.totalArea, 2)} sq ft</span></p>
            <p>Roof squares: <span className="font-semibold">{formatNumber(result.roofSquares, 2)}</span></p>
            <p>Bundles needed: <span className="font-semibold">{formatNumber(result.bundles, 2)}</span></p>
          </div>
        )}
        {result?.mode === "tile" && (
          <div className="space-y-2">
            <p>Area: <span className="font-semibold">{formatNumber(result.area, 2)} sq ft</span></p>
            <p>Tile count: <span className="font-semibold">{formatNumber(result.tiles, 0)}</span></p>
          </div>
        )}
        {result?.mode === "square" && (
          <div className="space-y-2">
            <p>Area: <span className="font-semibold">{formatNumber(result.area, 2)} sq ft</span></p>
            <p>Perimeter: <span className="font-semibold">{formatNumber(result.perimeter, 2)} ft</span></p>
          </div>
        )}
        {result?.mode === "concrete" && (
          <div className="space-y-2">
            <p>Volume: <span className="font-semibold">{formatNumber(result.cubicFeet, 2)} cu ft</span></p>
            <p>Volume: <span className="font-semibold">{formatNumber(result.cubicYards, 2)} cu yd</span></p>
            <p>60 lb bags: <span className="font-semibold">{formatNumber(result.bags60lb, 0)}</span></p>
            <p>80 lb bags: <span className="font-semibold">{formatNumber(result.bags80lb, 0)}</span></p>
          </div>
        )}
        {result?.mode === "mulch" && (
          <div className="space-y-2">
            <p>Volume: <span className="font-semibold">{formatNumber(result.cubicYards, 2)} cu yd</span></p>
            <p>2 cu ft bags: <span className="font-semibold">{formatNumber(result.bags2CuFt, 0)}</span></p>
          </div>
        )}
        {result?.mode === "gravel" && (
          <div className="space-y-2">
            <p>Volume: <span className="font-semibold">{formatNumber(result.cubicYards, 2)} cu yd</span></p>
            <p>Estimated tons: <span className="font-semibold">{formatNumber(result.tons, 2)}</span></p>
          </div>
        )}
        {result?.mode === "generic" && (
          <div className="space-y-2">
            <p>Area: <span className="font-semibold">{formatNumber(result.squareFeet, 2)} sq ft</span></p>
            <p>Volume: <span className="font-semibold">{formatNumber(result.cubicFeet, 2)} cu ft</span></p>
            <p>Volume: <span className="font-semibold">{formatNumber(result.cubicYards, 2)} cu yd</span></p>
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function OhmPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isVoltageDrop = title.includes("voltage drop");
  const isResistor = title.includes("resistor");
  const isElectricity = title.includes("electricity");

  const [voltage, setVoltage] = useState("120");
  const [current, setCurrent] = useState("5");
  const [resistance, setResistance] = useState("");

  const [vdCurrent, setVdCurrent] = useState("15");
  const [vdLength, setVdLength] = useState("100");
  const [vdResistancePer1000, setVdResistancePer1000] = useState("1.588");
  const [vdSupplyVoltage, setVdSupplyVoltage] = useState("120");

  const [band1, setBand1] = useState("brown");
  const [band2, setBand2] = useState("black");
  const [multiplierBand, setMultiplierBand] = useState("red");
  const [toleranceBand, setToleranceBand] = useState("gold");

  const [watts, setWatts] = useState("800");
  const [hoursPerDay, setHoursPerDay] = useState("5");
  const [billingDays, setBillingDays] = useState("30");
  const [ratePerKwh, setRatePerKwh] = useState("0.18");

  const result = useMemo(() => {
    if (isVoltageDrop) {
      const amps = parseNumber(vdCurrent);
      const lengthFt = parseNumber(vdLength);
      const resistancePer1000 = parseNumber(vdResistancePer1000);
      const sourceVoltage = parseNumber(vdSupplyVoltage);
      if (amps <= 0 || lengthFt <= 0 || resistancePer1000 <= 0 || sourceVoltage <= 0) {
        return null;
      }
      const roundTripResistance = (lengthFt * 2 * resistancePer1000) / 1000;
      const voltageDrop = amps * roundTripResistance;
      return {
        mode: "voltage-drop",
        voltageDrop,
        dropPercent: (voltageDrop / sourceVoltage) * 100,
        loadVoltage: sourceVoltage - voltageDrop,
      } as const;
    }

    if (isResistor) {
      const digitMap: Record<string, number> = {
        black: 0,
        brown: 1,
        red: 2,
        orange: 3,
        yellow: 4,
        green: 5,
        blue: 6,
        violet: 7,
        gray: 8,
        white: 9,
      };
      const multiplierMap: Record<string, number> = {
        black: 1,
        brown: 10,
        red: 100,
        orange: 1000,
        yellow: 10000,
        green: 100000,
        blue: 1000000,
        violet: 10000000,
        gray: 100000000,
        white: 1000000000,
        gold: 0.1,
        silver: 0.01,
      };
      const toleranceMap: Record<string, number> = {
        brown: 1,
        red: 2,
        green: 0.5,
        blue: 0.25,
        violet: 0.1,
        gray: 0.05,
        gold: 5,
        silver: 10,
      };
      const base = digitMap[band1] * 10 + digitMap[band2];
      const ohms = base * (multiplierMap[multiplierBand] ?? 1);
      const tolerance = toleranceMap[toleranceBand] ?? 5;
      return {
        mode: "resistor",
        ohms,
        tolerance,
        min: ohms * (1 - tolerance / 100),
        max: ohms * (1 + tolerance / 100),
      } as const;
    }

    if (isElectricity) {
      const power = parseNumber(watts);
      const hours = parseNumber(hoursPerDay);
      const days = parseNumber(billingDays);
      const rate = parseNumber(ratePerKwh);
      if (power <= 0 || hours <= 0 || days <= 0 || rate < 0) return null;
      const kwh = (power / 1000) * hours * days;
      return {
        mode: "electricity",
        kwh,
        cost: kwh * rate,
      } as const;
    }

    const hasVoltage = voltage.trim().length > 0;
    const hasCurrent = current.trim().length > 0;
    const hasResistance = resistance.trim().length > 0;
    const knownCount = [hasVoltage, hasCurrent, hasResistance].filter(Boolean).length;
    if (knownCount < 2) return null;

    let v = hasVoltage ? parseNumber(voltage) : 0;
    let i = hasCurrent ? parseNumber(current) : 0;
    let r = hasResistance ? parseNumber(resistance) : 0;
    if ((!hasResistance && i <= 0) || (!hasCurrent && r <= 0) || (!hasVoltage && i <= 0)) {
      return null;
    }
    if (!hasVoltage) v = i * r;
    if (!hasCurrent) i = r === 0 ? 0 : v / r;
    if (!hasResistance) r = i === 0 ? 0 : v / i;
    if (v <= 0 || i <= 0 || r <= 0) return null;
    const expectedR = v / i;
    const mismatchPercent = Math.abs(expectedR - r) / expectedR * 100;
    return {
      mode: "ohm",
      voltage: v,
      current: i,
      resistance: r,
      power: v * i,
      mismatchPercent,
    } as const;
  }, [
    band1,
    band2,
    billingDays,
    current,
    hoursPerDay,
    isElectricity,
    isResistor,
    isVoltageDrop,
    multiplierBand,
    ratePerKwh,
    resistance,
    toleranceBand,
    vdCurrent,
    vdLength,
    vdResistancePer1000,
    vdSupplyVoltage,
    voltage,
    watts,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isVoltageDrop ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Current (A)">
              <Input value={vdCurrent} onChange={(event) => setVdCurrent(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="One-way wire length (ft)">
              <Input value={vdLength} onChange={(event) => setVdLength(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Resistance (Ω / 1000 ft)">
              <Input value={vdResistancePer1000} onChange={(event) => setVdResistancePer1000(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Supply voltage (V)">
              <Input value={vdSupplyVoltage} onChange={(event) => setVdSupplyVoltage(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isResistor ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Band 1">
              <Select value={band1} onValueChange={setBand1}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem><SelectItem value="brown">Brown</SelectItem><SelectItem value="red">Red</SelectItem><SelectItem value="orange">Orange</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="blue">Blue</SelectItem><SelectItem value="violet">Violet</SelectItem><SelectItem value="gray">Gray</SelectItem><SelectItem value="white">White</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Band 2">
              <Select value={band2} onValueChange={setBand2}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem><SelectItem value="brown">Brown</SelectItem><SelectItem value="red">Red</SelectItem><SelectItem value="orange">Orange</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="blue">Blue</SelectItem><SelectItem value="violet">Violet</SelectItem><SelectItem value="gray">Gray</SelectItem><SelectItem value="white">White</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Multiplier">
              <Select value={multiplierBand} onValueChange={setMultiplierBand}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black ×1</SelectItem><SelectItem value="brown">Brown ×10</SelectItem><SelectItem value="red">Red ×100</SelectItem><SelectItem value="orange">Orange ×1k</SelectItem><SelectItem value="yellow">Yellow ×10k</SelectItem><SelectItem value="green">Green ×100k</SelectItem><SelectItem value="blue">Blue ×1M</SelectItem><SelectItem value="gold">Gold ×0.1</SelectItem><SelectItem value="silver">Silver ×0.01</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tolerance">
              <Select value={toleranceBand} onValueChange={setToleranceBand}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brown">Brown ±1%</SelectItem>
                  <SelectItem value="red">Red ±2%</SelectItem>
                  <SelectItem value="green">Green ±0.5%</SelectItem>
                  <SelectItem value="blue">Blue ±0.25%</SelectItem>
                  <SelectItem value="gold">Gold ±5%</SelectItem>
                  <SelectItem value="silver">Silver ±10%</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isElectricity ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Power draw (W)">
              <Input value={watts} onChange={(event) => setWatts(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Hours used per day">
              <Input value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Billing period (days)">
              <Input value={billingDays} onChange={(event) => setBillingDays(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Rate ($/kWh)">
              <Input value={ratePerKwh} onChange={(event) => setRatePerKwh(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Voltage (V)">
              <Input value={voltage} onChange={(event) => setVoltage(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Current (A)">
              <Input value={current} onChange={(event) => setCurrent(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Resistance (Ω)">
              <Input value={resistance} onChange={(event) => setResistance(event.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        )}
      </section>
      <ResultCard title={`${calculator.title} output`}>
        {!result && <p>Enter valid electrical values.</p>}
        {result?.mode === "voltage-drop" && (
          <div className="space-y-2">
            <p>Voltage drop: <span className="font-semibold">{formatNumber(result.voltageDrop, 4)} V</span></p>
            <p>Drop percentage: <span className="font-semibold">{formatNumber(result.dropPercent, 3)}%</span></p>
            <p>Voltage at load: <span className="font-semibold">{formatNumber(result.loadVoltage, 4)} V</span></p>
          </div>
        )}
        {result?.mode === "resistor" && (
          <div className="space-y-2">
            <p>Nominal resistance: <span className="font-semibold">{formatNumber(result.ohms, 4)} Ω</span></p>
            <p>Tolerance: <span className="font-semibold">±{formatNumber(result.tolerance, 2)}%</span></p>
            <p>Range: <span className="font-semibold">{formatNumber(result.min, 4)} Ω to {formatNumber(result.max, 4)} Ω</span></p>
          </div>
        )}
        {result?.mode === "electricity" && (
          <div className="space-y-2">
            <p>Energy usage: <span className="font-semibold">{formatNumber(result.kwh, 4)} kWh</span></p>
            <p>Estimated cost: <span className="font-semibold">{formatCurrency(result.cost)}</span></p>
          </div>
        )}
        {result?.mode === "ohm" && (
          <div className="space-y-2">
            <p>Voltage: <span className="font-semibold">{formatNumber(result.voltage, 4)} V</span></p>
            <p>Current: <span className="font-semibold">{formatNumber(result.current, 4)} A</span></p>
            <p>Resistance: <span className="font-semibold">{formatNumber(result.resistance, 4)} Ω</span></p>
            <p>Power: <span className="font-semibold">{formatNumber(result.power, 4)} W</span></p>
            {result.mismatchPercent > 0.5 && (
              <p className="text-amber-500">
                Provided values are not perfectly consistent (difference {formatNumber(result.mismatchPercent, 2)}%).
              </p>
            )}
          </div>
        )}
      </ResultCard>
    </div>
  );
}

function WeatherPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const [tempC, setTempC] = useState("30");
  const [humidity, setHumidity] = useState("70");
  const [windKph, setWindKph] = useState("20");

  const result = useMemo(() => {
    const t = parseNumber(tempC);
    const h = parseNumber(humidity);
    const w = parseNumber(windKph);
    if (title.includes("wind chill")) {
      const wc = 13.12 + 0.6215 * t - 11.37 * w ** 0.16 + 0.3965 * t * w ** 0.16;
      return { label: "Wind chill", value: wc };
    }
    if (title.includes("dew point")) {
      const a = 17.27;
      const b = 237.7;
      const alpha = (a * t) / (b + t) + Math.log(h / 100);
      const dew = (b * alpha) / (a - alpha);
      return { label: "Dew point", value: dew };
    }
    const hi =
      -8.784695 +
      1.61139411 * t +
      2.338549 * h -
      0.14611605 * t * h -
      0.012308094 * t * t -
      0.016424828 * h * h +
      0.002211732 * t * t * h +
      0.00072546 * t * h * h -
      0.000003582 * t * t * h * h;
    return { label: "Heat index", value: hi };
  }, [humidity, tempC, title, windKph]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Temperature (°C)"><Input value={tempC} onChange={(e) => setTempC(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          <Field label="Humidity (%)"><Input value={humidity} onChange={(e) => setHumidity(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          <Field label="Wind (km/h)"><Input value={windKph} onChange={(e) => setWindKph(e.target.value)} className="border-border/80 bg-background/80" /></Field>
        </div>
      </section>
      <ResultCard title="Weather metric">
        {!result ? <p>Enter valid values.</p> : <p>{result.label}: <span className="font-semibold">{formatNumber(result.value, 2)} °C</span></p>}
      </ResultCard>
    </div>
  );
}

function EmbedPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("780");
  const embedCode = `<iframe src=\"https://www.thestash.xyz/calculators/${calculator.slug}\" width=\"${width}\" height=\"${height}\" style=\"border:0;border-radius:12px;\" loading=\"lazy\" title=\"${calculator.title}\"></iframe>`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Embed width"><Input value={width} onChange={(e) => setWidth(e.target.value)} className="border-border/80 bg-background/80" /></Field>
          <Field label="Embed height"><Input value={height} onChange={(e) => setHeight(e.target.value)} className="border-border/80 bg-background/80" /></Field>
        </div>
      </section>
      <ResultCard title="Embed snippet">
        <pre className="overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/60 p-3 text-xs">{embedCode}</pre>
      </ResultCard>
    </div>
  );
}

function GenericPanel({ calculator }: { calculator: CalculatorDefinition }) {
  const title = calculator.title.toLowerCase();
  const isSubnet = title.includes("ip subnet");
  const isBraSize = title.includes("bra size");
  const isGolf = title.includes("golf handicap");

  const [a, setA] = useState("10");
  const [b, setB] = useState("5");
  const [mode, setMode] = useState<"add" | "subtract" | "multiply" | "divide">("add");
  const [ipAddress, setIpAddress] = useState("192.168.1.10");
  const [cidr, setCidr] = useState("24");
  const [bustSize, setBustSize] = useState("38");
  const [bandSize, setBandSize] = useState("34");
  const [bandMethod, setBandMethod] = useState<"direct" | "plus4">("direct");
  const [handicapIndex, setHandicapIndex] = useState("10.4");
  const [slopeRating, setSlopeRating] = useState("121");
  const [courseRating, setCourseRating] = useState("71.3");
  const [coursePar, setCoursePar] = useState("72");
  const [grossScore, setGrossScore] = useState("85");

  const result = useMemo<
    | {
        mode: "subnet";
        networkAddress: string;
        broadcastAddress: string;
        subnetMask: string;
        firstHost: string;
        lastHost: string;
        hostCount: number;
      }
    | { mode: "bra"; usSize: string; band: number; cup: string; difference: number }
    | { mode: "golf"; courseHandicap: number; scoreDifferential: number; netScore: number }
    | { mode: "basic"; value: number | null }
    | null
  >(() => {
    if (isSubnet) {
      const ipInt = ipv4ToInt(ipAddress.trim());
      const prefix = Math.round(parseNumber(cidr));
      if (ipInt == null || prefix < 0 || prefix > 32) return null;

      const hostBits = 32 - prefix;
      const maskInt = prefix === 0 ? 0 : ((0xffffffff << hostBits) >>> 0);
      const network = ipInt & maskInt;
      const broadcast = (network | (~maskInt >>> 0)) >>> 0;
      const hostCount = hostBits <= 1 ? Math.max(0, 2 ** hostBits) : 2 ** hostBits - 2;
      const firstHost =
        hostBits === 0 ? network : hostBits === 1 ? network : (network + 1) >>> 0;
      const lastHost =
        hostBits === 0
          ? network
          : hostBits === 1
            ? broadcast
            : (broadcast - 1) >>> 0;

      return {
        mode: "subnet",
        networkAddress: intToIpv4(network),
        broadcastAddress: intToIpv4(broadcast),
        subnetMask: intToIpv4(maskInt),
        firstHost: intToIpv4(firstHost),
        lastHost: intToIpv4(lastHost),
        hostCount,
      };
    }

    if (isBraSize) {
      const bust = parseNumber(bustSize);
      const band = parseNumber(bandSize);
      if (bust <= 0 || band <= 0) return null;

      const normalizedBand = Math.max(
        26,
        Math.round((bandMethod === "plus4" ? band + 4 : band) / 2) * 2
      );
      const difference = bust - normalizedBand;
      const cupOrder = [
        "AA",
        "A",
        "B",
        "C",
        "D",
        "DD",
        "DDD/F",
        "G",
        "H",
        "I",
        "J",
        "K",
      ];
      const cupIndex = clamp(Math.round(difference), 0, cupOrder.length - 1);

      return {
        mode: "bra",
        usSize: `${normalizedBand}${cupOrder[cupIndex]}`,
        band: normalizedBand,
        cup: cupOrder[cupIndex],
        difference,
      };
    }

    if (isGolf) {
      const index = parseNumber(handicapIndex);
      const slope = parseNumber(slopeRating);
      const rating = parseNumber(courseRating);
      const par = parseNumber(coursePar);
      const gross = parseNumber(grossScore);
      if (slope <= 0 || par <= 0) return null;

      const courseHandicap = Math.round(index * (slope / 113) + (rating - par));
      const scoreDifferential = ((gross - rating) * 113) / slope;
      const netScore = gross - courseHandicap;
      return { mode: "golf", courseHandicap, scoreDifferential, netScore };
    }

    const x = parseNumber(a);
    const y = parseNumber(b);
    if (mode === "add") return { mode: "basic", value: x + y };
    if (mode === "subtract") return { mode: "basic", value: x - y };
    if (mode === "multiply") return { mode: "basic", value: x * y };
    return { mode: "basic", value: y === 0 ? null : x / y };
  }, [
    a,
    b,
    bandMethod,
    bandSize,
    bustSize,
    cidr,
    coursePar,
    courseRating,
    grossScore,
    handicapIndex,
    ipAddress,
    isBraSize,
    isGolf,
    isSubnet,
    mode,
    slopeRating,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-xl border border-border/80 bg-background/70 p-4">
        {isSubnet ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="IPv4 address">
              <Input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="CIDR prefix">
              <Input type="number" min="0" max="32" value={cidr} onChange={(e) => setCidr(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : isBraSize ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Bust (inches)">
              <Input type="number" min="0" step="0.1" value={bustSize} onChange={(e) => setBustSize(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Band (inches)">
              <Input type="number" min="0" step="0.1" value={bandSize} onChange={(e) => setBandSize(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Band method">
              <Select value={bandMethod} onValueChange={(value) => setBandMethod(value as "direct" | "plus4")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct underbust</SelectItem>
                  <SelectItem value="plus4">Underbust +4</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : isGolf ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Handicap index">
              <Input type="number" step="0.1" value={handicapIndex} onChange={(e) => setHandicapIndex(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Slope rating">
              <Input type="number" step="1" value={slopeRating} onChange={(e) => setSlopeRating(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Course rating">
              <Input type="number" step="0.1" value={courseRating} onChange={(e) => setCourseRating(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Course par">
              <Input type="number" step="1" value={coursePar} onChange={(e) => setCoursePar(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
            <Field label="Gross score">
              <Input type="number" step="1" value={grossScore} onChange={(e) => setGrossScore(e.target.value)} className="border-border/80 bg-background/80" />
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Value A"><Input value={a} onChange={(e) => setA(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Value B"><Input value={b} onChange={(e) => setB(e.target.value)} className="border-border/80 bg-background/80" /></Field>
            <Field label="Operation">
              <Select value={mode} onValueChange={(v) => setMode(v as "add" | "subtract" | "multiply" | "divide")}>
                <SelectTrigger className="border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">A + B</SelectItem>
                  <SelectItem value="subtract">A - B</SelectItem>
                  <SelectItem value="multiply">A × B</SelectItem>
                  <SelectItem value="divide">A ÷ B</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </section>
      <ResultCard title={`${calculator.title} output`}>
        {!result && <p>Enter valid values.</p>}
        {result?.mode === "subnet" && (
          <div className="space-y-2">
            <p>Subnet mask: <span className="font-semibold">{result.subnetMask}</span></p>
            <p>Network address: <span className="font-semibold">{result.networkAddress}</span></p>
            <p>Broadcast address: <span className="font-semibold">{result.broadcastAddress}</span></p>
            <p>Usable host range: <span className="font-semibold">{result.firstHost} - {result.lastHost}</span></p>
            <p>Usable hosts: <span className="font-semibold">{formatNumber(result.hostCount, 0)}</span></p>
          </div>
        )}
        {result?.mode === "bra" && (
          <div className="space-y-2">
            <p>Estimated US size: <span className="font-semibold">{result.usSize}</span></p>
            <p>Band size: <span className="font-semibold">{result.band}</span></p>
            <p>Cup: <span className="font-semibold">{result.cup}</span></p>
            <p>Bust-band difference: <span className="font-semibold">{formatNumber(result.difference, 2)} in</span></p>
          </div>
        )}
        {result?.mode === "golf" && (
          <div className="space-y-2">
            <p>Course handicap: <span className="font-semibold">{result.courseHandicap}</span></p>
            <p>Score differential: <span className="font-semibold">{formatNumber(result.scoreDifferential, 2)}</span></p>
            <p>Net score estimate: <span className="font-semibold">{formatNumber(result.netScore, 2)}</span></p>
          </div>
        )}
        {result?.mode === "basic" &&
          (result.value == null ? (
            <p>Enter valid values (cannot divide by zero).</p>
          ) : (
            <p className="text-2xl font-semibold">{formatNumber(result.value, 8)}</p>
          ))}
      </ResultCard>
    </div>
  );
}

export function CalculatorWorkbench({ calculator }: CalculatorWorkbenchProps) {
  const engine = calculator.engine;

  return (
    <section className="mt-8 section-panel sm:p-6" aria-labelledby="calculator-workbench-title">
      <header className="mb-4">
        <h2 id="calculator-workbench-title" className="section-title">
          Try {calculator.title}
        </h2>
        <p className="section-copy">
          Enter your values, review the result instantly, and test scenarios with updated inputs.
        </p>
      </header>

      {engine === "bmi" && <BmiCalculatorPanel />}
      {engine === "mortgage" && <MortgageCalculatorPanel />}
      {engine === "loan" && <LoanCalculatorPanel />}
      {engine === "growth" && <InterestCalculatorPanel />}
      {engine === "percentage" && <PercentageCalculatorPanel calculator={calculator} />}
      {engine === "age" && <AgeCalculatorPanel />}
      {engine === "time" && <TimeCalculatorPanel calculator={calculator} />}
      {engine === "tax" && <TaxCalculatorPanel calculator={calculator} />}
      {engine === "debt" && <DebtCalculatorPanel calculator={calculator} />}
      {engine === "financial-metrics" && <FinancialMetricsPanel calculator={calculator} />}
      {engine === "affordability" && <AffordabilityPanel calculator={calculator} />}
      {engine === "currency" && <CurrencyPanel />}
      {engine === "inflation" && <InflationPanel />}
      {engine === "calorie" && <CaloriePanel calculator={calculator} />}
      {engine === "body-fat" && <BodyFatPanel calculator={calculator} />}
      {engine === "pregnancy" && <PregnancyPanel calculator={calculator} />}
      {engine === "pace" && <PacePanel calculator={calculator} />}
      {engine === "scientific" && <ScientificPanel calculator={calculator} />}
      {engine === "geometry" && <GeometryPanel calculator={calculator} />}
      {engine === "statistics" && <StatisticsPanel calculator={calculator} />}
      {engine === "random" && <RandomPanel calculator={calculator} />}
      {engine === "password" && <PasswordGeneratorPanel />}
      {engine === "grade" && <GradePanel calculator={calculator} />}
      {engine === "conversion" && <ConversionPanel calculator={calculator} />}
      {engine === "speed" && <SpeedPanel calculator={calculator} />}
      {engine === "fuel" && <FuelPanel calculator={calculator} />}
      {engine === "construction" && <ConstructionPanel calculator={calculator} />}
      {engine === "ohm" && <OhmPanel calculator={calculator} />}
      {engine === "weather" && <WeatherPanel calculator={calculator} />}
      {engine === "embed" && <EmbedPanel calculator={calculator} />}
      {engine === "generic" && <GenericPanel calculator={calculator} />}
    </section>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getCalculatorCategory,
  type CalculatorDefinition,
} from "@/lib/calculators-catalog";

type CalculatorCardProps = {
  calculator: CalculatorDefinition;
  href?: string;
  className?: string;
};

export function CalculatorCard({
  calculator,
  href,
  className,
}: CalculatorCardProps) {
  const category = getCalculatorCategory(calculator.category);

  return (
    <Link
      href={href ?? `/calculators/${calculator.slug}`}
      className={cn(
        "block rounded-2xl border border-border/80 bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.05]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-border/90 bg-background/70 text-[0.65rem] uppercase tracking-[0.11em] text-muted-foreground"
        >
          {category.label}
        </Badge>
        {calculator.featured && (
          <Badge
            variant="secondary"
            className="bg-primary/[0.12] text-[0.65rem] uppercase tracking-[0.11em] text-primary"
          >
            Featured
          </Badge>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground sm:text-lg">
        {calculator.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {calculator.summary}
      </p>
      <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Open calculator
        <ArrowUpRight className="size-4" aria-hidden />
      </p>
    </Link>
  );
}

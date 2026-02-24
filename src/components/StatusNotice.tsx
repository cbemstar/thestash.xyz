import type { ReactNode } from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

type StatusNoticeVariant = "helper" | "warning" | "error" | "success";

interface StatusNoticeProps {
  variant: StatusNoticeVariant;
  title: string;
  description?: string;
  items?: string[];
  action?: ReactNode;
  className?: string;
}

const variantClassMap: Record<StatusNoticeVariant, string> = {
  helper: "border-border/80 bg-muted/20 text-muted-foreground",
  warning:
    "border-amber-400/50 bg-amber-50/70 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  error:
    "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20",
  success: "border-primary/40 bg-primary/10 text-primary dark:bg-primary/20",
};

const iconMap: Record<StatusNoticeVariant, typeof IconInfoCircle> = {
  helper: IconInfoCircle,
  warning: IconAlertTriangle,
  error: IconAlertCircle,
  success: IconCircleCheck,
};

export function StatusNotice({
  variant,
  title,
  description,
  items = [],
  action,
  className = "",
}: StatusNoticeProps) {
  const Icon = iconMap[variant];
  const semanticRole = variant === "error" || variant === "warning" ? "alert" : "status";

  return (
    <section
      role={semanticRole}
      className={`rounded-xl border p-4 text-sm ${variantClassMap[variant]} ${className}`.trim()}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {description ? <p className="mt-1 leading-6">{description}</p> : null}
          {items.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}

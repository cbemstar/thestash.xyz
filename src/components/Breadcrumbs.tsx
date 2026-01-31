import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string };

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Accessible label for the nav. Default: "Breadcrumb" */
  "aria-label"?: string;
  className?: string;
}

/**
 * Semantic breadcrumb navigation for SEO and accessibility.
 * Last item is current page (no href). Use schema.org BreadcrumbList in page when needed.
 */
export function Breadcrumbs({
  items,
  "aria-label": ariaLabel = "Breadcrumb",
  className = "",
}: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              className="flex items-center gap-x-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {i > 0 && (
                <span
                  className="text-muted-foreground/60 select-none"
                  aria-hidden
                >
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="font-medium text-foreground"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  itemProp="item"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

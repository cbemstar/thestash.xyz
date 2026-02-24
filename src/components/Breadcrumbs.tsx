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
    <nav aria-label={ariaLabel} className={`min-w-0 ${className}`.trim()}>
      <ol
        className="m-0 flex w-fit max-w-full list-none flex-wrap items-center gap-x-2 p-0 text-[0.8125rem] leading-5 text-muted-foreground"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li
              key={i}
              className="inline-flex min-w-0 flex-none list-none items-center gap-x-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast || !item.href ? (
                <span
                  title={item.label}
                  className="max-w-[min(72vw,34rem)] truncate font-medium text-foreground"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  title={item.label}
                  className="max-w-[min(55vw,24rem)] truncate underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  itemProp="item"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              )}
              {!isLast && (
                <span
                  className="text-muted-foreground/55 select-none"
                  aria-hidden
                >
                  /
                </span>
              )}
              <meta itemProp="position" content={String(i + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

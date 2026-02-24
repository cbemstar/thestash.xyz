import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type FeatureHubLink = {
  href: string;
  label: string;
};

type FeatureHubBreadcrumb = {
  label: string;
  href?: string;
};

interface FeatureHubScaffoldProps {
  breadcrumbs: FeatureHubBreadcrumb[];
  kicker: string;
  title: string;
  description: string;
  primaryLinks?: FeatureHubLink[];
  secondaryTitle?: string;
  secondaryLinks?: FeatureHubLink[];
  children: ReactNode;
}

export function FeatureHubScaffold({
  breadcrumbs,
  kicker,
  title,
  description,
  primaryLinks = [],
  secondaryTitle,
  secondaryLinks = [],
  children,
}: FeatureHubScaffoldProps) {
  return (
    <>
      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      <header className="insight-hero">
        <p className="insight-kicker">{kicker}</p>
        <h1 className="insight-title">{title}</h1>
        <p className="insight-lead">{description}</p>
        {primaryLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="pill-link">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {children}

      {secondaryTitle && secondaryLinks.length > 0 && (
        <section className="section-panel">
          <h2 className="section-title">{secondaryTitle}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {secondaryLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="pill-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getResourceBySlug, getAllResourceSlugs } from "@/lib/sanity.resource";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import { getResourceSlug } from "@/lib/slug";
import type { Resource } from "@/types/resource";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";
const RESERVED_SLUGS = ["studio", "api"];

function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

export async function generateStaticParams() {
  const slugs = await getAllResourceSlugs();
  return slugs
    .filter((s) => !RESERVED_SLUGS.includes(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource) return { title: "Not found" };

  const title = `${resource.title} | The Stash`;
  const description =
    resource.description ||
    `${resource.title} — dev & design resource. ${getCategoryLabel(resource.category)}.`;
  const canonical = `${BASE_URL}/${slug}`;
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(120).height(120).url()
    : faviconForUrl(resource.url);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Stash",
      type: "website",
      images: iconSource ? [{ url: iconSource, width: 120, height: 120 }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function ResourceJsonLd({ resource }: { resource: Resource }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: resource.title,
    description: resource.description,
    url: resource.url,
    applicationCategory: getCategoryLabel(resource.category),
    ...(resource.tags?.length
      ? { keywords: resource.tags.join(", ") }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) notFound();
  const resource = await getResourceBySlug(slug);
  if (!resource) notFound();

  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(120).height(120).url()
    : faviconForUrl(resource.url);

  return (
    <>
      <ResourceJsonLd resource={resource} />
      <div className="min-h-screen">
        <header className="border-b border-[var(--border)] bg-background/90 backdrop-blur-md sticky top-0 z-10">
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← The Stash
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <article className="space-y-6">
            <div className="flex items-start gap-4">
              {iconSource ? (
                <span className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  <Image
                    src={iconSource}
                    alt=""
                    width={56}
                    height={56}
                    className="object-cover"
                    unoptimized={iconSource.includes("google.com/s2/favicons")}
                  />
                </span>
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 font-display text-xl text-zinc-400"
                  aria-hidden
                >
                  {resource.title.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                  {getCategoryLabel(resource.category)}
                </p>
                <h1 className="font-display text-2xl font-bold text-zinc-100 sm:text-3xl mt-0.5">
                  {resource.title}
                </h1>
              </div>
            </div>

            <p className="text-zinc-300 leading-relaxed text-lg">
              {resource.description}
            </p>

            {Array.isArray(resource.tags) && resource.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Tags">
                {resource.tags.map((tag) => (
                  <li key={tag}>
                    <span className="rounded-lg bg-white/10 px-3 py-1 text-sm text-zinc-400">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              >
                Visit site
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              >
                All resources
              </Link>
            </div>
          </article>
        </main>
      </div>
    </>
  );
}

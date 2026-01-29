import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity.image";
import { getCategoryLabel } from "@/lib/categories";
import type { Resource } from "@/types/resource";

interface ResourceCardProps {
  resource: Resource;
}

/** Favicon URL for a given origin. */
function faviconForUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const iconSource = resource.icon?.asset?._ref
    ? urlFor(resource.icon).width(80).height(80).url()
    : faviconForUrl(resource.url);

  return (
    <Link
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-accent/10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ minHeight: "44px" }}
    >
      <div className="mb-3 flex items-center gap-3">
        {iconSource ? (
          <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
            <Image
              src={iconSource}
              alt=""
              width={40}
              height={40}
              className="object-cover"
              unoptimized={iconSource.includes("google.com/s2/favicons")}
            />
          </span>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-sm text-zinc-400" aria-hidden>
            {resource.title.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          {getCategoryLabel(resource.category)}
        </span>
      </div>
      <h2 className="font-display text-lg font-semibold leading-snug text-zinc-100 group-hover:text-white">
        {resource.title}
      </h2>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
        {resource.description}
      </p>
      {Array.isArray(resource.tags) && resource.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {resource.tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-zinc-500">
                {tag}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

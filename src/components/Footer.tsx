import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-background/80 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500" aria-label="Footer">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            The Stash
          </Link>
          <Link href="/collections" className="hover:text-zinc-300 transition-colors">
            Collections
          </Link>
          <a href="/studio" className="hover:text-zinc-300 transition-colors">
            Submit a resource
          </a>
        </nav>
        <p className="mt-4 text-center text-xs text-zinc-600">
          © {year} The Stash
        </p>
      </div>
    </footer>
  );
}

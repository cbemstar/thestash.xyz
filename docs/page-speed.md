# PageSpeed Insights — Fixes & Checklist

**Report:** [PageSpeed Insights – thestash.xyz](https://pagespeed.web.dev/analysis/https-thestash.xyz/)

---

## Fixes applied

### Best practices

- **Links opening in new tab:** All `target="_blank"` links now include `rel="noopener noreferrer"` (including `src/components/ui/skiper-ui/skiper40.tsx`). This avoids the “Links to cross-origin destinations are unsafe” audit.
- **Passive scroll listeners:** The gantt component scroll listener uses `{ passive: true }` so scrolling isn’t blocked. This helps the “Uses passive listeners to improve scrolling performance” audit.

### Performance (already in place)

- AdSense loaded with `next/Script` `strategy="lazyOnload"`.
- Preconnect to `cdn.sanity.io`; dns-prefetch for GTM and AdSense.
- LCP: `priority` on above-the-fold images (FeaturedCarousel, first 6 ResourceGrid items).
- CLS: PillNav `<img>` has `width`/`height` and `decoding="async"`.
- `experimental.optimizePackageImports` for `radix-ui` and `@radix-ui/react-icons`.

---

## What to check after the next run

When you run PageSpeed again, use the **Desktop** and **Mobile** reports and note:

1. **Best practices**  
   Expand the section and fix any remaining items (e.g. image aspect ratio, console errors, HTTPS).

2. **Performance – “Diagnose performance issues”**  
   For each “Critical” or “Opportunity”:
   - **Largest Contentful Paint** – Consider `priority` or `fetchPriority="high"` on the LCP image if it’s not already prioritized.
   - **Total Blocking Time** – Defer or lazy-load non-critical JS; dynamic import for below-the-fold components (e.g. `RecentlyViewed`, `AdUnit`) if they’re heavy.
   - **Cumulative Layout Shift** – Ensure every image has explicit `width`/`height` (or `fill` with a sized container).
   - **Reduce unused JavaScript** – Rely on Next.js code splitting; optionally dynamic-import heavy kibo-ui or third-party components that aren’t above the fold.

3. **Third-party impact**  
   AdSense and GTM often add TBT. Keeping them on `lazyOnload` / `afterInteractive` is already done; further gains may require reducing or delaying more scripts.

---

## Quick reference

| Audit | Typical fix |
|-------|-------------|
| Links to cross-origin are unsafe | `rel="noopener noreferrer"` on `target="_blank"` |
| Passive listeners | `addEventListener("scroll", fn, { passive: true })` where you don’t `preventDefault()` |
| Image aspect ratio | Explicit `width`/`height` or `fill` in a sized container; avoid unsized `<img>` |
| LCP | `priority` or `fetchPriority="high"` on the LCP image |
| Reduce unused JS | Dynamic `import()` for below-the-fold or rarely used components |

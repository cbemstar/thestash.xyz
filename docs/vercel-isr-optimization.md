# Vercel ISR writes (free plan)

On the **Hobby (free) plan**, Vercel limits you to **200,000 ISR write units per month**. Each unit = 8 KB of data written to the ISR cache when a page is revalidated.

## What counts as an ISR write

- **Time-based revalidation**: When a page with `revalidate = 60` (or any number) is revalidated in the background, the new HTML/data is written to the cache. You are charged (in 8 KB units) only for the **data written**.
- **Important**: If the revalidated content is **identical** to the previous version, **no write units are used**. Writes only happen when the output actually changes.
- **On-demand revalidation** (`revalidatePath` / `revalidateTag`): Same rule — writes only when the new content differs.

So high write usage usually means either:
1. **Frequent revalidation** (short `revalidate` on many pages), and/or  
2. **Content often changing** (e.g. Sanity updates), and/or  
3. **Non-deterministic output** (e.g. `new Date()` or `Math.random()` in the rendered page) so every revalidation produces “new” content.

## What we did in this project

To stay within the free 200K limit, revalidate intervals were **increased** so the same pages revalidate less often:

| Route | Before | After |
|-------|--------|--------|
| Homepage | 60 s | 21600 s (6 hr) |
| Category index | 60 s | 21600 s (6 hr) |
| Category `[slug]` | 60 s | 21600 s (6 hr) |
| Recommend | 60 s | 21600 s (6 hr) |
| Latest | 300 s | 10800 s (3 hr) |
| Sitemap | 3600 s | 86400 s (24 hr) |
| Blog index | 3600 s | 21600 s (6 hr) |

That cuts how often these pages are revalidated (and thus how often they can produce writes when content changes).

We also switched high-traffic listing/recommender routes to a **lightweight Sanity query** that avoids large long-form fields (`body`, `sources`, `alternatives`, changelog data). This reduces ISR write units per regeneration by shrinking cached payload size.

## If you still hit the limit

1. **Increase revalidate further** — e.g. homepage/categories to `86400` (24 hr) if you don’t need hourly freshness.  
2. **Prefer on-demand revalidation** — If content only changes when you publish in Sanity, use a [Sanity webhook](https://www.sanity.io/docs/webhooks) that calls your API to `revalidatePath`/`revalidateTag` only when needed, and set **long** time-based revalidate (e.g. 86400) so background revalidation is rare.  
3. **Avoid non-determinism in ISR output** — Don’t use `new Date()`, `Math.random()`, or other changing values in the server-rendered HTML of pages that use `revalidate`.  
4. **Check the Usage dashboard** — Group by **Project** to see which routes/apps use the most ISR writes.

## References

- [Vercel ISR limits and pricing](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing)  
- [Optimizing ISR](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing#optimizing-isr-reads-and-writes)

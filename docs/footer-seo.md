# Footer SEO — Credible Source Summary

How to optimize the footer for SEO and UX, based on Semrush, Search Engine Journal, and Moz.

---

## Key Sources

| Source | Article | Takeaways |
|--------|--------|-----------|
| **Semrush** | [What Are Footer Links? Why They Matter + Tips](https://www.semrush.com/blog/footer-links/) (Nov 2024) | Link only to high-priority pages; organize by topic (columns/headings); descriptive anchor text; mostly internal links; avoid too many links; optional CTA. |
| **Search Engine Journal** | [Handle Your Site Footer Wisely](https://www.searchenginejournal.com/handle-your-site-footer-wisely/7686/) | Footer should be useful and avoid looking spammy; copyright + year; main nav; contact reference; clean and concise; external links in footer can look like paid links. |
| **Moz** | [Footer Link Optimization for Search Engines and User Experience](https://moz.com/blog/footer-link-optimization-for-search-engines-user-experience) (Rand Fishkin) | Footers may be devalued; don’t overstuff; make links relevant and useful; organize intelligently (not one big list); natural cross-linking; make it look good and functional for users. |

---

## Best Practices (Synthesized)

### 1. Link count and priority

- **Link only to high-priority pages.** Common: About, category pages, legal (privacy, terms), contact, support.
- **Don’t include too many links.** Google’s John Mueller: excessive internal links can do more harm than good and make it harder for engines to understand which pages matter (Semrush).
- Use an XML sitemap to signal important URLs; don’t rely on the footer for full link equity (Semrush, Moz).

### 2. Organization

- **Group by topic:** e.g. Browse, Participate, Company, Legal.
- **Use columns and/or headings** when you have several links (Semrush).
- **Put most important links first** (e.g. left in LTR); consider visual prominence for key actions (Semrush).

### 3. Anchor text

- **Descriptive, short, and accurate** — anchor should represent the linked page (Semrush, Google guidelines).
- Avoid over-optimized or repetitive anchor text; keep it natural so it doesn’t look manipulative (Moz).

### 4. Internal vs external

- **Mostly internal links** to keep users on-site and support structure (Semrush).
- **External links** (e.g. social, Maps) are acceptable but can look like paid links if off-topic (SEJ). Prefer internal links for core navigation.

### 5. UX and trust

- **Copyright notice and year** — expected and trust-building (SEJ).
- **Clean and concise** — footer shouldn’t dominate the screen; scannable and clickable, especially on mobile (Semrush, SEJ).
- **Mobile-friendly** — adequate tap targets and spacing (Semrush).

### 6. Optional

- **CTA** (e.g. newsletter, contact) — footer is often the last chance to convert (Semrush).
- **Contact reference** — if you want people to reach you, include a link to contact (SEJ); don’t make the footer the only place for it.

---

## What to avoid

- Too many links (dilutes value, confuses engines).
- One long, ungrouped list of links.
- Keyword stuffing or manipulative anchor text.
- Relying on the footer as the main internal linking strategy (prioritize content and main nav).
- Off-topic or spammy-looking external links.

---

## Applied to The Stash (Nocodesupply-style)

- **Browse:** Home, Collections, Type, Tags.
- **Industries:** Categories (Design Tools, Development Tools, UI/UX, Inspiration, AI Tools, Productivity, Learning, Miscellaneous) — links to `/?category=…`.
- **Type:** Resource types with at least one resource (App, Website, Utility, Library, etc.) — links to `/type/[slug]`. Only shown when types exist.
- **Tags:** Top N tags (e.g. 28) with links to `/tags/[tag]`, plus "All tags →" to `/tags`.
- **Participate:** Submit a resource (studio), RSS.
- **Structure:** Grid layout (1 col mobile, 2–5 cols desktop) with clear column headings; copyright below.
- **Anchor text:** Descriptive (Home, Collections, Type, Tags, industry labels, type labels, tag names).
- **No legal/contact yet:** Add Privacy/Terms/Contact and link in footer when they exist (E-E-A-T).

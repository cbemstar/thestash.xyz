# SEO/GEO Audit — The Stash

**Date:** 2026-02-08  
**Skill:** [seo-geo](https://skills.sh/resciencelab/opc-skills/seo-geo) (`.cursor/skills/seo-geo/SKILL.md`)  
**Scope:** Website audit, sitemap, llms.txt, robots.txt, and GEO optimization gaps.

---

## Executive Summary

| Area | Status | Notes |
|------|--------|------|
| **robots.txt** | ✅ Optimized | Present; explicit rules added for AI bots (Googlebot, Bingbot, PerplexityBot, GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai). Sitemap + host set. |
| **Sitemap** | ✅ Improved | Dynamic from Sanity; added `/about`, `/privacy`, `/submit`. Homepage, llms.txt, collections, tags, type, category, and all resource/collection/tag/type URLs included. |
| **llms.txt** | ✅ Improved | Spec-compliant; added robots.txt link in Optional. H1, blockquote, Browse, Collections, Categories, Optional. |
| **Meta & schema** | ✅ Good | Title, description, OG, Twitter; FAQPage + ItemList + BreadcrumbList + SoftwareApplication. |
| **GEO content** | ✅ Improved | FAQ answers use "According to The Stash" + statistics (16 categories); llms.txt includes resource/collection/category counts. |

---

## 1. robots.txt

### Before

- Single rule: `User-Agent: *` with `Allow: /`, `Disallow: /studio/`, `/api/`.
- Sitemap and host set.
- **Gap:** Skill recommends explicitly allowing AI crawlers so they are clearly permitted; some crawlers check for named rules.

### After (changes applied)

- **Explicit rules** for AI/search bots (same allow/disallow as `*`):
  - Googlebot, Bingbot, PerplexityBot, GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai
- Sitemap and host unchanged.
- **File:** `src/app/robots.ts`

### Verification

- Live `https://thestash.xyz/robots.txt` returns the expected rules (with new bot blocks after deploy).
- All bots listed in the skill (Googlebot, Bingbot, PerplexityBot, ChatGPT-User, ClaudeBot/anthropic-ai, GPTBot) are now explicitly allowed.

---

## 2. Sitemap

### Structure (current)

- **Static/key URLs:** `/`, `/llms.txt`, `/collections`, `/tags`, `/recommend`, `/type`, `/category`, `/about`, `/privacy`, `/submit`
- **Dynamic:** All `/category/[value]`, `/collections/[slug]`, `/tags/[tag]`, `/type/[slug]`, `/[slug]` (resources), with reserved slugs (`studio`, `api`) excluded.
- **Config:** `revalidate = 0`, `dynamic = "force-dynamic"` for fresh Sanity data.

### Gaps addressed

| Gap | Fix |
|-----|-----|
| Missing indexable pages | Added `/about`, `/privacy`, `/submit` with appropriate `changeFrequency` (monthly) and `priority` (0.5–0.7). |

### Optional / future

- **Size:** Single sitemap; if URL count grows very large (e.g. 50k+), consider sitemap index + multiple sitemaps.
- **lastModified:** Currently `new Date()`; could use Sanity `_updatedAt` for resources/collections for more accurate signals (optional).

---

## 3. llms.txt

### Spec compliance (llmstxt.org)

- ✅ H1: "The Stash"
- ✅ Blockquote summary of the site
- ✅ Body text describing purpose and audience
- ✅ H2 sections: Browse, Collections, Categories, Optional
- ✅ File lists as markdown links
- ✅ Served as `text/plain; charset=utf-8`

### Gaps addressed

| Gap | Fix |
|-----|-----|
| No reference to crawl rules | Added in Optional: `[robots.txt](url): Crawler access rules (all bots allowed except /studio/ and /api/)`. |

### Optional / future

- **Answer-first:** The opening blockquote is already a concise summary; could add one line explicitly stating “The Stash is a curated directory of dev and design resources” at the very top for GEO.
- **Statistics:** Could add a line with a count (e.g. “X resources, Y collections”) if you want to reinforce factual density for AI citation.

---

## 4. SEO/GEO skill checklist (high level)

### Step 1 — Website audit

| Check | Status |
|-------|--------|
| Meta tags (title, description, OG) | ✅ Set in layout and per-page (resource, collection, etc.) |
| JSON-LD (WebPage/Article, FAQPage, Organization, etc.) | ✅ FAQPage (home), SoftwareApplication + Organization (resources), BreadcrumbList, ItemList (home/collections) |
| robots.txt | ✅ Present and optimized for AI bots |
| Sitemap | ✅ Dynamic, includes key URLs + resources/collections/tags/types/categories + about, privacy, submit |
| H1 / structure | ✅ Single H1, sensible hierarchy on key pages |

### Step 2 — Keyword research

- Deferred; use WebSearch/skill flow when targeting specific keywords.

### Step 3 — GEO (Princeton methods)

| Method | Status | Note |
|-------|--------|------|
| Cite sources | ✅ | FAQ answers use "According to The Stash"; resource pages show sources |
| Statistics | ✅ | FAQ includes "16 categories"; llms.txt includes resource, collection, category counts |
| FAQPage schema | ✅ | Homepage has FAQPage with 4 Q&As |
| Answer-first | ✅ | Homepage and llms.txt lead with clear summary |
| Keyword stuffing | ✅ Avoided | No stuffing |

**Done:** In `HomepageFAQJsonLd.tsx`, all four FAQ answers now use “According to The Stash” and the first and third include the concrete number “16 categories”. In `llms.txt`, a stats line was added: “The directory includes **X** resources, **Y** collections, and **Z** categories” (dynamic from Sanity).

### Step 4 — Traditional SEO

- Meta template: ✅ Title, description, OG, Twitter where used.
- Schema: ✅ WebPage-style (BreadcrumbList, SoftwareApplication, ItemList), FAQPage, Organization.
- Content: H1, internal links (footer, breadcrumbs, in-content), mobile-friendly layout; external links should use `rel="noopener noreferrer"` (verify in codebase if needed).

### Step 5 — Validate & monitor

- **Schema:** Use [Google Rich Results Test](https://search.google.com/test/rich-results) and [validator.schema.org](https://validator.schema.org/) with `https://thestash.xyz` and a sample resource URL.
- **Indexing:** `site:thestash.xyz` in Google/Bing to confirm coverage.
- **AI discovery:** Ensure `/llms.txt` and `/sitemap.xml` are linked from footer (already done).

---

## 5. Summary of code changes (this audit)

1. **`src/app/robots.ts`**  
   Added explicit `userAgent` rules for Googlebot, Bingbot, PerplexityBot, GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai (same allow/disallow as `*`).

2. **`src/app/sitemap.ts`**  
   Added entries for `/about`, `/privacy`, `/submit` with monthly `changeFrequency` and priorities 0.5–0.7.

3. **`src/app/llms.txt/route.ts`**  
   Added robots.txt link and short description in the Optional section.

4. **`docs/audit-seo-geo.md`**  
   This report.

---

## 6. Next steps (optional)

- ~~Add 1–2 FAQ answers in “According to [source], [statistic]” form~~ ✅ Done (all four FAQs + 16 categories).
- ~~Optionally add a simple statistic to llms.txt~~ ✅ Done (resource, collection, category counts).
- Run the skill’s audit script when available: `python3 scripts/seo_audit.py "https://thestash.xyz"` (from `.cursor/skills/seo-geo/scripts/`).
- Submit sitemap in Google Search Console and Bing Webmaster Tools; monitor indexing and rich results.

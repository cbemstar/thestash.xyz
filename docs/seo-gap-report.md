# SEO & Programmatic SEO Gap Report — The Stash

**Date:** 2026-01-30  
**Scope:** Full site vs. seo-audit + programmatic-seo foundational principles.

---

## Executive Summary

| Area | Health | Top issues |
|------|--------|------------|
| Technical SEO | **Gaps** | No sitemap, no robots.txt, no category/collection hub links from resource pages |
| On-Page SEO | **Good** | Resource/collection pages have unique titles, meta, canonicals; some missing slug on older resources |
| Programmatic SEO | **Gaps** | No hub-and-spoke internal linking; collections not created or linked; no ItemList schema on collections |
| Content / Structure | **Gaps** | Collections empty; no “More in this category” or “Browse collections” on resource pages |

**Priority:** (1) Add sitemap + robots, (2) Create and publish collections by category/thematic, (3) Add internal linking and collection JSON-LD, (4) Optional: ensure all resources have slugs.

---

## 1. Technical SEO Findings

### 1.1 Crawlability & Indexation

| Issue | Impact | Evidence | Fix |
|-------|--------|----------|-----|
| **No XML sitemap** | High | No `/sitemap.xml` or `app/sitemap.ts` | Add Next.js app route `src/app/sitemap.ts` that outputs homepage, `/collections`, all `/collections/[slug]`, all `/[slug]` resource URLs. |
| **No robots.txt** | Medium | No `/robots.txt` | Add `src/app/robots.ts` allowing crawlers, referencing sitemap URL. |
| **Orphan / shallow links** | Medium | Resource pages link only to “The Stash” and “All resources”; no link to Collections or “More in category” | Add links to `/collections` and to a collection for the same category (or “More in [Category]” → category filter or collection). |

### 1.2 URL & Canonical

- **URL structure:** Good — clean subfolders (`/collections/[slug]`, `/[slug]`), lowercase, hyphenated.
- **Canonical:** Good — resource and collection pages set `alternates.canonical` with `NEXT_PUBLIC_SITE_URL`.

---

## 2. On-Page SEO Findings

### 2.1 Resource pages (`/[slug]`)

| Check | Status | Note |
|-------|--------|------|
| Unique title | OK | `{title} \| The Stash` |
| Meta description | OK | From CMS or fallback, length OK |
| H1 | OK | One H1, resource title |
| JSON-LD | OK | SoftwareApplication |
| Internal links | **Gap** | No link to Collections or “More in [Category]” |

### 2.2 Collection pages (`/collections/[slug]`)

| Check | Status | Note |
|-------|--------|------|
| Unique title | OK | `{title} \| Collections \| The Stash` |
| Meta description | OK | From CMS or count fallback |
| H1 | OK | Collection title |
| JSON-LD | **Gap** | No ItemList / Collection schema |
| Internal links | OK | Back to Collections index |

### 2.3 Homepage

| Check | Status | Note |
|-------|--------|------|
| Title / description | OK | Set in layout |
| Links to key sections | **Gap** | No prominent link to “Collections” in body (header has it) |

---

## 3. Programmatic SEO (Playbook Alignment)

### 3.1 Current model

- **Resource:** Single listing (tool/link) with category, tags, slug, URL — fits **Directory** + **Curation** playbooks.
- **Collection:** Curated list of resources (e.g. “Best Design Tools”) — fits **Curation** playbook (“best [category]”).

### 3.2 Gaps vs. programmatic-seo principles

| Principle | Gap | Action |
|-----------|-----|--------|
| **Unique value per page** | Collection pages are thin (title + description + grid) | Add 1–2 sentences of unique intro per collection type; keep descriptions in CMS. |
| **Hub and spoke** | No hub for “all collections”; spokes (resource pages) don’t link back to category/collection hubs | Add Collections index as hub; on resource page add “Part of [Collection]” or “More in [Category]” → collection or `/collections`. |
| **Internal linking** | Resource pages don’t link to collections or category views | Add “Browse collections” and “More in [Category]” (e.g. link to `/collections/best-design-tools` for design-tools). |
| **No orphan pages** | All pages reachable from home; sitemap missing | Add sitemap so all public URLs are discoverable. |

### 3.3 Collections to create (by listing types + categories)

From current 15 resources:

| Collection (slug) | Title | Resources (by category/thematic) |
|-------------------|--------|-----------------------------------|
| `best-development-tools` | Best Development Tools | Vercel, MCP Market, Shadcraft, Skiper UI, Chanhdai, Kibo UI |
| `best-design-tools` | Best Design Tools | Figma, Excalidraw, Annnimate, Font Pairing Suggester |
| `ai-tools` | AI Tools for Dev & Design | Gemini, Deepwiki |
| `learning-resources` | Learning Resources | NaN FYI SVG Foundations |
| `productivity-tools` | Productivity Tools | Raycast, Linear |
| `ui-components` | UI Components & Patterns | Shadcraft, Skiper UI, Chanhdai, Kibo UI (thematic) |

---

## 4. Prioritized Action Plan

1. **Critical (crawl/index)**  
   - Add `src/app/sitemap.ts` (home, `/collections`, `/collections/[slug]`, `/[slug]`).  
   - Add `src/app/robots.ts` (allow all, sitemap URL).

2. **High (structure + programmatic SEO)**  
   - Create the 6 collections in Sanity (via MCP or Studio) and publish.  
   - On resource page: add “Browse collections” link to `/collections` and “More in [Category]” linking to the matching collection (e.g. design-tools → `/collections/best-design-tools`).  
   - Add ItemList (or Collection) JSON-LD on collection pages.

3. **Medium (on-page + UX)**  
   - Ensure meta descriptions for collection pages are 150–160 chars where possible (from CMS).  
   - Optional: Backfill `slug` for resources that have `slug: null` (Figma, Linear, etc.) so URLs are stable and readable.

4. **Low (ongoing)**  
   - Submit sitemap in Search Console; monitor indexation and thin content.

---

## 5. Summary Table

| # | Action | Owner / How |
|---|--------|-------------|
| 1 | Add sitemap.ts | App route returning all public URLs |
| 2 | Add robots.ts | App route, reference sitemap |
| 3 | Create 6 collections in Sanity | MCP create_documents_from_json + publish |
| 4 | Resource page: link to Collections + “More in [Category]” | Link to `/collections` and category collection by slug |
| 5 | Collection page: ItemList JSON-LD | Script tag with list of resources |
| 6 | Optional: backfill slugs | Studio or MCP patch |

This report is aligned with **seo-audit** (crawlability, indexation, on-page, internal linking) and **programmatic-seo** (hub-and-spoke, unique value, clean URLs, no thin/orphan pages).

---

## 6. Executed (2026-01-30)

| # | Action | Status |
|---|--------|--------|
| 1 | Add `src/app/sitemap.ts` | Done — home, `/collections`, all collection slugs, all resource slugs (reserved excluded). |
| 2 | Add `src/app/robots.ts` | Done — allow `/`, disallow `/studio/`, `/api/`, sitemap URL. |
| 3 | Create 6 collections in Sanity | Done via MCP: Best Development Tools, Best Design Tools, AI Tools for Dev & Design, Learning Resources, Productivity Tools, UI Components & Patterns. |
| 4 | Resource page: link to Collections + “More in [Category]” | Done — `lib/collections-seo.ts` maps category → collection slug; resource page shows “More in [Category]” (when mapped) and “Browse collections”. |
| 5 | Collection page: ItemList JSON-LD | Done — `CollectionItemListJsonLd` outputs ItemList with list items linking to resource pages. |
| 6 | Optional: backfill slugs | Not done — can be done in Studio or via MCP patch for Figma, Linear, Raycast, Excalidraw, Gemini (slug currently null). |

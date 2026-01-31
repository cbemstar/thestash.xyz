# Resource upload workflow

Defined structure and workflow for adding tools to The Stash so every resource gets consistent, SEO-friendly content and internal linking.

---

## 1. Content structure (per resource)

Each resource page can show:

| Section | Purpose | Source |
|--------|---------|--------|
| **Short description** | Card + meta description (10–260 chars). | Sanity `description` (required). |
| **What is [X]?** | One-sentence definition (AEO-friendly). | Sanity `body` (first paragraph) or `lib/resource-content.ts` → `definition`. |
| **Key benefits** | Outcomes / Jobs to Be Done (bullets). | `lib/resource-content.ts` → `benefits`. |
| **Use cases** | Typical use cases (bullets). | `lib/resource-content.ts` → `useCases`. |
| **About [X]** | Longer overview (paragraphs). | Sanity `body` or `lib/resource-content.ts` → `overview`. |
| **Sources & further reading** | Credible links (docs, reviews). | Sanity `sources[]` or `lib/resource-content.ts` → `sources`. |

- If **Sanity** has `body` and/or `sources`, the app uses those.
- If not, the app falls back to **`lib/resource-content.ts`** keyed by resource **slug**. Add an entry there for new tools so the page isn’t thin.

---

## 2. Checklist: adding a new resource

### A. Create the resource (Sanity or API)

**Required:**

- **title** (2–120 chars)
- **url** (full URL)
- **description** (10–260 chars) — short, no ellipsis needed on cards; describe what the tool is and who it’s for.
- **category** — one of: `design-tools`, `development-tools`, `ui-ux-resources`, `inspiration`, `ai-tools`, `productivity`, `learning-resources`, `miscellaneous`.

**Optional:**

- **slug** — URL path (e.g. `figma`). If empty, derived from title.
- **tags** — e.g. `["design", "prototyping"]`.
- **featured** — boolean.
- **icon** — image in Sanity.
- **body** — long-form text (definition + overview). If set, used for “What is X?” / “About X” instead of `resource-content.ts`.
- **sources** — array of `{ label, url }`. If set, used instead of `resource-content.ts` sources.

**Reserved slugs:** Do not use `studio`, `api` (app routes).

### B. Category → collection mapping (internal links)

If the resource’s category has a **collection** (e.g. “Best Design Tools” for `design-tools`), add or confirm the mapping in **`lib/collections-seo.ts`**:

- `CATEGORY_TO_COLLECTION_SLUG`: maps category value → collection slug.

Then the resource page will show:

- “Explore” nav: **More in [Category]** → `/collections/<slug>`.
- “What is X?”: inline link **See it in our [Category] collection**.
- **Similar resources in [Category]** (same category, other resources).
- **Related collections** (collections that reference this resource, from Sanity).

### C. Extended content (avoid thin pages)

If you **don’t** fill Sanity `body` / `sources`, add an entry in **`lib/resource-content.ts`** keyed by the resource **slug**:

```ts
slugKey: {
  definition: "One-sentence definition of the tool.",
  benefits: [
    "Benefit / outcome 1.",
    "Benefit / outcome 2.",
  ],
  useCases: [
    "Use case 1.",
    "Use case 2.",
  ],
  overview: ["Optional paragraph(s)."],
  sources: [
    { label: "Official site", url: "https://…" },
    { label: "Docs or article", url: "https://…" },
  ],
},
```

- **definition**: Clear “What is X?” for search and answer engines.
- **benefits**: Jobs to Be Done / outcomes (marketing-psychology: focus on what the user gets).
- **useCases**: Concrete situations where the tool is used.
- **sources**: Official site, docs, or credible reviews (required in this file).

Research the tool (official site, docs, trusted reviews) so the copy is accurate and useful.

### D. Add to a collection (optional)

In Sanity, add the resource to one or more **collections**. That will:

- Show the resource on the collection page.
- Show **Related collections** on the resource page.
- Improve internal linking and topical relevance.

---

## 3. Internal linking (automatic)

Once the resource exists and (if needed) `resource-content.ts` and `collections-seo.ts` are set:

- **Resource page** shows:
  - **Explore**: All resources, Collections, More in [Category] (if mapped).
  - **What is X?**: Optional inline link to the category collection.
  - **Similar resources in [Category]**: Up to 6 other resources in the same category (links to their pages).
  - **Related collections**: Collections that include this resource (links to collection pages).
- **Homepage**: “Browse collections” links to all collections; filter by category links to the same list with category pre-selected.
- **Collection page**: “More collections” links to other collections; breadcrumbs link to Collections index and home.

No extra internal links need to be added manually for standard resource pages.

---

## 4. SEO checklist (per resource)

- [ ] **Slug**: URL-friendly, lowercase, hyphenated; not reserved (`studio`, `api`).
- [ ] **Title**: Unique, descriptive; primary keyword near the start.
- [ ] **Description**: 10–260 chars; used for meta and cards; no ellipsis needed if kept short.
- [ ] **Category**: Correct and consistent; category has a collection slug in `collections-seo.ts` if you want “More in [Category]”.
- [ ] **Content depth**: Either Sanity `body` (+ optional `sources`) or an entry in `lib/resource-content.ts` (definition, benefits, use cases, sources).
- [ ] **Schema**: SoftwareApplication JSON-LD is filled from resource + image; BreadcrumbList is present.
- [ ] **Internal links**: “Explore”, “Similar resources”, “Related collections” are generated from data; no manual link list needed.

---

## 5. API (automation)

See **`docs/automation.md`** for:

- `POST /api/resources` payload (url, title, description, category, slug?, tags?, featured?).
- Enrichment step (e.g. AI) to generate title, description, category, tags from a URL.
- Webhook secret and env vars.

After creating a resource via API, add extended content in `lib/resource-content.ts` for that slug if you don’t use Sanity `body`/`sources`, and ensure the category is mapped in `lib/collections-seo.ts` if you use category collections.

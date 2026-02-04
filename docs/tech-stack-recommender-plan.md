# Tech Stack Recommender — Plan & Concept

A feature that helps founders, developers, and product teams discover the right tools for their project based on industry, requirements, pricing, quality, and adoption.

---

## Vision

**Input:** User selects industry + requirements (e.g. "E-commerce SaaS", "need auth, payments, email")  
**Output:** Curated tool recommendations ranked by fit, with filters for pricing, quality, and adoption.

---

## User Flow (Proposed)

### Step 1: Industry
User picks one or more:
- **E-commerce** — stores, marketplaces
- **SaaS / B2B** — subscription apps, dashboards
- **Content / Media** — blogs, portfolios, news
- **Community / Social** — forums, memberships
- **Developer tools** — APIs, docs, internal tools
- **Marketing / Growth** — landing pages, analytics
- **Other / General**

### Step 2: Requirements
Multi-select or checklist:
- Authentication (auth)
- Payments / billing
- Email / notifications
- Database
- Hosting / deployment
- Analytics
- AI / ML
- Design tools
- CMS
- Search
- etc.

### Step 3: Constraints (Optional)
- **Pricing:** Free only · Freemium · Paid OK · Enterprise
- **License:** Open source preferred · Any
- **Stage:** Bootstrap / indie · Startup · Scale-up

### Step 4: Results
Ranked list of tools with:
- Match score (why it fits)
- Pricing badge
- Quality indicator (curator rating)
- Adoption metric (if available)
- Short "Why for your use case" blurb

---

## Data Model Changes

### New fields on `resource` (Sanity)

| Field | Type | Purpose |
|-------|------|---------|
| `industries` | array of strings | E.g. `["e-commerce", "saas"]` |
| `pricing` | string | `free` \| `freemium` \| `paid` \| `enterprise` \| `open-source` |
| `useCases` | array of strings | E.g. `["auth", "payments", "cms"]` |
| `qualityScore` | number 1–5 | Curator rating (optional) |
| `adoptionSource` | string | `manual` \| `builtwith` \| `wappalyzer` |
| `adoptionCount` | number | Sites using it (optional) |
| `adoptionTier` | string | `low` \| `medium` \| `high` \| `popular` (derived) |
| `recommenderBlurb` | text | "Best for X because Y" — AI or curator |

### New document: `industry`
Optional. For richer UX:
- `slug`, `title`, `description`
- `suggestedUseCases` (e.g. e-commerce → payments, auth, cms)

### New document: `useCase`
Optional. For consistency:
- `slug`, `title` (e.g. "auth", "payments")
- Maps to resource `useCases`

---

## Adoption Data: How to Get "How Many Sites Use This"

### Option A: Manual curation (simplest)
- Add `adoptionTier` (low / medium / high / popular) in Sanity
- Editors set it based on knowledge
- No external APIs
- **Pros:** Fast, no cost, full control  
- **Cons:** Subjective, not real-time

### Option B: BuiltWith API
- [BuiltWith](https://builtwith.com/) has an API
- Returns site counts per technology
- **Pros:** Real data  
- **Cons:** Paid, rate limits, not all tools tracked

### Option C: Wappalyzer
- [Wappalyzer](https://www.wappalyzer.com/) — tech detection
- Has an API
- **Pros:** Good coverage for frontend/backend tech  
- **Cons:** Paid for API, best for known tech names

### Option D: StackShare / Slant
- Community-driven "X vs Y" and adoption
- No clean API for bulk data
- **Pros:** Qualitative  
- **Cons:** Scraping / manual

### Recommended: Hybrid
1. **Phase 1:** Manual `adoptionTier` + `qualityScore` + `exampleSites` in Sanity
2. **Phase 2:** If budget allows, integrate BuiltWith or Wappalyzer for top tools, store `adoptionCount` and derive tier
3. **Phase 3:** Optional "Community votes" or "Used by X companies" from manual curation

---

## Wappalyzer Integration Roadmap

Wappalyzer has a Technology Lookup API that returns tech stacks for any website. It indexes millions of sites. **Pricing:** Pro $250/mo, Business $450/mo (required for API). [Docs](https://wappalyzer.com/docs/api/v2/lookup/).

### Use case: Industry-based real-world recommendations

**Goal:** Recommend tools based on what successful sites in that industry actually use.

**Approach:**
1. **Curate industry example domains** — Maintain a list of well-known sites per industry (e.g. e-commerce: shopify.com, etsy.com, wayfair.com; saas: notion.so, linear.app, figma.com).
2. **Background job** — Call Wappalyzer API for each domain, get `technologies[]` (slug, name, categories).
3. **Aggregate & map** — Build `industry → technology slug → count`. Map Wappalyzer slugs to our resource slugs (e.g. `stripe` → our Stripe resource).
4. **Boost scoring** — When user selects "E-commerce", boost resources that appear in top e-commerce site stacks.

**Implementation:**
- Add `INDUSTRY_EXAMPLE_DOMAINS` in `lib/recommender.ts` (or Sanity document).
- Cron/edge function: `GET https://api.wappalyzer.com/v2/lookup/?urls=...` (up to 10 per request, 5 req/sec).
- Store results in DB or static JSON; refresh weekly.
- Use in `scoreResources()`: if resource slug matches Wappalyzer tech for user's industry domains → add bonus score.

**Alternative (no API):** Manually curate `exampleSites` on each resource (e.g. "Used by Shopify, Lyft") from public knowledge. Schema already supports this.

---

## Real-World Use Fields (Implemented)

| Field | Purpose |
|-------|---------|
| `exampleSites` | Array of `{ name, url }` — "Used by X, Y, Z" |
| `caseStudy` | Free-text note on how the tool is used in practice |
| `recommenderBlurb` | "Best for X because Y" |

These are shown in recommendation results. Curators can populate from Wappalyzer's public [Technologies](https://wappalyzer.com/technologies/) browse, case studies, or manual research.

---

## Matching Logic

```
score = 0
if resource.industries includes userIndustry → score += 3
for each userRequirement:
  if resource.useCases includes requirement → score += 2
  if resource.tags includes requirement → score += 1
if userPricingConstraint:
  if resource.pricing matches → score += 2
  else → score -= 1 (soft penalty)
if resource.qualityScore → score += (qualityScore / 5) * 2
if resource.adoptionTier == "popular" → score += 1
sort by score desc
```

You can refine weights and add more signals (featured, collections, etc.).

---

## Implementation Phases

### Phase 1: Schema + Data (1–2 days)
- Add `industries`, `pricing`, `useCases`, `qualityScore`, `adoptionTier`, `recommenderBlurb` to Sanity resource schema
- Backfill a subset of resources (e.g. 50–100) for testing
- Add filters to existing browse UI (pricing, use case)

### Phase 2: Recommender UI (2–3 days)
- New page: `/recommend` or `/tech-stack`
- Step-by-step form (industry → requirements → constraints)
- Results list with match reasoning
- Reuse `ResourceCard` / `ResourceListItem`

### Phase 3: Quality + Adoption (1–2 days)
- Curator workflow for `qualityScore` and `adoptionTier`
- Optional: Script to pull BuiltWith/Wappalyzer data for known tools
- Display "Popular", "Editor's pick", etc. in results

### Phase 4: Polish (1–2 days)
- Save / share recommended stack (e.g. `/recommend?industry=saas&use=auth,payments`)
- Export as list (markdown, JSON)
- Email digest: "Your custom stack is ready"

---

## How to Make It Better

### 1. **Pre-built stacks**
Offer "Stacks we recommend" for common combos:
- "Indie hacker SaaS stack"
- "E-commerce on a budget"
- "AI-powered content site"
Each is a collection + short narrative.

### 2. **Alternatives & comparisons**
For each recommended tool, show 2–3 alternatives with pros/cons. Use existing `similar` logic or add `alternatives` references.

### 3. **Cost estimate**
If pricing data exists, show a rough monthly cost for the recommended stack (e.g. "~$50/mo" for a starter stack).

### 4. **Integration map**
Show which tools work together (e.g. "Vercel + Supabase + Stripe"). Model as `integrations` or tags.

### 5. **Real-world examples**
"Used by X, Y, Z" — link to sites or case studies. Manual at first.

### 6. **Community signals**
- "Saved by 120 users"
- "In 45 curated stacks"
Uses your existing save/collection data.

### 7. **AI-powered blurb**
Use an LLM to generate `recommenderBlurb` from description + useCases + industry. Keep curator override.

### 8. **Concierge / email**
"Describe your project" → email with a custom stack. Good for lead gen.

### 9. **SEO**
- `/recommend/indie-saas-stack` — static pages for popular stacks
- FAQ schema: "What's the best X for Y?"
- Targets "best tools for [industry]" queries

### 10. **Differentiation vs StackShare / Slant**
- **Curated, not crowd-sourced** — every tool is vetted
- **Use-case first** — "I need X" instead of "Compare A vs B"
- **Pricing transparency** — filter by budget from day one
- **Dev + design** — one place for both (unlike most stack sites)

---

## Summary

| What | How |
|------|-----|
| Industry + requirements input | Multi-step form on `/recommend` |
| Tool matching | Score by industries, useCases, tags, pricing |
| Quality | Curator `qualityScore` (1–5) |
| Adoption | Manual `adoptionTier` first; APIs later if needed |
| Output | Ranked list with "Why we recommend" blurbs |
| Better | Pre-built stacks, alternatives, cost estimate, SEO pages |

---

## Next Steps

1. Confirm schema fields and add to Sanity
2. Backfill 50–100 resources for a pilot
3. Build `/recommend` page with steps 1–3
4. Ship v1, iterate based on usage

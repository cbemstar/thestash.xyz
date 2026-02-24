# Information Presentation Framework

Purpose: keep The Stash easy to scan as feature and content volume grows.

This document defines the default structure for dense pages (compare, alternatives, migrate, use-cases, reports) and the rollout checklist for new features.

## 1) Information layers (top to bottom)

1. **Answer-first layer**
   - 1 headline + 1 direct answer paragraph.
   - User should understand “what this page is for” in under 10 seconds.
2. **Action layer**
   - Primary actions and next-step links.
   - Example: compare, alternatives, migration plan, save/export.
3. **Navigation layer**
   - `On this page` jump links for section-level navigation.
4. **Decision layer**
   - Matrices, checklists, phases, recommendations, calculators.
5. **Evidence layer**
   - Sources, methodology, freshness date, caveats.

## 2) Default page blueprint for dense pages

Use this order unless there is a strong reason to deviate:

1. Breadcrumbs
2. Answer-first header
3. Start-here summary card (TL;DR + 2 quick jump links)
4. On-this-page navigation (`src/components/OnThisPageNav.tsx`)
5. Core decision sections
6. Supplemental sections (FAQ, related links)
7. Sources

## 3) Findability and filtering requirements

If a page type has 12+ entries, it must ship with a finder/filter UI.

Required controls:

1. Keyword search
2. At least one categorical filter
3. Clear filters action
4. Result count
5. Empty state guidance

Reference implementation: `src/components/MigrationFinder.tsx`

## 4) Content density guardrails

1. Max 7 primary sections visible by default.
2. Put tactical actions above explanatory depth.
3. Keep section headings explicit (users should know what they get before reading).
4. Always provide direct links between related decision routes:
   - Compare ↔ Alternatives ↔ Migrate ↔ Resource page.

## 5) Discoverability contract for new feature routes

When a new route family is added, it is not “done” until all items below are complete:

1. Route hub page exists (index of that route family).
2. Added to top nav and footer where appropriate.
3. Cross-linked from at least two existing high-intent routes.
4. Included in sitemap generation.
5. Uses answer-first header + on-this-page navigation if dense.

## 6) Implementation checklist for future features

1. Define user job-to-be-done and success action.
2. Choose page template from this framework.
3. Add finder/filter controls if content count threshold is met.
4. Add discoverability links (nav, footer, in-route cross links).
5. Add source/freshness layer.
6. Validate TypeScript and route rendering.

## 7) Components to reuse

1. `src/components/OnThisPageNav.tsx`
2. `src/components/MigrationFinder.tsx`
3. `src/components/RoiCalculator.tsx`

This framework should be applied incrementally to existing dense pages, then enforced for every new feature route going forward.

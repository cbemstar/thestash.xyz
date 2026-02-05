# Design Audit Results — The Stash

*Audit conducted per UI/UX Skills v1 protocol. No design documentation (DESIGN_SYSTEM.md, APP_FLOW.md, PRD.md, etc.) exists; the codebase was used as the source of truth.*

---

## DESIGN AUDIT RESULTS

### Overall Assessment

The Stash has a coherent dark theme with a clear primary (orange/amber) and solid foundations: semantic tokens, reduced-motion support, and consistent use of Tabler icons in most places. The experience is undermined by **inconsistent content width and grid** (three different max-widths with no single rule), **undersized touch targets** in key controls, **inconsistent use of shared components** (e.g. breadcrumbs), **weak empty and loading states** in the main resource list, and **mixed iconography** (inline SVG vs Tabler). Addressing these will make the app feel intentional and premium; leaving them as-is keeps it feeling “good enough” rather than inevitable.

---

## PHASE 1 — Critical

*(Visual hierarchy, usability, responsiveness, or consistency issues that actively hurt the experience.)*

- **Content width / grid:** Main content uses three different max-widths with no documented rule: `max-w-3xl` (About, Privacy, hero content, recommend inner), `max-w-5xl` (home, category, saved, nav, cookie consent), `max-w-6xl` (footer, collections index, collection detail). → **Pick one canonical content width for “page content” and one for “narrow prose” (e.g. legal/about). Apply consistently.** → Every element must sit on a single grid; multiple widths without a rule feel arbitrary and break alignment.

- **FilterBar — view toggle:** View (grid/list) buttons use `min-h-[2.25rem] min-w-[2.25rem]` (36px). → **Use at least 44×44px touch targets (e.g. `min-h-11 min-w-11`).** → Thumb-sized targets reduce mis-taps and meet accessibility expectations on touch devices.

- **FilterBar — Clear filters:** “Clear” is text-only with no minimum height. → **Give it a minimum touch target (e.g. min-h-10 or min-h-11) and optional icon (e.g. IconX) so it’s both tappable and visually consistent.** → Prevents “is this clickable?” and avoids tiny tap areas.

- **SaveButton (on cards):** Uses `p-1.5` with a 16px icon; total hit area is well under 44px. → **Increase hit area to at least 44×44px (e.g. min-h-11 min-w-11, keep icon size-4) while keeping the visual weight light.** → Primary card action must be reliably tappable.

- **Cookie consent — buttons:** Primary and secondary buttons use `py-2 px-4` (~32px height). → **Use min-h-11 (44px) for both buttons.** → Consent actions are critical and often used on mobile; they must be thumb-friendly.

- **Saved page — breadcrumbs:** Uses a custom `<nav>` with inline “/” instead of the shared `Breadcrumbs` component. → **Use the same `Breadcrumbs` component as Type, About, Collections.** → Same pattern must look and behave the same everywhere; one-off markup creates drift and future inconsistency.

- **ResourceGrid — empty state:** When no resources match filters, only plain text: “No resources match your filters. Try another category or search.” → **Add a clear visual container (e.g. card or bordered block), optional illustration or icon, and one primary CTA (e.g. “Clear filters” or “Browse all”).** → Empty states should feel intentional and guide the next action, not like a dead end.

- **Saved page — loading state:** Shows only “Loading…” text. → **Use a skeleton (e.g. 3–6 card-shaped placeholders with pulse) consistent with other loading patterns.** → Keeps the layout stable and signals “content is coming” instead of a blank jump.

**Review:** Phase 1 focuses on a single content grid, touch targets for primary and filter actions, component consistency (breadcrumbs), and clear empty/loading states. These directly affect trust, usability on mobile, and perceived quality. Fixing them first prevents polish work on top of a broken grid and weak interactions.

---

## PHASE 2 — Refinement

*(Spacing, typography, color, alignment, iconography adjustments that elevate the experience.)*

- **Iconography — ResourceCard:** Card link uses an inline SVG arrow (or similar) while the rest of the app uses Tabler icons. → **Replace with the same Tabler icon used elsewhere for “external” or “go” (e.g. IconArrowRight or IconExternalLink) and same size (e.g. size-4).** → One icon set, one weight/size system; mixed sets feel unfinished.

- **Homepage — primary focus:** Hero has one H1, then multiple sections (carousels, collections, recently viewed, “All resources”). “All resources” can feel like one of many blocks rather than the main path. → **Slightly strengthen the “All resources” block (e.g. more spacing above it, or a subtle visual anchor) so the primary path is obvious in 2 seconds.** → Hierarchy should make the main action unmissable without changing copy or features.

- **FilterBar — search clear button:** The X control has no explicit min height. → **Ensure the clear button has min-h-10 min-w-10 (or wrap in a 44px touch target on touch breakpoints).** → Aligns with Phase 1 touch-target rule and keeps controls consistent.

- **Typography — empty/error messages:** Empty state and error messages (e.g. hero subscribe) use `text-muted-foreground` or `text-destructive` but may not share a single “small message” scale. → **Define one “helper/error” text style (e.g. text-sm + one muted, one destructive) and use it for empty states, errors, and hints.** → Calm, consistent type hierarchy.

- **Footer vs main content width:** Footer uses `max-w-6xl` while main content uses `max-w-5xl` in most places. → **After Phase 1 content-width decision: if “page content” is max-w-5xl, set footer to max-w-5xl so the whole page aligns to one grid.** → Precision and alignment; the eye detects misalignment before the brain names it.

- **StashPage / Category / Saved — vertical rhythm:** Section spacing (e.g. between hero and filters, filters and grid) may use ad-hoc gaps. → **Standardize section spacing (e.g. one token: 8 or 10 units) so rhythm is consistent across home, category, and saved.** → Breathing room that feels intentional, not arbitrary.

**Review:** Phase 2 assumes Phase 1 is done. It tightens iconography, hierarchy, touch targets for remaining controls, typography for messages, footer alignment to the grid, and vertical rhythm. These changes make the interface feel designed, not patched.

---

## PHASE 3 — Polish

*(Micro-interactions, transitions, empty/loading/error states, and subtle details that feel premium.)*

- **ResourceCard hover:** Already has `hover:-translate-y-0.5` and border/ring; `motion-reduce` is respected. → **Optional: add a very subtle scale (e.g. 1.01) only when reduced-motion is not preferred, and ensure focus ring is clearly visible.** → Small lift that reinforces “this is tappable” without noise.

- **Cookie consent — appearance:** Banner appears without transition. → **Optional: animate in from bottom (e.g. translate-y-full → 0) with a short duration, respecting prefers-reduced-motion.** → Feels responsive and intentional rather than popping in.

- **Subscribe (hero) error state:** Error is shown with `text-destructive`; good. → **Ensure error has sufficient contrast and, if there’s a list of errors, use a small list with focus management.** → Error states should feel helpful and clear, not hostile.

- **Global error / 404:** No custom 404 or error boundary styling was audited. → **If not present: add a simple, on-brand not-found page and error boundary with one clear CTA (e.g. “Back to home”) and same content width as the rest of the app.** → Even error paths should feel part of the same product.

- **Loading — Recommend page:** Uses Suspense and pulse; good. → **Ensure skeleton or pulse layout matches the actual content layout (e.g. same column count) so there’s no jump when content loads.** → Reduces perceived wait and layout shift.

- **Density — Jobs filter:** Pass over key screens (home, category, saved, resource detail) once more: “Can anything be removed without losing meaning?” → **Remove any redundant labels or duplicate cues; keep every element earning its place.** → Less but better.

**Review:** Phase 3 assumes Phases 1 and 2 are done. It adds subtle motion where it supports meaning, improves error/empty feel, aligns loading layout with final content, and applies a final density pass. These details make the app feel refined and consistent in every state.

---

## DESIGN_SYSTEM (.md) UPDATES REQUIRED

*(To be created or updated before implementation.)*

- **Content width tokens:** Define and name exactly two widths, e.g. `--content-width` (e.g. 1024px / max-w-5xl) for main page content and `--content-width-narrow` (e.g. 768px / max-w-3xl) for prose (about, privacy, hero copy, etc.). Document which pages/sections use which.
- **Touch target token:** Define minimum interactive size, e.g. `--touch-target-min: 44px`, and use it for all primary and filter controls (buttons, toggles, clear, save).
- **Section spacing:** One vertical rhythm token for “section gap” (e.g. space-y-10 or 2.5rem) used between hero, filters, grid, and between major page sections.
- **Helper/error text:** One “helper” and one “error” text style (size + color) for empty states, form errors, and hints.
- **Iconography rule:** “Use Tabler icons only; size 4 (16px) for inline with text, no inline SVG for UI icons.”
- **Empty state pattern:** “Empty state = container (card or bordered block) + optional icon/illustration + short message + one primary CTA.”
- **Loading state pattern:** “List/grid loading = skeleton cards matching final layout; no plain ‘Loading…’ only.”

These must be approved and added to DESIGN_SYSTEM.md (or equivalent) before implementation. If DESIGN_SYSTEM.md does not exist, create it with these tokens and patterns first.

---

## IMPLEMENTATION NOTES FOR BUILD AGENT

*(Exact file, component, property, and value changes so the build agent can execute without design interpretation.)*

- **Content width:** After product/design approves canonical widths:
  - Choose one of: all main content `max-w-5xl` and narrow `max-w-3xl`, or all `max-w-6xl` and narrow `max-w-3xl`. Then:
  - Replace all main content `max-w-*` (StashPage, CategoryPageClient, SavedPageClient, AppNav, CookieConsent, collections index/detail, footer) with the chosen main token; replace About, Privacy, hero inner, recommend inner with the chosen narrow token. Document in DESIGN_SYSTEM.md.
- **FilterBar (`src/components/FilterBar.tsx`):** View toggle buttons: `min-h-[2.25rem] min-w-[2.25rem]` → `min-h-11 min-w-11`. Clear filters button: add `min-h-10` (or `min-h-11`) and ensure padding so hit area ≥ 44px; optionally add IconX. Search clear button: add `min-h-10 min-w-10` (or equivalent) so touch target ≥ 44px.
- **SaveButton (`src/components/SaveButton.tsx`):** Add `min-h-11 min-w-11` for the button element when used on cards (or always); keep icon `size-4`. Preserve `aria-label` and `aria-pressed`.
- **CookieConsent (`src/components/CookieConsent.tsx`):** Both buttons: add `min-h-11` (replace or supplement `py-2` so height ≥ 44px).
- **Saved page breadcrumbs:** In `src/app/saved/SavedPageClient.tsx`, replace the manual `<nav>` (Link + “/” + span) with the shared `Breadcrumbs` component; pass items `[{ label: "The Stash", href: "/" }, { label: "Saved" }]` (or equivalent API).
- **ResourceGrid empty state:** In `src/components/ResourceGrid.tsx`, replace the plain “No resources match…” paragraph with a contained block (e.g. card or bordered div), optional icon, same message, and one primary button/link (e.g. “Clear filters” or “Browse all” linking to `/` or clearing filters).
- **Saved page loading:** In `src/app/saved/SavedPageClient.tsx`, replace “Loading…” with a skeleton of 3–6 card-shaped placeholders (e.g. same card border-radius and approximate size) with `animate-pulse`.
- **ResourceCard icon:** In `src/components/ResourceCard.tsx`, find the inline SVG used for “go”/arrow and replace it with the Tabler icon used elsewhere (e.g. `IconArrowRight` from `@tabler/icons-react`), class `size-4`.
- **Footer max-width:** After content width is decided, set footer container to the same `max-w-*` as main content (e.g. `max-w-5xl` if that is the chosen main content width) in `src/components/Footer.tsx`.
- **DESIGN_SYSTEM.md:** Create `docs/DESIGN_SYSTEM.md` (or project root) with the tokens and patterns listed above; reference it from implementation so all values stay aligned.

---

## RECOMMENDED DOCUMENTATION (OUT OF SCOPE FOR THIS AUDIT)

To make future design and build work easier, the following are recommended but not part of this design plan:

- **DESIGN_SYSTEM.md** — Visual tokens, colors, typography, spacing, shadows, radii, and the rules above.
- **APP_FLOW.md** — Every screen, route, and user journey.
- **PRD.md** — Feature and content requirements.
- **TECH_STACK.md** — Front-end stack and constraints.
- **progress.txt** — Current state of the build (updated after each phase).
- **LESSONS.md** — Design mistakes, patterns, and corrections (updated after implementation).

---

*End of design audit. Do not implement until the user reviews and approves each phase. Execute surgically per phase after approval.*

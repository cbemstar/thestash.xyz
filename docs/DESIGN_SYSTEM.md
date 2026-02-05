# Design System — The Stash

Reference for visual tokens and patterns. All layout and component values should align with this document.

## Content width

- **`--content-width`** (main): `max-w-5xl` (1024px). Use for: main page content, nav, footer, cookie consent, home, category, saved, collections index, collection detail.
- **`--content-width-narrow`**: `max-w-3xl` (768px). Use for: About, Privacy, hero inner copy, recommend inner prose.

## Touch targets

- **Minimum interactive size**: 44px (`min-h-11` / `min-w-11` in Tailwind). Use for: primary buttons, filter toggles (view mode), clear filters, search clear, save button on cards, cookie consent buttons.

## Section spacing

- **Section gap**: `space-y-10` (2.5rem) or `mt-10` / `mb-10` between major sections (hero → content, filters → grid, between page sections). Keeps vertical rhythm consistent.

## Typography

- **Helper text**: `text-sm text-muted-foreground` for hints, empty state messages, search result count.
- **Error text**: `text-sm text-destructive` for form errors and validation messages.

## Iconography

- Use **Tabler icons** only (`@tabler/icons-react`). Inline size with text: `size-4` (16px). No inline SVG for UI icons; use Tabler for consistency.

## Empty state pattern

- Container: card or bordered block (e.g. `rounded-xl border border-border bg-muted/30 p-10`).
- Optional: icon or illustration.
- Short message (helper text style).
- One primary CTA: button (e.g. "Clear filters") or link (e.g. "Browse all" → `/`).

## Loading state pattern

- List/grid loading: skeleton cards matching final layout (same column count, card shape, `animate-pulse`). Do not use plain "Loading…" only.

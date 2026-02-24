# The Stash Interface System

## Product Intent

- Human: Developers and designers triaging tools quickly, often in short sessions.
- Core job: Scan, filter, compare, and save resources with minimal friction.
- Feel: Editorial catalog with product-tool precision.

## Domain Exploration

- Domain concepts: index cards, annotation tabs, filing cabinet, stack labels, shortlist pins, decision guides.
- Color world: paper white, graphite text, warm slate dividers, amber highlight, muted tag chips.
- Signature element: "browse shell" sections where filters and result cards share one continuous panel system.
- Replaced defaults:
  - Default "floating white cards" -> unified panel and card elevation scale.
  - Native browser selects -> fully styled custom select triggers and menus.
  - Generic filter row -> structured control rail with clear state and count context.

## Design Direction

- Direction name: Curated Index
- Tone: Warm-neutral, compact, scan-first.
- Density: Medium-compact for browsing high card volume.

## Depth Strategy

- Strategy: Borders-first, no decorative heavy shadows.
- Surface levels:
  - `canvas`: page background
  - `panel`: browse sections and control rails
  - `panel-strong`: active/hover states and elevated controls
- Border hierarchy:
  - `line-soft`: default structure
  - `line-strong`: interactive emphasis

## Spacing & Radius

- Base unit: 4px
- Common rhythm: 8 / 12 / 16 / 24 / 32
- Radius scale:
  - controls: 10px
  - cards: 16px
  - section shells: 20px

## Typography

- Display: Geist Sans, semibold for section heads and titles.
- Body: Geist Sans regular.
- Metadata: small uppercase labels with mild tracking.
- Data/metrics: tabular numerals when counts are compared.

## Component Patterns

### Browse Shell

- Shared section container for resource lists and category pages.
- Uses `panel` background + `line-soft` border.
- Header row always includes section title + filter toggle affordance on small screens.

### Control Rail

- Search input plus select controls in a single compositional band.
- Control tokens are separate from surface tokens for independent tuning.
- States required: default, hover, focus-visible, disabled.
- Search occupies its own row; filter/sort/view controls wrap on a second row to prevent breakpoint collisions.
- Control groups use flexible basis values (`14rem`, `10rem`, `9rem`) so labels never overlap action controls.

### Resource Cards

- Shared surface treatment across grid/list variants.
- Title and category are primary anchors; tags and actions are secondary.
- Action row separated with a soft divider to reduce visual noise.

### Navigation Rail

- Sticky top rail uses `stash-canvas` and soft dividers, not hard contrast blocks.
- Desktop capsule nav sits on `stash-control` and keeps motion/selection subtle.
- Mobile menu items are control-like list rows using the same border and hover language as filters.
- `SlidingCapsuleNav` and `ThemeSwitcher` ship with stash-aware defaults so nav styling is consistent without per-page overrides.

### Hero Command Deck

- Hero is a functional browse shell rather than a marketing billboard.
- Category chips inherit the same control token family as filters.
- Newsletter input is styled as a first-class control inside the same shell.

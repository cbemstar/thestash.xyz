---
name: thestash-mobile-nav
description: How the mobile navigation menu (StaggeredMenu) is integrated in AppNav—layout, dynamic import, and theme-aware styling. Use when changing the mobile menu, adding nav items, or fixing panel/alignment.
---

# Mobile Nav: StaggeredMenu Integration

The mobile primary nav uses **StaggeredMenu** (from `@react-bits/StaggeredMenu-JS-CSS`) for layout and animation instead of a plain sheet.

## Architecture

- **AppNav** (`src/components/AppNav.tsx`): Renders the header. On mobile it shows ThemeSwitcher + **MobileStaggeredMenu** (no Sheet).
- **MobileStaggeredMenu** (`src/components/MobileStaggeredMenu.tsx`): Thin client wrapper that maps `{ title, url }[]` to StaggeredMenu’s `{ label, link, ariaLabel }[]` and sets theme props and `className="app-nav-mobile-menu"`.
- **StaggeredMenu** (`src/components/StaggeredMenu.jsx` + `.css`): Third-party component (GSAP). Uses `position: absolute` for the panel; panel is anchored to the **right edge of its wrapper**.

## Layout (critical for panel alignment)

- The StaggeredMenu **wrapper** must extend to the **viewport right** so the sliding panel opens from the screen edge.
- In AppNav, the mobile block is:
  - A flex container: `flex flex-1 items-center justify-end gap-2 md:hidden`.
  - ThemeSwitcher first, then a **flex-1** div that contains `MobileStaggeredMenu`.
- The inner div is `h-full min-w-0 flex-1 flex justify-end`. That gives the menu wrapper full height of the header and width from the theme switcher to the viewport right, so the panel’s `right: 0` lines up with the viewport.

Do **not** put StaggeredMenu inside a fixed-width slice (e.g. `w-14`) without that flex-1; the panel would open mid-screen.

## Stacking and drawer height (app-nav)

- The base component uses `position: absolute` and `height: 100%` of the wrapper (header row only), so the drawer would be short and can paint behind page content.
- For **app-nav**, overrides in `StaggeredMenu.css` under `.app-nav-mobile-menu`:
  - **Panel and prelayers**: `position: fixed; top: 0; right: 0; height: 100%; min-height: 100dvh` so the drawer is full viewport height.
  - **Z-index**: Panel `z-index: 60`, prelayers `55`, wrapper `50` so the drawer and decorative layers sit above the sticky header (`z-50`) and page content (UI/UX scale: 10, 20, 30, 50).
- Toggle stays in the nav bar: header padding is compact and `.sm-toggle` has min height/width for touch targets (44px+).

## Loading and SSR

- StaggeredMenu uses GSAP and `useLayoutEffect`; it is **client-only**.
- **MobileStaggeredMenu** is loaded with `next/dynamic(..., { ssr: false })` in AppNav to avoid hydration issues and keep the main bundle smaller. A small loading placeholder reserves space so layout doesn’t shift.

## Theming

- Theme variables are applied in **StaggeredMenu.css** under `.app-nav-mobile-menu`:
  - Toggle and panel use `var(--foreground)`, `var(--background)`, `var(--primary)`.
  - Logo is hidden; header is `justify-content: flex-end` so only the Menu/Close toggle shows.

## Adding or changing mobile nav items

- Edit **mobileNavItems** in `AppNav.tsx` (array of `{ title, url }`). MobileStaggeredMenu receives this and maps to StaggeredMenu’s `items`; no change needed in StaggeredMenu.jsx for new links.

---

## How StaggeredMenu was built (React Bits)

**Source:** [React Bits – Staggered Menu](https://reactbits.dev/components/staggered-menu)

- **Component model:** Full-height wrapper (e.g. `height: 100vh`); panel and decorative “prelayers” are `position: absolute` at `right: 0` (or `left: 0`), with `height: 100%` of the wrapper. Header with logo + Menu/Close toggle is `position: absolute; top: 0` so the toggle sits at the top of that full-height area.
- **Animation:** GSAP drives panel/prelayer slide (e.g. `xPercent`), staggered item reveal, plus-icon rotation, and Menu/Close text cycle. No React Bits–specific docs for exact timings; our overrides keep the same motion feel.
- **Props:** `position`, `items` (label, link, ariaLabel), `socialItems`, `displaySocials`, `displayItemNumbering`, `className`, `logoUrl`, `menuButtonColor`, `openMenuButtonColor`, `accentColor`, `changeMenuColorOnOpen`, `closeOnClickAway`, `onMenuOpen`, `onMenuClose`, `colors` (prelayer gradients). **Dependency:** `gsap`.

## UI-reasoning adaptation (ui-ux-pro-max)

Using **`.agents/skills/ui-ux-pro-max/data/ui-reasoning.csv`** to adapt StaggeredMenu into The Stash:

| Factor | CSV guidance | How we adapted |
|--------|--------------|----------------|
| **Category fit** | SaaS (1): “if_ux_focused: prioritize-minimalism”; Social (11): “if_content_focused: minimize-chrome” | Directory is content-first → minimal chrome. We hide logo, no socials in nav, only toggle + panel links. |
| **Key_Effects** | SaaS: “Subtle hover (200–250ms) + Smooth transitions”; avoid “Excessive animation” | Keep GSAP panel/item stagger as-is (feels like one deliberate transition). No extra decorative motion. |
| **Color_Mood** | “Trust blue + Accent contrast”, “Professional + Hierarchy” | Panel and toggle use `var(--foreground)`, `var(--background)`, `var(--primary)` so nav respects app theme and stays professional. |
| **Layout & Responsive** | HIGH priority; “z-index-management: 10, 20, 30, 50” | Panel/prelayers fixed, full viewport height, z-index 55/60 so drawer stacks above content; toggle in header row with compact padding. |
| **Touch & Interaction** | “touch-target-size: 44×44px min” | `.sm-toggle` in app-nav has min height/width 2.75rem and padding for ~44px touch target. |
| **Accessibility** | Multiple rows: “focus-states”, “aria-labels”, “keyboard-nav” | Component exposes aria-label, aria-expanded, aria-controls; we keep focus-visible and close-on-click-outside. |

**Decision rule applied:** “if_ux_focused: prioritize-minimalism” and “if_content_focused: minimize-chrome” → StaggeredMenu is used only for structure and motion; we strip optional chrome (logo, socials) and theme it so the nav feels part of the app, not a separate widget.

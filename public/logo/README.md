# The Stash – Logo pack

Brand assets for **The Stash** (dev & design resources directory).

## For Figma / design (local copy)

Use the **professional pack** – fixed-color SVGs you can drag into Figma:

- **Icons:** `icon.svg`, `icon-white.svg`, `icon-orange.svg`, `icon-outline.svg`
- **Wordmarks:** `wordmark.svg`, `wordmark-white.svg`, `wordmark-orange.svg`, `wordmark-stacked.svg`, `wordmark-stacked-white.svg`
- **Lockups:** `lockup-horizontal.svg`, `lockup-horizontal-white.svg`, `lockup-horizontal-orange.svg`, `lockup-stacked.svg`, `lockup-stacked-white.svg`

See **FIGMA.md** for usage and tips. Brand colors: **brand-colors.md**.

## For the website (currentColor)

| File | Use |
|------|-----|
| `logo.svg` | Full logo (icon + wordmark) – inherits text color (light/dark). |
| `logo-icon.svg` | Icon only, 24×24 viewBox – favicons, app icons, small UI. |
| `logo-mark.svg` | Same icon, 48×48 viewBox – PWA, high-DPI. |

- **Nav / header:** Use `logo.svg` or text “The Stash” (current app uses text in `AppNav`).
- **Favicon:** Use `logo-icon.svg` or export 32×32 PNG; Next.js uses `src/app/favicon.ico` by default.
- **OG / social:** Dynamic images from `/api/og`; no static logo required.

### Web standards (SVGs)

- **viewBox only** – no fixed `width`/`height` on the root so CSS controls size (e.g. `width: 40px; height: auto`).
- **currentColor** – icon and text inherit foreground color for light/dark and theming.
- **Accessibility** – each file includes `<title id="...">The Stash</title>` and `role="img"` / `aria-labelledby` for screen readers when the SVG is used as the logo.
- **Sizing** – `logo-icon.svg` uses `viewBox="0 0 24 24"` for crisp scaling at 16/24/32/48px; `logo-mark.svg` uses `0 0 48 48` for PWA; `logo.svg` uses `0 0 200 40` for the full lockup.

## Brand

- **Primary:** Orange/amber `#f59e0b` → `#ea580c` (see brand-colors.md).
- **Wordmark font:** Geist Sans (Bold 700); SVGs fall back to system-ui.

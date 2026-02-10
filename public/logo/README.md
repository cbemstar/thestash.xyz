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
| `logo.svg` | Full wordmark – inherits text color (light/dark). |
| `logo-icon.svg` | Icon only – favicons, app icons, small UI. |
| `logo-mark.svg` | Same icon at 48×48 – PWA, high-DPI. |

- **Nav / header:** Use `logo.svg` or text “The Stash” (current app uses text in `AppNav`).
- **Favicon:** Use `logo-icon.svg` or export 32×32 PNG; Next.js uses `src/app/favicon.ico` by default.
- **OG / social:** Dynamic images from `/api/og`; no static logo required.

## Brand

- **Primary:** Orange/amber `#f59e0b` → `#ea580c` (see brand-colors.md).
- **Wordmark font:** Geist Sans (Bold 700); SVGs fall back to system-ui.

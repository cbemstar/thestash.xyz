# Google AdSense setup

The Stash is set up to be **Google AdSense–ready**. Use this guide after your AdSense account is approved.

## What’s already in place

- **Privacy Policy** (`/privacy`) – Required by AdSense. Covers data, cookies, and third‑party ads (Google).
- **About page** (`/about`) – Helps AdSense verify a real site; includes contact.
- **Footer links** – Privacy Policy and About are linked in the footer (Legal column).
- **Cookie consent** – Banner on first visit (Accept / Reject personalized ads). Stored in `localStorage`; reject triggers non‑personalized ads (`data-npa="1"`) on ad units.
- **AdSense script** – Loaded in the root layout when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set.
- **ads.txt** – Served at `/ads.txt` from env. Set `ADSENSE_PUBLISHER_ID` so the file contains the correct line for Google.
- **Ad unit component** – `<AdUnit slot="…" />` for placing ads once you have slot IDs.

## Steps to go live with ads

1. **Apply for AdSense** at [google.com/adsense](https://www.google.com/adsense). Ensure the site has original content, clear navigation, and a privacy policy (all in place).

2. **Add your AdSense URL** in the AdSense account (e.g. `https://thestash.xyz`) and add the **Privacy Policy URL** (e.g. `https://thestash.xyz/privacy`) in account settings.

3. **After approval**, in AdSense create ad units (e.g. Display ads, in-feed). Copy:
   - Your **publisher ID** (e.g. `ca-pub-XXXXXXXXXXXXXXXX`).
   - Each **ad unit slot ID** (numeric) for where you want ads.

4. **Set environment variables** (e.g. in Vercel or `.env.local`):
   - `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX` (same as publisher ID).
   - `ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX` (for ads.txt; same value).

5. **Verify ads.txt** – Visit `https://yourdomain.com/ads.txt`. It should show:
   ```text
   google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
   Google may take 24–72 hours to pick it up; AdSense warnings will clear once it’s crawled.

6. **Place ad units** – Where you want ads (e.g. sidebar, below content), use:
   ```tsx
   import { AdUnit } from "@/components/AdUnit";

   <AdUnit slot="1234567890" format="auto" className="my-4" />
   ```
   Use the slot ID from AdSense for each unit. `format` can be `"auto"`, `"rectangle"`, `"horizontal"`, or `"vertical"`.

## EU / UK consent (optional)

For traffic from the EEA, UK, or Switzerland, Google may require a **Consent Management Platform (CMP) certified by Google** (e.g. IAB TCF). The current cookie banner is a simple Accept/Reject; for strict compliance in those regions you can:

- Use [Google Funding Choices](https://support.google.com/adsense/answer/9042142) or another certified CMP, or
- Keep the current banner and rely on “Reject personalized ads” plus non‑personalized ads (`data-npa="1"`) for users who reject.

## Policy reminders

- Don’t put ad scripts or consent messages **on the Privacy Policy page** itself (we don’t).
- Don’t encourage clicks on ads (“click here” etc.).
- Keep content and navigation in line with [Google Publisher Policies](https://support.google.com/adsense/answer/10502938).

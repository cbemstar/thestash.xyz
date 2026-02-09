# Google AdSense setup

The Stash is set up to be **Google AdSense–ready**. Use this guide after your AdSense account is approved.

**If AdSense shows “Site down or unavailable” or “Needs attention”:** see [AdSense verification troubleshooting](adsense-verification.md) for causes (reachability, Vercel protection, 500 errors) and the checklist before requesting review again.

## Google’s CMP (consent message) for EEA, UK, Switzerland

Consent for users in the EEA, UK, and Switzerland is handled by **Google’s certified Consent Management Platform (CMP)**. Per Google’s documentation:

1. **No extra script is required.** Your existing AdSense tag automatically deploys the consent message once the message is **published** in AdSense: go to **Privacy & messaging** → **European regulations** → create your message (e.g. with 3 choices: Consent, Do not consent, Manage options) and click **Submit**.
2. **Consent revocation (required by IAB TCF):** Users must be able to change their consent. The site includes the revocation entrypoint required by Google: a “Privacy and cookie settings” link in the footer that calls `googlefc.showRevocationMessage()` so the European regulations message is shown again. See [Privacy & Messaging JavaScript API](https://developers.google.com/funding-choices/fc-api-docs#googlefc-showRevocationMessage).

## What’s already in place

- **Privacy Policy** (`/privacy`) – Required by AdSense. Covers data, cookies, and third‑party ads (Google).
- **About page** (`/about`) – Helps AdSense verify a real site; includes contact.
- **Footer links** – Privacy Policy and About are linked in the footer (Legal column).
- **Cookie consent** – Banner on first visit with a **Cookies Preferences Center** (Manage options). Four categories: Strictly necessary (always on), Functionality, Tracking cookies (analytics; enables GA4 user-ID collection when allowed), Targeting and advertising. Stored in `localStorage`; preferences are sent to Google via consent mode v2 (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`, `functionality_storage`). Rejecting targeting triggers non‑personalized ads (`data-npa="1"`) on ad units. Full preferences can be changed at `/privacy/settings`.
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
   - `NEXT_PUBLIC_ADSENSE_SLOT_HOME` – slot ID for the homepage ad (below hero).
   - `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` – slot ID for category and resource page ads.

5. **Verify ads.txt** – Visit `https://yourdomain.com/ads.txt`. It should show:
   ```text
   google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
   Google may take 24–72 hours to pick it up; AdSense warnings will clear once it’s crawled.

6. **Place ad units** – Ad units are already placed in the app and use slot IDs from env:
   - **Homepage** – below hero; uses `NEXT_PUBLIC_ADSENSE_SLOT_HOME` (horizontal).
   - **Category pages** – below hero; uses `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` (horizontal).
   - **Resource pages** – below breadcrumbs; uses `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` (rectangle).
   If the slot env vars are unset, placeholder slot `1234567890` is used (replace with your real slot IDs from AdSense). To add more units elsewhere:
   ```tsx
   import { AdUnit } from "@/components/AdUnit";

   <AdUnit slot="YOUR_SLOT_ID" format="auto" className="my-4" />
   ```
   `format` can be `"auto"`, `"rectangle"`, `"horizontal"`, or `"vertical"`.

## EU / UK consent (optional)

For traffic from the EEA, UK, or Switzerland, Google may require a **Consent Management Platform (CMP) certified by Google** (e.g. IAB TCF). The current cookie banner is a simple Accept/Reject; for strict compliance in those regions you can:

- Use [Google Funding Choices](https://support.google.com/adsense/answer/9042142) or another certified CMP, or
- Keep the current banner and rely on “Reject personalized ads” plus non‑personalized ads (`data-npa="1"`) for users who reject.

## Policy reminders

- Don’t put ad scripts or consent messages **on the Privacy Policy page** itself (we don’t).
- Don’t encourage clicks on ads (“click here” etc.).
- Keep content and navigation in line with [Google Publisher Policies](https://support.google.com/adsense/answer/10502938).

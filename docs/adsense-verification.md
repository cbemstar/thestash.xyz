# AdSense verification: "Site down or unavailable"

When AdSense shows **"Site down or unavailable"** and **"We found some policy violations"**, it means **Google’s crawler could not successfully load your site** when they tried to review it. That’s a **reachability** issue, not a content-policy rejection.

Reference: [AdSense Program Policies](https://support.google.com/adsense/answer/10502938).

---

## Why this happens

- The crawler got no response, a timeout, or an error (e.g. 500, 403).
- Common causes:
  1. **Site actually down** (deploy failed, DNS, outage).
  2. **Wrong URL** in AdSense (typo, `http` vs `https`, trailing slash, wrong domain).
  3. **Access blocked** (Vercel Deployment Protection / password, firewall, or bot blocking).
  4. **Server errors** (e.g. layout/page throws when Sanity or another service is slow or down → 500).

---

## Checklist before requesting review again

1. **URL in AdSense**
   - Use the exact live URL (e.g. `https://thestash.xyz`).
   - No typo, correct protocol (`https`), no stray path unless you intend to verify a subpath.

2. **Site is reachable**
   - Open the URL in an incognito window; homepage loads and shows content.
   - From another network/device if possible (rules out local/DNS issues).

3. **No crawler blocking**
   - **robots.txt**: Allows `Googlebot` (this project’s `src/app/robots.ts` already allows it).
   - **Vercel**: If you use [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection) (password, Vercel Authentication), **turn it off for the production domain** or add an exception so Googlebot can access the site. Otherwise Google will see a login/block page and report “site down or unavailable”.

4. **Site returns 200, not 500**
   - Root layout was updated so that if Sanity (or other data) fails, the layout still renders with empty footer data instead of throwing a 500. That way crawlers get a valid HTML page.
   - After deploy, hit the homepage a few times (and optionally run a quick smoke test) to confirm no 500s.

5. **Request review**
   - In AdSense: fix any issues above, then check **“I confirm I have fixed the issues”** and click **“Request review”**.

---

## Policy compliance (for after the site is reachable)

Once Google can crawl the site, they’ll also check [Google Publisher Policies](https://support.google.com/adsense/answer/10502938). This project is set up to align with common requirements:

| Requirement | Status in this project |
|-------------|------------------------|
| **Privacy policy** | `/privacy` exists; discloses data use, cookies, and third‑party ads (AdSense). Linked in footer. |
| **About / contact** | `/about` exists; helps establish a real site. |
| **ads.txt** | `/ads.txt` served via `next.config` rewrite to `/api/ads-txt`; line format: `google.com, pub-XXXXXXXX, DIRECT, f08c47fec0942fa0`. Set `ADSENSE_PUBLISHER_ID` in env for production. |
| **Original content** | Curated directory with hand-picked resources and descriptions (no “under construction” or thin copied content). |
| **Navigation** | Clear nav: Home, Collections, Categories, Tags, About, Privacy, Submit. |
| **No prohibited content** | No illegal, adult, dangerous, or deceptive content; no policy-violating replicated content. |
| **Ad placement** | Ad units (e.g. `AdUnit`) are in content areas, not overlaying navigation or dead-end screens. |

You must not:

- Put AdSense or consent scripts **on the Privacy Policy page** (this project does not).
- Encourage clicks on ads.
- Use more ads than substantive content on a page.

---

## Summary

- **“Site down or unavailable”** = Google couldn’t load your site (reachability/error), not a content policy violation.
- Fix: correct URL, site up and returning 200, no password/protection blocking Googlebot, then request review.
- This repo: root layout is resilient to Sanity failure; robots.txt allows Googlebot; privacy policy, about, and ads.txt are in place for policy compliance once the site is reachable.

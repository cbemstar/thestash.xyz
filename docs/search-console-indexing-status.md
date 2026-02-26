# Where to See Submitted URL Status (Indexing API)

We submit URLs to Google via the **Indexing API** (and sitemaps via Search Console). There is **no single “submitted URLs” dashboard**; you see the *effect* of submissions in these places.

---

## Google Search Console

1. **URL Inspection**  
   - Go to [Search Console](https://search.google.com/search-console) → select property `https://www.thestash.xyz/`.  
   - In the search bar at the top, paste any URL (e.g. `https://www.thestash.xyz/tools`).  
   - You’ll see **index status**, **last crawl time**, **coverage state**, and whether the URL is indexed, excluded, or not yet crawled.  
   - This is the main place to check “status” for a specific submitted URL.

2. **Pages report (Index → Pages)**  
   - **Index** (left) → **Pages**.  
   - Shows **indexed** vs **not indexed** counts and reasons (e.g. “Crawled – currently not indexed”, “Discovered – currently not indexed”).  
   - You see aggregate results of crawling/indexing; not a list of “Indexing API requests.”

3. **Sitemaps**  
   - **Index** → **Sitemaps**.  
   - Shows submitted sitemaps and how many URLs were discovered from them.  
   - Does not show Indexing API submissions; those are separate.

**Summary:** Use **URL Inspection** for per-URL status; use **Pages** for overall indexing health. There is no GSC screen that lists “URLs submitted via Indexing API.”

---

## Google Cloud Console

1. **Indexing API usage / quota**  
   - [APIs & Services](https://console.cloud.google.com/apis/dashboard) → **Enabled APIs** → **Indexing API** (or **Library** → search “Indexing API” → open it).  
   - **Quota** (or **Metrics**) shows **requests per day** (e.g. 200/day). You can see how much quota you’ve used; you do **not** see a list of which URLs were submitted.

2. **Logs (optional)**  
   - **Logging** → **Logs Explorer**.  
   - Filter by the Indexing API or your project to see API call logs (success/errors).  
   - Still no “submitted URLs” list; just request/response and errors.

**Summary:** Cloud Console shows **quota usage** and **API logs**, not a “submitted URLs” status list.

---

## How to verify that submissions worked

- **Per URL:** Search Console → **URL Inspection** → paste the URL → check index status and last crawl.  
- **Overall:** Search Console → **Index** → **Pages** → review indexed vs not indexed counts and reasons.  
- **Quota:** Cloud Console → **APIs & Services** → **Indexing API** → **Quota** (or **Metrics**).

Over time, URLs you submitted via the Indexing API should appear as “Indexed” or show a recent crawl in URL Inspection, assuming Google decides to index them.

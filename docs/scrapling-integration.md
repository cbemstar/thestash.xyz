# Using Scrapling to Our Advantage

[Scrapling](https://github.com/D4Vinci/Scrapling) is an adaptive Python web-scraping framework with stealth fetchers, spiders, and an MCP server. Here’s how it fits thestash.xyz and where to plug it in.

## Where we currently hit limits

| Area | Current approach | Limitation |
|------|------------------|------------|
| **Link validation** | `scripts/publish-discovery.js` + `checkUrlAlive()` (plain `fetch`) | Sites behind Cloudflare / bot detection return 403 or captcha; we mark links "dead" even when they’re live. |
| **Tool runtime crawl** | `lib/server/tool-runtime.ts` `fetchResource()` + `crawlWebsite()` | Same: no JS rendering, no anti-bot; fails on protected or JS-heavy pages. |
| **Scout / discovery** | Node `fetch` in scout-agent and shared helpers | Valuable tool pages (e.g. SaaS landing pages) often block simple HTTP; we miss or mis-classify leads. |
| **Metadata enrichment** | Likely manual or simple fetch | OG tags / descriptions from protected domains are hard to get. |

Scrapling helps where we need **stealth**, **JS rendering**, or **resilient crawling** that our current Node `fetch` stack doesn’t provide.

## How to use Scrapling to our advantage

### 1. **Fallback link checker (discovery pipeline)**

When `checkUrlAlive()` in `publish-discovery.js` gets 403, timeout, or captcha:

- Call a small **Python script** that uses Scrapling’s `StealthyFetcher` (or `Fetcher` with impersonation) to do a single request.
- If Python returns 2xx, treat the link as **alive** and continue (e.g. publish candidate); otherwise keep as dead.

**Benefit:** Fewer false “dead” links and more published resources from protected domains.

### 2. **Stealth fetch for tool runtime (optional fallback)**

For the workbench tools that fetch or crawl a URL:

- Keep current Node `fetchResource()` as the default (fast, no browser).
- Add an optional “use stealth fetch” (or “URL blocked?”) path that calls out to a **Scrapling-based service** (script or small API) for that URL only.
- Use `StealthyFetcher.fetch(url, headless=True)` or `DynamicFetcher` for JS-heavy pages; return body/status to the Node side.

**Benefit:** Tools keep working when the target site blocks normal bots.

### 3. **Discovery enrichment (OG / meta)**

When validating or researching a candidate URL:

- Use Scrapling to fetch the page (with stealth if needed), then parse:
  - `<meta property="og:title">`, `og:description`, `og:image`
  - `<meta name="description">`
  - `<title>`
- Feed that into Sanity (e.g. default title/description, or suggestions for the editor).

**Benefit:** Richer, more accurate metadata with less manual work, especially for Cloudflare-protected or JS-rendered pages.

### 4. **Bulk link checks with Spider (optional)**

For large batches (e.g. “revalidate all resource URLs”):

- Use Scrapling’s **Spider** with a single start URL per resource (or a list), `StealthyFetcher`/session, and concurrency limits.
- Export results (e.g. URL → status code, or “alive”/“dead”) to JSON; consume from Node or from the dashboard.

**Benefit:** Scale link validation with pause/resume and proxy rotation if we add it later.

### 5. **MCP server for ad-hoc scraping**

Scrapling’s **MCP server** lets Cursor (or other MCP clients) “scrape this URL” or “extract these elements” without writing one-off scripts.

- Install: `pip install "scrapling[ai]"` and run the Scrapling MCP server in your Cursor MCP config.
- Use during content ops: “Get the pricing section from https://…”, “Check if this link is reachable”, “Pull OG data from this URL”.

**Benefit:** Faster research and metadata gathering during curation and when debugging “dead” links.

## Phase 0: Validate with MCP before committing to the script

**Idea:** Use Scrapling’s **MCP server** as a simple test *before* committing to the Python script and pipeline: check previously failed URLs (anti-bot, Cloudflare, 403, timeout) directly via MCP in Cursor. If Scrapling can fetch them, you have evidence the approach works — then wire in the script and `USE_SCRAPLING_FALLBACK`.

**Why this helps:**

- **Low commitment** — No CI changes, no `USE_SCRAPLING_FALLBACK` until you’re sure.
- **Real data** — You test the same URLs your discovery pipeline already marked dead.
- **Fast feedback** — One or two MCP calls (“scrape this URL” / “check if this link is reachable”) tell you if StealthyFetcher gets through.

**Steps:**

1. **Get failed URLs from past discovery runs**  
   From `automation/discovery-results-*.json`, take entries where `status === 'dead-link'` (and optionally where `linkCheck.httpStatus === 403` or `linkCheck.error === 'fetch-error'` / `'AbortError'`).  
   You can use the one-liner below, or open the JSON and copy a few URLs.

2. **Install and run Scrapling MCP**  
   `pip install "scrapling[ai]"` (and if you expect Cloudflare: `pip install "scrapling[fetchers]"` then `scrapling install`). Add the Scrapling MCP server to your Cursor MCP config.

3. **Test in Cursor**  
   Ask the AI (with MCP available): “Using Scrapling, check if this URL is reachable: https://…” or “Scrape this URL and tell me if you got content: …”. Use 2–3 previously failed URLs.

4. **Decide**  
   If MCP can fetch those URLs → enable the Python script and `USE_SCRAPLING_FALLBACK=1` in the pipeline. If MCP also fails → the site may need different handling (e.g. captcha, IP rules); no need to commit to the script yet.

**Extract failed URLs from a discovery result file (one URL per line):**

```bash
node -e "
const fs = require('fs');
const path = process.argv[2] || 'automation/discovery-results-' + new Date().toISOString().slice(0,10) + '.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const items = Array.isArray(data) ? data : data.items || [];
items.filter(r => r.status === 'dead-link').forEach(r => console.log(r.url));
"
```

Pass the path to a specific `discovery-results-*.json` as the first argument if needed.

### Phase 0 results (2026-02-27)

- **Installed:** `pip install scrapling` then `pip install "scrapling[fetchers]"` and `scrapling install` (browsers).
- **Dead-link from discovery:** `https://opendsa.org/` (from `discovery-results-2026-02-12.json`).
- **Plain fetch (Fetcher.get):** Failed — SSL certificate mismatch (`no alternative certificate subject name matches target hostname 'opendsa.org'`). Same kind of failure Node fetch would hit.
- **Stealth fetch (StealthyFetcher):** **Success** — `Fetched (200)`, script exit 0. Stealth (headless browser) reached the page.
- **Conclusion:** Scrapling stealth can recover URLs that fail with plain fetch (SSL quirks or anti-bot). Safe to commit to the Python script and `USE_SCRAPLING_FALLBACK` in the pipeline.

**Next step:** When running discovery, set `USE_SCRAPLING_FALLBACK=1` so dead links (403, timeout, etc.) are retried with the Scrapling script; use `--stealth` for those cases (already wired in `checkUrlAliveWithOptionalScraplingFallback`).

## Recommended first step (after MCP validation)

Add a **small Python CLI** (e.g. `scripts/check_url_scrapling.py`) that:

1. Takes a single URL (and optional `--stealth`).
2. Uses `Fetcher.get(url)` by default, or `StealthyFetcher.fetch(url, headless=True)` when `--stealth` is set.
3. Exits with code 0 if response is 2xx, non-zero otherwise; optionally prints status and content-type.

Then in `publish-discovery.js`:

- When `checkUrlAlive()` returns `status === 'dead'` and (optionally) `httpStatus === 403` or timeout, call this script once for that URL.
- If exit code 0, treat the link as alive and proceed.

This gives immediate value (fewer false dead links) with minimal change to the existing pipeline. Enrichment (OG/meta) and tool-runtime fallback can be added next.

## Scrapling fallback in publish-discovery (on by default)

When `scripts/check_url_scrapling.py` exists, the discovery pipeline **automatically** retries dead links (403, timeout, SSL, etc.) with Scrapling stealth before marking them dead. No env var needed. To disable: `USE_SCRAPLING_FALLBACK=0`.

- **Run discovery:** `npm run discovery:publish` (uses `automation/discovery-candidates.json` → `automation/discovery-results-YYYY-MM-DD.json`).
- **Requires:** `pip install "scrapling[fetchers]"` and `scrapling install` so the script can use `--stealth`.

## Scrapling in the automation pipeline (daemon / curator)

The **research agent** (scout → research → editor → publisher) uses the same Scrapling fallback when validating lead URLs. If Node `fetch` marks a URL invalid (403, timeout, SSL), the agent retries with `scripts/check_url_scrapling.py --stealth`; if the script exits 0, the lead is treated as valid and continues to editor → publisher.

- **Flow:** Daemon runs curator on an interval → scout finds leads → research validates each lead URL (Node fetch, then Scrapling fallback if invalid) → editor → publisher.
- **Fallback is on by default** when the script exists. To disable in the pipeline: `USE_SCRAPLING_FALLBACK=0` when starting the daemon (e.g. `USE_SCRAPLING_FALLBACK=0 npm run agent:daemon`).
- **Start automation:** `npm run agent:daemon` (or `agent:daemon:start` for the service). After integrating Scrapling, clear any stop request so the daemon continues; if it was stopped, start it again with `npm run agent:daemon`.

## Scrapling install (for scripts / MCP)

```bash
# Minimal (parser + HTTP fetcher)
pip install scrapling

# With stealth + browser (for Cloudflare / JS)
pip install "scrapling[fetchers]"
scrapling install   # browsers + deps

# With MCP for Cursor
pip install "scrapling[ai]"
```

Docs: [scrapling.readthedocs.io](https://scrapling.readthedocs.io/en/latest/).

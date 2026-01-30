# Automation: Link → Sanity → SEO-ready page

You can add resources to The Stash automatically from n8n, Make, clawd.bot, or any tool that can send HTTP requests. Each new resource gets a dedicated, SEO-optimized page (metadata, JSON-LD, canonical URL).

## Overview

1. **Trigger**: You share a link (e.g. from n8n “Webhook”, clawd.bot, or a form).
2. **Enrich (optional but recommended)**: Use an AI step to generate `title`, `description`, `category`, and `tags` from the URL so the listing is SEO and AI-optimized.
3. **Create**: POST to the Stash API; it creates and publishes the resource in Sanity.
4. **Result**: The site gets a new page at `https://thestash.xyz/<slug>` with proper metadata and schema.

## API: Create resource

**Endpoint:** `POST /api/resources`

**Headers:**

- `Content-Type: application/json`
- If `WEBHOOK_SECRET` is set: `X-Webhook-Secret: <your-secret>`

**Body (JSON):**

| Field         | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `url`        | string   | Yes      | Full URL (https://…) |
| `title`      | string   | Yes      | 2–120 characters |
| `description`| string   | Yes      | 10–260 characters |
| `category`   | string   | Yes      | One of: `design-tools`, `development-tools`, `ui-ux-resources`, `inspiration`, `ai-tools`, `productivity`, `learning-resources`, `miscellaneous` |
| `slug`       | string   | No       | URL path (e.g. `figma`). Auto-generated from title if omitted. |
| `tags`       | string[] | No       | e.g. `["ai", "api"]` |
| `featured`   | boolean  | No       | Default `false` |

**Example:**

```json
{
  "url": "https://figma.com",
  "title": "Figma",
  "description": "Collaborative interface design tool for teams. Design, prototype and hand off with Dev Mode.",
  "category": "design-tools",
  "slug": "figma",
  "tags": ["design", "prototyping"],
  "featured": false
}
```

**Success (200):**

```json
{
  "ok": true,
  "id": "<sanity-document-id>",
  "slug": "figma",
  "url": "https://thestash.xyz/figma"
}
```

**Errors:** `400` (validation), `401` (wrong/missing webhook secret), `503` (Sanity not configured).

## Environment variables

- **Required for API:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_API_TOKEN`
- **Optional:** `WEBHOOK_SECRET` — if set, requests must send `X-Webhook-Secret: <value>`
- **Optional:** `NEXT_PUBLIC_SITE_URL` — used in the response `url` (default `https://thestash.xyz`)

## n8n example

1. **Webhook** node: trigger on POST, body = `{ "url": "https://..." }`.
2. **OpenAI / Claude** node: prompt like — “Given this URL: {{ $json.url }}, return JSON with: title (2–120 chars), description (10–260 chars), category (one of: design-tools, development-tools, ui-ux-resources, inspiration, ai-tools, productivity, learning-resources, miscellaneous), tags (array of strings).” Parse the model output to get `title`, `description`, `category`, `tags`.
3. **HTTP Request** node:
   - Method: POST
   - URL: `https://your-stash-domain.com/api/resources`
   - Headers: `Content-Type: application/json`, and if you use a secret: `X-Webhook-Secret: {{ $env.WEBHOOK_SECRET }}`
   - Body: merge URL from step 1 and title/description/category/tags from step 2 (and optional `slug` from title).

Result: new resource in Sanity and a live SEO page at `https://thestash.xyz/<slug>`.

## clawd.bot / other tools

- **Trigger**: When a link is saved or shared (e.g. Slack, Discord, bookmark).
- **Step 1**: Call your AI provider with the URL to get `title`, `description`, `category`, `tags`.
- **Step 2**: POST to `https://thestash.xyz/api/resources` (or your deployment URL) with the payload above.

Using the same API and optional `WEBHOOK_SECRET` keeps the flow secure and consistent across tools.

## SEO and AI optimization

- Each resource has its own page with `generateMetadata` (title, description, Open Graph, Twitter, canonical).
- JSON-LD `SoftwareApplication` is output on the resource page for rich results.
- For “AI-optimized” content, the enrichment step (AI node) should produce a clear, factual description and consistent category/tags so the listing is useful for both users and crawlers.

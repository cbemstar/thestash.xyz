# Loops.so weekly digest automation

Send a weekly email every **Monday at 8:00** to subscribers on **The Stash** list with the latest resources added to the app.

## Overview

1. **Destination URL**: [https://www.thestash.xyz/latest](https://www.thestash.xyz/latest) — lists resources added in the past 7 days (updated every 5 minutes).
2. **Loops**: Create a Loop (event-triggered digest) or a recurring Campaign that sends to **The Stash** list and links to `/latest`.
3. **Trigger**: Either use Loops’ scheduled Campaign (if available) or a cron job that calls our API to send Loops events to each subscriber.

---

## Option A: Loops scheduled Campaign (simplest)

If your Loops plan supports **recurring/scheduled campaigns**:

1. In [Loops](https://app.loops.so), go to **Campaigns** and create a new campaign.
2. Set **Schedule** to **Recurring** → **Weekly** → **Monday** at **8:00 AM** (choose your timezone, e.g. Pacific).
3. Set **Audience** to the list **The Stash** (create the list in Loops if it doesn’t exist; ensure `LOOPS_MAILING_LIST_ID` in your app points to this list so signups go here).
4. **Email content**:
   - Subject: e.g. *“New resources on The Stash this week”*
   - Body: Short intro + a clear CTA button/link to **https://www.thestash.xyz/latest**
   - Example: *“Here are the latest dev & design resources we added. [View latest resources →](https://www.thestash.xyz/latest)”*
5. Save and activate. No code or cron needed; the page `/latest` is always up to date when they open it.

---

## Option B: Event-triggered digest (dynamic template + events API)

Use this for a **dynamic email**: top 5 resources in the body and a **dynamic CTA button** (“View all resources” if there are more than 5, otherwise “Visit thestash.xyz”). The schedule is set by **your cron** (e.g. Vercel Cron Monday 8am); when the cron runs, it calls your API, which sends a **Loops event** for each subscriber. Loops’ trigger is **Event received** (`weeklyDigest`), so the email is triggered by that event (driven by your schedule).

**Does this work with a webhook received by Loops and a schedule set in Loops?** The schedule is **not** set inside Loops — Loops has no “run every Monday 8am” trigger. The flow is: **your cron (e.g. Vercel Cron Monday 8am) → calls your API → your API calls Loops “Send event”** (one event per subscriber). Loops’ trigger is **Event received** (`weeklyDigest`), so each event triggers the Loop and sends the email. So: **the schedule is in your cron**; **Loops “Event received”** is the trigger that runs when your API sends the event. If you use Loops’ “incoming webhooks” feature, you’d typically point an external scheduler (Zapier, Make, or your cron) at your own API; your API then sends the events to Loops. The dynamic template (top 5 + button) works because your API computes the payload (resourcesListHtml, buttonText, buttonUrl) before sending each event.

### 1. Event properties (sent by the API)

The cron API sends these **event properties** for every `weeklyDigest` event:

| Property | Type | Description |
|----------|------|-------------|
| `resourcesListHtml` | string | HTML list of **top 5** resources (title + link to resource page). Safe to render in email. |
| `resourcesCount` | number | Total resources added in the last 7 days. |
| `buttonText` | string | **“View all resources”** if `resourcesCount` > 5, else **“Visit thestash.xyz”**. |
| `buttonUrl` | string | **https://www.thestash.xyz/latest** if > 5, else **https://www.thestash.xyz**. |
| `latestUrl` | string | Always `https://www.thestash.xyz/latest` (for fallbacks). |

### 2. Create the Loop in Loops

1. Go to [Loops → Loops](https://app.loops.so/loops) and create a new Loop.
2. **Trigger**: **Event is fired** → event name: **`weeklyDigest`**.
3. **Event properties** (add via “Edit event properties”): `resourcesListHtml`, `resourcesCount`, `buttonText`, `buttonUrl`, `latestUrl` (all with fallbacks below).
4. **Trigger frequency**: **Every time**.
5. **Step**: **Send email** — build your template. Use the ⚡ button to insert event properties and set **fallbacks** so the email still sends if a value is missing:
   - `resourcesListHtml` → fallback: `"<p>No new resources this week.</p>"`
   - `resourcesCount` → fallback: `0`
   - `buttonText` → fallback: `"Visit thestash.xyz"`
   - `buttonUrl` → fallback: `https://www.thestash.xyz`
6. **Activate** the Loop.

### 3. Example email template (Loops editor)

- **Subject**: e.g. `New on The Stash this week ({{resourcesCount}} resources)` with fallback `New on The Stash this week`.
- **Body** (conceptual):

```html
<p>Here are the latest resources we added:</p>
{{resourcesListHtml}}

<p><a href="{{buttonUrl}}" style="display:inline-block; padding:10px 20px; background:#ea580c; color:#fff; text-decoration:none; border-radius:6px;">{{buttonText}}</a></p>
```

- In Loops, insert each variable via ⚡ → Event property, and set the fallbacks above so the email always sends.

### 4. Trigger the digest (cron → API → Loops events)

Loops does not expose an API to “get all contacts in list,” so the digest must be triggered by your app (or another service) that already has the list of subscriber emails.

**Option B1 – Vercel Cron + API (this repo)**

- This repo includes:
  - **`POST /api/cron/weekly-digest`** — when called with auth, fetches recent resources (last 7 days) from Sanity and sends a Loops **Send event** (`weeklyDigest`) to each subscriber email.
  - **`vercel.json`** — cron schedule `0 8 * * 1` (Monday 8:00 UTC). Adjust the schedule or timezone in Vercel dashboard if you want 8:00 in your timezone.
- **Auth**: Send `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`. Set `CRON_SECRET` (or `VERCEL_CRON_SECRET`) in Vercel; Vercel Cron automatically sends the secret when it invokes the route.
- **Subscriber list**: Either set **`LOOPS_DIGEST_EMAILS`** in env (comma-separated emails) or send a JSON body `{ "emails": ["a@example.com", ...] }` with the request. To keep the list in sync with Loops, export “The Stash” list from Loops (CSV) periodically and update `LOOPS_DIGEST_EMAILS`, or add a Sanity `subscriber` type and store emails when users sign up so the cron can read from Sanity.

**Option B2 – You don’t store subscribers in app**

- Export “The Stash” list from Loops (e.g. CSV) and set **`LOOPS_DIGEST_EMAILS`** in Vercel env (comma-separated). The cron will use this list every Monday.

### 5. Env and security

- **`LOOPS_API_KEY`** — already used for signup; same key is used for Send event.
- **`CRON_SECRET`** (or **`VERCEL_CRON_SECRET`**) — set in Vercel; required to call `POST /api/cron/weekly-digest`. Vercel Cron sends it automatically.
- **`LOOPS_DIGEST_EMAILS`** (optional) — comma-separated list of subscriber emails. If set, the cron uses this instead of a request body. Update it when you export from Loops or sync from your own store.

---

## The Stash list in Loops

- Create a list in Loops named **The Stash** (or any name).
- In [Loops → Lists](https://app.loops.so), copy the list ID and set `LOOPS_MAILING_LIST_ID` in your app so new signups from the site are added to this list.
- All weekly digest options above send to this list (Campaign audience or event recipients).

---

## Summary

| Goal | Approach |
|------|----------|
| Weekly Monday 8am | Loops recurring Campaign (Option A) or cron + API (Option B). |
| Audience | The Stash list in Loops. |
| Content | Link to **https://www.thestash.xyz/latest** (and optionally event props for custom body in Option B). |
| MCP | If you use a Loops MCP server, you can create/update the Loop and Campaign via MCP instead of the Loops UI; the app-side `/latest` and optional `/api/cron/weekly-digest` stay the same. |

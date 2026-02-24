# Comments with Waline – Setup & Troubleshooting

Blog comments use [Waline](https://waline.js.org/). The client runs on thestash.xyz; the server runs as the **stash** Vercel project and must connect to **Neon** (PostgreSQL).

## Audit results (Neon + Vercel)

- **Neon:** Project **Stash** (`odd-tooth-47468601`) has the Waline tables: `wl_comment`, `wl_counter`, `wl_users`. Schema is present.
- **Vercel:** **stash** project (`stash-five-roan.vercel.app`) returns **500 "Not initialized"** on `/api/comment` in runtime logs. So the Waline server is **not** connecting to the database.
- **Cause:** The **stash** Vercel project is missing or misconfigured **Postgres env vars**. Waline does not use `POSTGRES_URL` alone; it needs the individual `PG_*` (or `POSTGRES_*`) variables.

## Fix: Set env vars on the **stash** Vercel project

1. In **Vercel** → **stash** project (not thestash-xyz) → **Settings** → **Environment Variables**.
2. Add these for **Production** (and Preview if you use previews). Use the values from your Neon project **Stash** (Connection details in [Neon Console](https://console.neon.tech)):

   | Name | Value | Notes |
   |------|--------|--------|
   | `PG_HOST` | `ep-small-poetry-aiw8lxm3-pooler.c-4.us-east-1.aws.neon.tech` | From Neon connection string (pooler host). |
   | `PG_PORT` | `5432` | Standard Postgres port. |
   | `PG_DB` | `neondb` | Database name. |
   | `PG_USER` | `neondb_owner` | User from Neon. |
   | `PG_PASSWORD` | *(from Neon)* | Copy from Neon Dashboard → Stash project → Connection details (connection string or Password). |
   | `PG_SSL` | `true` | Required for Neon. |

   You can use `POSTGRES_HOST`, `POSTGRES_PORT`, etc. instead of `PG_*`; Waline accepts both.

3. **Redeploy** the **stash** project (Deployments → … → Redeploy) so the new env vars are applied.
4. Test again on a blog post; the "Not initialized" error should stop.

## Main site (thestash.xyz)

- Set **`NEXT_PUBLIC_WALINE_SERVER_URL`** to your Waline server URL, e.g. `https://stash-five-roan.vercel.app` (no trailing slash).
- Redeploy thestash.xyz after changing env vars so the client gets the value at build time.

## Deleting comments

### As site admin (you)

1. Open the **Waline admin panel**: `https://<your-waline-server>/ui`  
   Example: `https://stash-five-roan.vercel.app/ui`
2. **First time:** Log in with the same identity you use when commenting (name + email). The first user to log in to the admin is typically treated as the administrator.
3. In the admin UI, open the **comment management** section, find the comment, and use the **delete** (or trash) action.

### As a commenter (reader)

- **From the widget:** On their own comment, Waline may show a **"..."** or similar menu with an option to delete. If that option is not there, commenters cannot delete their own comment from the page.
- **Otherwise:** They can ask the site owner (you) to remove it via the admin panel above.

## References

- [Waline server env vars](https://waline.js.org/en/reference/server/env.html)
- [Waline database (PostgreSQL)](https://waline.js.org/en/guide/database.html)

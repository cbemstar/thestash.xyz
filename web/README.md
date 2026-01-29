**The Stash** – a visual resource repository (Next.js + Sanity) for saving and categorizing web links, design tools, courses, AI tools, and inspiration.

## Getting Started

1. **Environment** – Copy `.env.example` to `.env.local` and set your Sanity project ID:
   ```bash
   cp .env.example .env.local
   ```
   In `.env.local`, set `NEXT_PUBLIC_SANITY_PROJECT_ID` to your real project ID from [sanity.io/manage](https://sanity.io/manage) (Project settings → Project ID). Use only lowercase letters, numbers, and dashes.

2. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the main site.

### Is Sanity connected?

- If the homepage shows resource cards (or “No resources match…” when the dataset is empty) and you **don’t** see a terminal warning about `NEXT_PUBLIC_SANITY_PROJECT_ID`, Sanity is connected.
- If you see a warning like “NEXT_PUBLIC_SANITY_PROJECT_ID is missing or invalid”, fix `.env.local` and restart `npm run dev`.

### How to add new links (upload via Sanity)

1. With the app running (`npm run dev`), open **[http://localhost:3000/studio](http://localhost:3000/studio)**.
2. Log in with your Sanity account if prompted (same account as the project in [sanity.io/manage](https://sanity.io/manage)).
3. In the Studio sidebar, open **Resource**.
4. Click **Create** → **Resource** and fill in:
   - **Title** – name of the link
   - **URL** – full URL (e.g. `https://…`)
   - **Description** – short description (required)
   - **Category** – e.g. Design Tools, AI Tools, Inspiration, etc.
   - **Tags** (optional) – e.g. `figma`, `free`
   - **Icon** (optional) – image
   - **Featured** (optional) – toggle for highlighting
5. Click **Publish**. The new resource appears on the homepage within about a minute (ISR revalidates every 60 seconds), or after a refresh.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy to production (Vercel + thestash.xyz)

### 1. Push to GitHub

From the repo root (the folder that contains `web/`):

```bash
git add .
git commit -m "The Stash: Next.js + Sanity ready for deploy"
git remote add origin https://github.com/YOUR_USERNAME/thestash.xyz.git   # or your repo URL
git push -u origin main
```

Use your actual GitHub repo URL. Create the repo on GitHub first if needed (empty repo, no README).

### 2. Import to Vercel and create project

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** – select your GitHub account and choose the `thestash.xyz` repo.
3. **Configure Project:**
   - **Root Directory:** click **Edit**, set to `web` (so Vercel builds the Next.js app inside `web/`).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** leave default (Next.js handles it).
4. **Environment Variables** – add these (same values as your local `.env.local`):
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = your Sanity project ID
   - `NEXT_PUBLIC_SANITY_DATASET` = `production` (or your dataset name)
5. Click **Deploy**. Wait for the build; you’ll get a `*.vercel.app` URL.

### 3. Sanity CORS for production

So the live site and Studio at `/studio` can talk to Sanity:

1. Open [sanity.io/manage](https://sanity.io/manage) → your project → **API** → **CORS origins**.
2. Add:
   - `https://thestash.xyz` (production)
   - `https://*.vercel.app` (preview deployments; add as a wildcard if supported)
   For each origin, enable **Allow credentials** and save.

### 4. Add custom domain thestash.xyz

1. In Vercel: open your project → **Settings** → **Domains**.
2. Add `thestash.xyz` and `www.thestash.xyz` (optional).
3. Vercel will show the DNS records to add at your registrar (e.g. A record or CNAME).
4. At your domain registrar (where you bought thestash.xyz), add the records Vercel shows:
   - Usually: **A** record `@` → `76.76.21.21`, or **CNAME** `www` → `cname.vercel-dns.com`.
   - For apex `thestash.xyz`, Vercel often recommends their nameservers or an A record.
5. Wait for DNS to propagate (minutes to a few hours). Vercel will issue SSL automatically.

After DNS is live, the site will be at **https://thestash.xyz** and Studio at **https://thestash.xyz/studio**. You can set up automations next.

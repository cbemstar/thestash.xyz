# Product Hunt vs The Stash: Gap Analysis & Improvement Roadmap

A research-backed comparison of Product Hunt's features with The Stash, identifying gaps and opportunities to differentiate and outcompete.

---

## Product Hunt's Core Features

| Feature | Description |
|---------|-------------|
| **Upvoting** | Users vote for products; first 4 hours hide counts for fairness |
| **Time-based ranking** | "Today", "Yesterday", "Last Week", "Last Month" leaderboards |
| **Comments** | Discussion threads on each product with replies |
| **User collections** | Anyone can curate lists (e.g. "10 AI Tools for Meetings") |
| **Forums** | Community discussions, polls, advice threads |
| **Newsletters** | Daily/weekly digests of top products |
| **Search** | Full-text search across products |
| **Categories** | Hierarchical topics (Design Tools → Figma Plugins) |
| **Trending** | "Trending products", "Trending categories", "Top reviewed" |
| **User profiles** | Makers, hunters, collectors with activity history |
| **Daily launch** | Homepage refreshes daily at midnight PST; "launching today" emphasis |

---

## The Stash: Current State

| Feature | Status |
|---------|--------|
| Categories | ✅ |
| Search + filter | ✅ |
| Tags | ✅ |
| Curated collections | ✅ (admin-only) |
| RSS feed | ✅ |
| Newsletter signup | ✅ |
| Recently viewed | ✅ |
| Featured carousel | ✅ |
| Grid view | ✅ |
| **List view** | ✅ (new) |
| Social sharing | ✅ |
| OpenGraph / SEO | ✅ |
| Tag pages | ✅ |

---

## Gaps & Missing Features

### 1. **No engagement signals (voting / saves)**

**Product Hunt:** Upvoting drives ranking and social proof.

**The Stash:** No way for users to signal preference.

**Opportunity:** Add a **"Save for later"** (bookmark) with localStorage first—no auth required. Later, if you add auth, sync to backend. Simpler than votes, less gamification, but high utility for a dev/design audience.

---

### 2. **No time-based discovery**

**Product Hunt:** "Top products today", "Last week", "Last month".

**The Stash:** Sorted by `createdAt` (newest first) but no time-bucketed views.

**Opportunity:**
- **"New" badges** – Show "Added 2 days ago" (list view already has this).
- **Time filters** – "New this week", "New this month" in the filter bar.
- **"Recently added" section** – You have Featured; emphasize "New" as a distinct section.

---

### 3. **No sort options**

**Product Hunt:** Implicit via time buckets.

**The Stash:** Fixed order (newest first).

**Opportunity:** Add sort:
- Newest first (default)
- Alphabetical (A–Z)
- If you add saves: "Most saved"
- If you add visits: "Most visited" (requires analytics)

---

### 4. **No comments / discussion**

**Product Hunt:** Comments create community and trust.

**The Stash:** None.

**Opportunity:** Comments are high-effort (auth, moderation, spam). Alternatives:
- **Reviews** – "How are you using this?" short prompts.
- **External discussions** – Link to HN, Reddit, Discord threads if you have them in Sanity.
- **Curator notes** – Editorial notes on each resource (you control content; no moderation).

---

### 5. **User collections (curation)**

**Product Hunt:** Anyone can create collections.

**The Stash:** Collections are admin-curated only.

**Opportunity:** User collections need auth and storage. Easier wins:
- **Shareable filter URLs** – Already done (`/?category=X&search=Y`).
- **"Copy collection as URL"** – Let users save a filtered view as a shareable link.
- **Personal lists** – localStorage "My list" with export (JSON/CSV) before adding backend.

---

### 6. **No trending / popularity signals**

**Product Hunt:** Trending products, top reviewed.

**The Stash:** No popularity metrics.

**Opportunity:**
- **View counts** – Track resource page views (Vercel Analytics, Plausible) and sort/filter by "Most viewed".
- **Click-through** – Track "Visit site" clicks as a proxy for interest.
- **"Editors’ picks"** – Use `featured` flag more prominently (you already have it).

---

### 7. **No forums / community**

**Product Hunt:** Forums for discussions, polls, advice.

**The Stash:** No community space.

**Opportunity:** Forums are heavy to run. Lighter options:
- **"Discuss" link** – Point to a Discord, Slack, or GitHub Discussions.
- **Newsletter Q&A** – "Reply with questions" in the newsletter.
- **Resource-specific threads** – If you add comments, start there.

---

### 8. **Category depth**

**Product Hunt:** Nested categories (Design Tools → Figma Plugins).

**The Stash:** Flat categories.

**Opportunity:** Subcategories in Sanity (e.g. "AI Tools" → "Code assistants", "Image generators"). FilterBar supports hierarchy. Improves discovery without much UI change.

---

## Differentiators: How to Be Better Than Product Hunt

| Area | Product Hunt | The Stash advantage |
|------|--------------|---------------------|
| **Focus** | Broad tech products | Dev + design only → deeper curation |
| **No launch-day bias** | Daily reset favors today's launches | Evergreen directory; resources stay findable |
| **Curator trust** | Crowd votes | Hand-picked; quality over hype |
| **Technical depth** | Tagline + link | Full descriptions, use cases, related resources |
| **SEO** | Product pages | Tag pages, collections, schema markup, RSS |
| **Speed** | Heavier, lots of JS | Lightweight, fast filters, instant view toggle |
| **UX** | One layout | Grid + list, fast client-side filtering |

---

## Recommended Implementation Order

### Phase 1: Quick wins (1–2 days)
1. **Sort options** – Newest, A–Z in FilterBar.
2. **"New this week" filter** – Time-based filter using `createdAt`.
3. **Save for later** – localStorage bookmark list; "My saved resources" page.

### Phase 2: Engagement (3–5 days)
4. **View counts** – Integrate analytics, add "Most viewed" sort.
5. **"New" badges** – Prominent on cards for resources &lt; 7 days old.
6. **Shareable filter URLs** – Already done; add "Copy filter link" button.

### Phase 3: Depth (1–2 weeks)
7. **Subcategories** – Schema + UI for nested categories.
8. **Curator notes** – Optional long-form field in Sanity for editorial context.
9. **Personal lists** – localStorage "My list" with export.

### Phase 4: Community (optional, 2+ weeks)
10. **Comments or reviews** – Requires auth (e.g. Supabase, NextAuth).
11. **User collections** – Requires auth + backend.
12. **Forums** – Consider external tools (Discourse, Circle) or skip.

---

## Summary

The Stash already differentiates with focus (dev/design), curation, and technical depth. The main gaps are engagement signals, time-based discovery, and sort options—all implementable without auth. Prioritize **sort**, **time filters**, and **save for later** for the fastest impact.

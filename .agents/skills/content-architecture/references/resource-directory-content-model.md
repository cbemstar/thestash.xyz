# Resource Directory Content Model

Content architecture for a **resource directory** or **link stash** (e.g. The Stash, nocodesupply-style): one primary document type for listable items, with slug, categories, tags, and optional media.

## Document Type: `resource`

A single entry in the directory: a tool, link, or inspiration item with a dedicated page and optional listing features (featured, filters).

### Fields

| Field        | Type     | Required | Purpose |
|-------------|----------|----------|---------|
| **title**   | string   | Yes      | Display name (2–120 chars). Used for card title and `<title>` when slug is absent. |
| **slug**    | string   | No       | URL path segment (e.g. `figma`, `linear`). Lowercase, numbers, hyphens only. Empty = derive from title. |
| **url**     | url      | Yes      | Canonical destination link (opens in “Visit site” CTA). |
| **description** | text | Yes   | Short blurb (10–260 chars). Used for cards, meta description, JSON-LD. |
| **category**   | string | Yes   | One of a fixed list (design-tools, development-tools, ai-tools, …). Drives filter and SEO. |
| **tags**    | array of string | No | Open-ended labels for discovery and JSON-LD keywords. |
| **icon**    | image    | No       | Thumbnail/logo for cards and OG image. |
| **featured**| boolean  | No       | Highlight on homepage or “featured” section. Default false. |
| **createdAt** | datetime | No    | For “added” date and ordering. Default: now. |

### Slug Rules

- **Format**: `^[a-z0-9-]+$` (lowercase letters, numbers, hyphens).
- **Uniqueness**: Enforced by usage (one page per slug); duplicate slugs will collide in routing.
- **Reserved**: Avoid slugs that match app routes (e.g. `studio`, `api`); app should 404 for those.
- **Derivation**: If slug is empty, app derives from title (e.g. “Figma” → `figma`, “AI Tools” → `ai-tools`).

### Category List (controlled)

Keep a single source of truth in code (schema + front-end types). Example:

- design-tools  
- development-tools  
- ui-ux-resources  
- inspiration  
- ai-tools  
- productivity  
- learning-resources  
- miscellaneous  

Adding a category: add to schema options and to the front-end category list (e.g. `lib/categories.ts`, `types/resource.ts`).

### SEO and Automation

- **Per-resource page**: One URL per resource, e.g. `/{slug}`. Page has: `<title>{title} | Site Name`, meta description, canonical, Open Graph, Twitter card, JSON-LD (e.g. `SoftwareApplication`).
- **Automation payload**: API that creates resources (e.g. `POST /api/resources`) should accept at least: `url`, `title`, `description`, `category`. Optional: `slug`, `tags`, `featured`. Slug can be derived from title if not sent.

### Preview (Studio)

- **Title**: `title`  
- **Subtitle**: `category` (or human-readable label) and optionally `slug` so editors see the URL path.  
- **Media**: `icon`  

This keeps the list view scannable and confirms the slug that will be used on the site.

---

## Document Type: `collection`

A curated list of resources: a “playlist” or “category page” with its own URL and SEO (e.g. “Best AI tools”, “Design system resources”).

### Fields

| Field          | Type     | Required | Purpose |
|----------------|----------|----------|---------|
| **title**      | string   | Yes      | Display name (2–120 chars). |
| **slug**       | string   | No       | URL path (e.g. `best-ai-tools`). Empty = derive from title. |
| **description**| text     | Yes      | Short blurb (10–500 chars). Used for list and meta. |
| **resources**  | array of reference → resource | Yes | Ordered list of resources (min 1). Resolved to full resource objects on the front end. |
| **featured**   | boolean  | No       | Highlight on collections index. Default false. |
| **createdAt**  | datetime | No       | For ordering. Default: now. |

### Slug and URLs

- **Format**: Same as resource (`^[a-z0-9-]+$`). App reserves `studio`, `api`; collections live under `/collections/[slug]`.
- **Derivation**: If slug is empty, app derives from title (e.g. “Best AI tools” → `best-ai-tools`).

### SEO and listing

- **Collection page**: One URL per collection: `/collections/{slug}`. Page has its own `<title>`, meta description, canonical, Open Graph. No JSON-LD required unless you add CollectionPage schema later.
- **Collections index**: `/collections` lists all collections with links to each collection page.

### Preview (Studio)

- **Title**: `title`  
- **Subtitle**: `/{slug}` (or “slug from title”) and optional date.  
No media unless you add an image field later.

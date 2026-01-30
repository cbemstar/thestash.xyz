---
name: content-architecture
description: Design content models and Sanity schemas for resource directories, link stashes, and curated tool lists (e.g. nocodesupply, The Stash). Use when defining document types, fields, SEO, and automation for listing sites.
metadata:
  version: "1.0.0"
---

# Content Architecture for Resource Directories

Guidance for designing content models for **resource directory** and **link stash** tools: sites that list tools, inspiration, or links with categories, tags, and dedicated pages (e.g. nocodesupply.co, The Stash).

## When to Apply

- Defining or changing Sanity (or other CMS) document types for a listing site
- Adding fields for SEO, slugs, categories, or automation
- Designing content for programmatic SEO (one page per resource)
- Planning API or automation payloads (n8n, clawd.bot) that create listings

## Principles

1. **One document type per “thing”** – e.g. a single `resource` type for tools/links; avoid separate types per category unless you have strong editorial reasons.
2. **Stable, URL-friendly identifiers** – Every listable item needs a **slug** (or equivalent) for canonical URLs and SEO. Slug should be editable but optional (fallback: derive from title).
3. **Required vs optional** – Require only what the front end and SEO need: title, URL, short description, category. Optional: slug, tags, icon, featured, dates.
4. **Categories as a controlled list** – Use a fixed list of categories (dropdown/select) so filtering and SEO stay consistent; extend the list in code when you add new categories.
5. **Tags as open-ended** – Tags are good for discovery and SEO; keep them as an array of strings or a simple reference list.
6. **SEO and automation** – Schema should support: unique slug, description length suitable for meta (e.g. 10–260 chars), category and tags for JSON-LD and filters.

## Schema Change Workflow

- **Sanity schema is code-first**: Changes to document types and fields are made in the repo (e.g. `sanity/schema.ts`), not via the Sanity MCP or Studio UI. The MCP is for **documents** (create, patch, query), not for **schema** (adding types or fields).
- After editing `sanity/schema.ts`, redeploy or restart the dev server; Studio will reflect the new schema. Existing documents get the new fields with no value until you fill them (e.g. slug can be empty and the app can derive it from title).

## Reference

For a concrete content model tailored to a resource-directory / link-stash tool (The Stash, nocodesupply-style), see:

- `references/resource-directory-content-model.md` – document type, fields, validation, and how they map to SEO and automation.

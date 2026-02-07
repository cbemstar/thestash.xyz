# cursor-resources.json vs App Audit

**Date:** 2026-02-07  
**Source:** `automation/cursor-resources.json`

## Summary

- **Complete resources in JSON (have url, description, category):** 8  
- **Already in app:** 8 (100%)  
- **Missing from app:** 0  
- **Needs-enrichment in JSON (no url/description):** 29 — not addable until enriched

## Resources in JSON with Full Data

| Title | In app | Quality alignment |
|-------|--------|-------------------|
| ActivityWatch | ✅ | Already matched (body, sources, tags) |
| Hound | ✅ | Category updated: `github` → `development-tools` |
| Noema | ✅ | Already matched |
| Open Source Society University (OSSU) | ✅ | Category updated: `coding` → `learning-resources` |
| OpenMoji | ✅ | Already matched |
| Pencil Project | ✅ | Already matched |
| Refs.gallery | ✅ | Already matched |
| The Component Gallery | ✅ | Description updated to match JSON |

## Quality Standards Applied

- **Title:** 2–120 characters  
- **Description:** 10–260 characters  
- **Category:** One of design-tools, development-tools, ui-ux-resources, inspiration, ai-tools, productivity, learning-resources, miscellaneous (+ webflow, shadcn, coding, github, html, css, javascript, languages)  
- **Body/sources:** Present where applicable  

## Changes Made (Sanity)

1. **OSSU** — `category`: `coding` → `learning-resources` (better fit for curriculum/learning).  
2. **Hound** — `category`: `github` → `development-tools` (aligns with JSON; code search = dev tool).  
3. **The Component Gallery** — `description` set to JSON copy: *"A reference library of UI components from real design systems, built for interface builders."*

All three updates were published to production.

## Needs-enrichment (not added)

These entries in cursor-resources.json have `status: "needs-enrichment"` (no URL/description). Add them to the app only after enrichment and validation:

Design Methods Toolbox, Focu, Forgejo, Graphite, Icon Shelf, Jan, Khoj, Land-book, LearnHouse, Livegrep, Minimal Gallery, Open Design Kit, Open Interpreter, Open Source Design, Open WebUI, OpenComponents, OpenSource Toolkit, Openverse, OSSU Computer Science, Penpot, Planka, SiteSee, Super Productivity, The Missing Semester, The Pattern Library, Typescale Garden, UX Patterns for Developers, UX Project Checklist, Watchexec.

*(Note: Some of these names already exist in Sanity with content from other sources, e.g. Focu, Graphite, Land-book, LearnHouse, Livegrep, Khoj, Openverse, Super Productivity.)*

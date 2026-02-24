# Automation Architecture

## Sanity Schema Requirements

### Articles
- `slug`: **Plain string** (e.g., `"my-article-2026"`) - NOT `{_type: 'slug', current: '...'}`
- `title`: String
- `excerpt`: String
- `body`: Portable Text array
- `category`: String
- `publishedAt`: ISO date string
- `primaryKeyword`: String
- `intentStage`: "awareness" | "consideration" | "decision" | "implementation"

### Resources
- `slug`: **Plain string** (e.g., `"figma"`) - NOT object
- `title`: String
- `url`: String (full URL)
- `description`: String (max 260 chars)
- `category`: Category string (see below)
- `tags`: Array of strings
- `bestFor`: Array of strings
- `notFor`: Array of strings
- `alternatives`: Array of references

## Categories (16 total)
- `ai-tools`
- `design-tools`
- `development-tools`
- `productivity`
- `learning-resources`
- `ui-ux-resources`
- `inspiration`
- `webflow`
- `shadcn`
- `coding`
- `github`
- `html`
- `css`
- `javascript`
- `languages`
- `miscellaneous`

## Agent Pipeline

1. **Scout** → Finds leads from HN, Product Hunt, etc.
2. **Research** → Validates URLs, enriches with metadata, adds bestFor/notFor/alternatives
3. **Writer** → Generates 800+ word blog posts (slug as plain string)
4. **Editor** → Reviews quality (min 80% score)
5. **Publisher** → Pushes to Sanity (slug as plain string)
6. **Orchestrator** → Runs full daily/weekly pipeline

## Key Files
- `automation/agents/lead-queue.json` - Raw discovered leads
- `automation/agents/validated-leads.json` - Researched & enriched
- `automation/agents/approval-queue.json` - Pending human review
- `automation/agents/published-log.json` - Published items history

## Testing Mode
Default: `isTesting = true` - All content queues for approval before publishing

## Dashboard
- URL: `/agents-dashboard`
- Shows pipeline stats
- Individual approve/reject/edit
- Run individual agents or full pipeline

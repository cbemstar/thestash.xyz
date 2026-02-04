/**
 * SEO and AI-optimized extended content for resources.
 * Used when Sanity does not have body/sources. Keyed by resource slug.
 * Structure follows content-architecture + marketing-psychology: definition (what it is),
 * benefits (Jobs to Be Done / outcomes), use cases, credible sources.
 */

export type ResourceExtendedContent = {
  /** One-sentence definition for "What is X?" (AEO-friendly). */
  definition?: string;
  /** Key benefits/outcomes (Jobs to Be Done). */
  benefits?: string[];
  /** Typical use cases. */
  useCases?: string[];
  /** Longer overview paragraphs. */
  overview?: string[];
  /** Credible sources for citations. */
  sources: { label: string; url: string }[];
};

const contentBySlug: Record<string, ResourceExtendedContent> = {
  figma: {
    definition:
      "Figma is a collaborative interface design tool for product teams to design, prototype, and hand off UI and UX work in the browser or desktop.",
    benefits: [
      "Real-time collaboration so designers and developers stay in sync.",
      "Single source of truth for screens, components, and design systems.",
      "Dev Mode lets developers inspect specs and copy CSS or tokens without leaving the tool.",
      "Faster handoffs and fewer back-and-forth rounds than file-based workflows.",
    ],
    useCases: [
      "Designing and iterating on UI for web and mobile apps.",
      "Building and maintaining design systems and component libraries.",
      "Prototyping flows and sharing with stakeholders.",
      "Handing off designs to engineering with specs and assets.",
    ],
    overview: [
      "Figma supports vector editing, prototyping with transitions and overlays, and version history. Teams that use a single design tool see faster handoffs; Figma’s 2024 State of Design report highlights this. The tool is free for individuals and small teams, with paid plans for organizations.",
    ],
    sources: [
      { label: "Figma — Design, prototype, and collaborate", url: "https://www.figma.com" },
      { label: "Figma Dev Mode — Developer handoff", url: "https://www.figma.com/developers/dev-mode" },
      { label: "State of Design (Figma blog)", url: "https://www.figma.com/blog/state-of-design-2024/" },
    ],
  },
  linear: {
    definition:
      "Linear is an issue tracking and project management tool built for high-performing product and engineering teams, with a focus on speed and a minimal, keyboard-first interface.",
    benefits: [
      "Move from idea to shipped feature without clutter or context-switching.",
      "Cycles and roadmaps keep work visible and predictable.",
      "Integrations with GitHub, Slack, and Figma so status stays in one place.",
      "Fast performance and thoughtful UX reduce friction for daily use.",
    ],
    useCases: [
      "Managing bugs, features, and sprints for product and engineering teams.",
      "Running cycles and roadmaps with clear visibility.",
      "Linking code and design context to issues.",
      "Keeping stakeholders aligned with shared views and status.",
    ],
    overview: [
      "Linear emphasizes speed and minimal UI so teams spend less time in the tool and more time shipping. It’s a popular choice among startups and scale-ups for issue tracking and project management.",
    ],
    sources: [
      { label: "Linear — Issue tracking for modern teams", url: "https://linear.app" },
      { label: "Linear Method (how we build)", url: "https://linear.app/method" },
      { label: "Linear on Wikipedia", url: "https://en.wikipedia.org/wiki/Linear_(software)" },
    ],
  },
  raycast: {
    definition:
      "Raycast is a launcher and productivity hub for macOS that lets you open apps, run commands, search files, and use extensions—including dev tools, snippets, and AI—from a single keyboard shortcut.",
    benefits: [
      "Reduce context-switching by keeping workflows in one command palette.",
      "Custom extensions and AI-powered actions for hundreds of services.",
      "Integrations with GitHub, Notion, Linear, and more.",
      "Built for power users who prefer keyboard over mouse.",
    ],
    useCases: [
      "Launching apps and running system commands quickly.",
      "Searching files, clipboard history, and calendar.",
      "Running dev workflows (e.g. open repo, run script) via extensions.",
      "Using AI actions for writing, summarization, or coding help.",
    ],
    overview: [
      "Raycast is often compared to Spotlight or Alfred but is built for power users and teams. Many developers use it to keep workflows inside one palette instead of switching between windows.",
    ],
    sources: [
      { label: "Raycast — Supercharged productivity", url: "https://raycast.com" },
      { label: "Raycast Extensions", url: "https://www.raycast.com/store" },
      { label: "Raycast for developers", url: "https://developers.raycast.com" },
    ],
  },
  excalidraw: {
    definition:
      "Excalidraw is an open-source virtual whiteboard for sketching hand-drawn style diagrams, wireframes, and flowcharts in the browser, with real-time collaboration.",
    benefits: [
      "Sketch-like aesthetic keeps ideas loose and editable, not over-polished.",
      "Real-time collaboration so teams can brainstorm and document together.",
      "Export to PNG or SVG and embed in Notion, Confluence, or docs.",
      "MIT-licensed and free; no account required to start.",
    ],
    useCases: [
      "Brainstorming and quick diagrams in meetings.",
      "Technical architecture or flowcharts with a rough, readable style.",
      "Wireframes and product thinking before moving to high-fidelity design.",
      "Embedding diagrams in documentation or wikis.",
    ],
    overview: [
      "Excalidraw uses a deliberately rough aesthetic so ideas stay editable. The project is widely used for technical diagrams and product thinking without the overhead of heavy design tools.",
    ],
    sources: [
      { label: "Excalidraw — Virtual whiteboard", url: "https://excalidraw.com" },
      { label: "Excalidraw on GitHub", url: "https://github.com/excalidraw/excalidraw" },
      { label: "Excalidraw documentation", url: "https://excalidraw.com/docs" },
    ],
  },
  "7tv-emotes": {
    definition:
      "7TV is a third-party emote platform that lets streamers and communities use custom animated and static emotes in Twitch, YouTube, Kick, and Discord chat.",
    benefits: [
      "Thousands of community and official emotes, including animated and static.",
      "Browser extension and native integrations so emotes show in chat.",
      "Upload and manage your own emotes for your channel or server.",
      "Free to use; emotes work across supported platforms.",
    ],
    useCases: [
      "Adding custom emotes to Twitch or YouTube chat.",
      "Finding and using emotes in Discord servers.",
      "Creating or uploading emotes for your community.",
      "Browsing and discovering trending emotes.",
    ],
    overview: [
      "7TV started as a Twitch emote extension and has grown into a cross-platform emote service. The emotes page lets you browse, search, and use emotes; the 7TV app integrates with Twitch and other platforms so emotes appear in chat.",
    ],
    sources: [
      { label: "7TV — Emotes", url: "https://7tv.app/emotes" },
      { label: "7TV App", url: "https://7tv.app" },
      { label: "7TV Docs", url: "https://docs.7tv.app" },
    ],
  },
  vercel: {
    definition:
      "Vercel is a platform for developing, previewing, and deploying frontend and full-stack web applications, and the company behind Next.js. It provides serverless functions, an edge network, and Git-based deployments.",
    benefits: [
      "Ship from push to production in minutes with automatic previews per branch.",
      "Edge network in hundreds of locations for low latency.",
      "Support for Next.js, React, Vue, Svelte, and static sites with HTTPS and analytics.",
      "Free tier for side projects and demos; paid plans for teams and higher limits.",
    ],
    useCases: [
      "Hosting Next.js and React apps with zero config.",
      "Previewing every branch and PR before merge.",
      "Running serverless API routes and edge functions.",
      "Deploying static sites and SPAs with a global CDN.",
    ],
    overview: [
      "Vercel’s documentation states the edge network runs in hundreds of locations to reduce latency. The free tier is popular for side projects and demos; paid plans add team features and higher limits.",
    ],
    sources: [
      { label: "Vercel — Develop. Preview. Ship.", url: "https://vercel.com" },
      { label: "Vercel Documentation", url: "https://vercel.com/docs" },
      { label: "Next.js by Vercel", url: "https://nextjs.org" },
    ],
  },
};

/**
 * Returns extended content for a resource by slug, or null if none.
 * Use when Sanity resource has no body/sources so the page still has curation content.
 */
export function getResourceExtendedContent(slug: string): ResourceExtendedContent | null {
  const normalized = slug.trim().toLowerCase();
  return contentBySlug[normalized] ?? null;
}

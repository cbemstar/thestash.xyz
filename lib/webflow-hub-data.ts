export type WebflowResourceKind =
  | "cloneable"
  | "template"
  | "app"
  | "inspiration";

export interface WebflowHubResource {
  id: string;
  name: string;
  kind: WebflowResourceKind;
  sourceUrl: string;
  summary: string;
  tags: string[];
  codeReady: boolean;
}

export const WEBFLOW_HUB_UPDATED_AT = "2026-02-19";

const WEBFLOW_HUB_RESOURCES: WebflowHubResource[] = [
  {
    id: "flowfav-cloneable-modern-portfolio-template",
    name: "Modern Portfolio Template",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/webflow-cloneable-portfolio-template-for-web-designers-5ef97",
    summary:
      "One-page portfolio cloneable focused on service sections, project showcases, and lightweight motion.",
    tags: ["portfolio", "one-page", "agency", "interaction"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-css-blend-modes",
    name: "CSS Blend Modes",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/css-blend-modes-holographic-card-hover-effect-webflow-cloneable",
    summary:
      "Holographic hover styling patterns using CSS mix-blend-mode utility classes inside Webflow.",
    tags: ["css", "effects", "hover", "visual-design"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-sophisticated-cms-lightbox",
    name: "Sophisticated CMS Lightbox",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/sophisticated-next-back-cms-lightbox-webflow-cloneable-by-timothy-ricks",
    summary:
      "CMS-backed lightbox pattern with previous-next navigation and reusable gallery behavior.",
    tags: ["cms", "gallery", "lightbox", "navigation"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-background-gradient-hover-effect",
    name: "Background Gradient Hover Effect",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/background-gradient-hover-effect-webflow-cloneable",
    summary:
      "Interactive gradient background hover behavior for hero cards and callout sections.",
    tags: ["gradient", "hover", "visual-design"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-gsap-text-animation-effects",
    name: "GSAP Text Animation Effects",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/gsap-text-animation-effects-webflow-cloneable",
    summary:
      "Scroll-triggered text animation patterns powered by GSAP and ScrollTrigger.",
    tags: ["gsap", "javascript", "animation", "scroll"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-css-infinite-marquee",
    name: "CSS Infinite Marquee",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/infinite-css-marquee-webflow-cloneable-dynamic-scrolling",
    summary:
      "Infinite marquee pattern with forward and reverse motion for logos, testimonials, and badges.",
    tags: ["css", "marquee", "motion", "showcase"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-advanced-finsweet-cms-filter",
    name: "Advanced Finsweet CMS Filter",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/advanced-finsweet-cms-filter-webflow-cloneable",
    summary:
      "Advanced CMS filtering setup using Finsweet attributes for multi-condition directory pages.",
    tags: ["cms", "finsweet", "filters", "directory"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-mini-audio-player",
    name: "Mini Audio Player",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/mini-audio-player-webflow-cloneable",
    summary:
      "Compact audio player interaction pattern suitable for podcasts and media-heavy landing pages.",
    tags: ["audio", "media", "ui-pattern"],
    codeReady: true,
  },
  {
    id: "flowfav-cloneable-horizontal-scroll-video-section",
    name: "Horizontal Scroll Video Section",
    kind: "cloneable",
    sourceUrl: "https://www.flowfav.com/cloneable/horizontal-scroll-video-section",
    summary:
      "Horizontal video gallery behavior optimized for narrative product showcases.",
    tags: ["video", "scroll", "showcase"],
    codeReady: true,
  },
  {
    id: "flowfav-template-3d-card-carousel",
    name: "3D Card Carousel",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/3d-card-carousel-webflow-template",
    summary:
      "Webflow template with immersive 3D card transitions for product highlights and portfolios.",
    tags: ["template", "3d", "carousel", "showcase"],
    codeReady: true,
  },
  {
    id: "flowfav-template-magazine",
    name: "Magazine",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/magazine-webflow-template",
    summary:
      "Editorial-style publishing template for magazines, newsrooms, and long-form article hubs.",
    tags: ["template", "editorial", "content"],
    codeReady: false,
  },
  {
    id: "flowfav-template-sixthsense",
    name: "SixthSense",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/sixthsense-webflow-template",
    summary:
      "Agency-oriented template with strong visual storytelling and conversion-focused service layouts.",
    tags: ["template", "agency", "marketing"],
    codeReady: false,
  },
  {
    id: "flowfav-template-berlin-portfolio",
    name: "Berlin Portfolio",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/berlin-portfolio-webflow-template",
    summary:
      "Portfolio template with project-driven case study sections and minimalist typography.",
    tags: ["template", "portfolio", "creative"],
    codeReady: false,
  },
  {
    id: "flowfav-template-motionkraft",
    name: "Motionkraft",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/motionkraft-webflow-template",
    summary:
      "Motion-forward template for studios shipping animation-heavy marketing websites.",
    tags: ["template", "motion", "agency"],
    codeReady: true,
  },
  {
    id: "flowfav-template-lefkada-photography",
    name: "Lefkada Photography",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/lefkada-photography-webflow-template",
    summary:
      "Photography-first template with image-led storytelling and gallery navigation patterns.",
    tags: ["template", "photography", "gallery"],
    codeReady: false,
  },
  {
    id: "flowfav-template-minima-agency",
    name: "Minima Agency",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/minima-agency-webflow-template",
    summary:
      "Conversion-ready agency template balancing service breakdowns, team credibility, and calls to action.",
    tags: ["template", "agency", "conversion"],
    codeReady: false,
  },
  {
    id: "flowfav-template-nihon",
    name: "Nihon",
    kind: "template",
    sourceUrl: "https://www.flowfav.com/template/nihon-webflow-template",
    summary:
      "Clean multipurpose template for product websites and professional service pages.",
    tags: ["template", "business", "landing-page"],
    codeReady: false,
  },
  {
    id: "flowfav-app-flowmonk",
    name: "Flowmonk",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/flowmonk",
    summary:
      "A/B testing and personalization tooling for optimizing Webflow conversion performance.",
    tags: ["app", "experimentation", "analytics", "conversion"],
    codeReady: false,
  },
  {
    id: "flowfav-app-fullframe",
    name: "Fullframe",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/fullframe",
    summary:
      "Personalized website experiences with no-code visitor segmentation for Webflow sites.",
    tags: ["app", "personalization", "conversion"],
    codeReady: false,
  },
  {
    id: "flowfav-app-chartflow",
    name: "Chartflow",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/chartflow",
    summary:
      "Analytics and chart embeds that let teams communicate data inside Webflow pages.",
    tags: ["app", "analytics", "dashboard", "embed"],
    codeReady: false,
  },
  {
    id: "flowfav-app-tryformly",
    name: "Formly",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/tryformly",
    summary:
      "Modern form workflows for Webflow with customization and improved submission handling.",
    tags: ["app", "forms", "conversion"],
    codeReady: false,
  },
  {
    id: "flowfav-app-reformly",
    name: "Reformly",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/reformly",
    summary:
      "Visual form builder for creating interactive form experiences directly in Webflow projects.",
    tags: ["app", "forms", "ux"],
    codeReady: false,
  },
  {
    id: "flowfav-app-fontastic",
    name: "Fontastic",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/fontastic",
    summary:
      "Typography utility app to streamline custom font workflows and reusable text styling systems.",
    tags: ["app", "typography", "design-system"],
    codeReady: false,
  },
  {
    id: "flowfav-app-webflow-confetti",
    name: "Webflow Confetti",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/webflow-confetti",
    summary:
      "Lightweight celebratory interaction effect for signups, purchases, and completion moments.",
    tags: ["app", "interaction", "effects", "javascript"],
    codeReady: true,
  },
  {
    id: "flowfav-app-flowbridge",
    name: "Flowbridge",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/flowbridge",
    summary:
      "Integration utility to connect Webflow collections and external systems with less glue code.",
    tags: ["app", "integration", "automation", "cms"],
    codeReady: true,
  },
  {
    id: "flowfav-app-interacly",
    name: "Interacly",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/interacly",
    summary:
      "Interactive UI enhancements and micro-interaction helpers for richer Webflow experiences.",
    tags: ["app", "interaction", "ui"],
    codeReady: true,
  },
  {
    id: "flowfav-app-stickynav",
    name: "Stickynav",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/stickynav",
    summary:
      "Sticky navigation behavior toolkit for long landing pages, docs, and scrolling product sites.",
    tags: ["app", "navigation", "ux"],
    codeReady: true,
  },
  {
    id: "flowfav-app-flowletter",
    name: "Flowletter",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/flowletter",
    summary:
      "Newsletter and email capture workflows designed for Webflow growth and content teams.",
    tags: ["app", "email", "lead-gen"],
    codeReady: false,
  },
  {
    id: "flowfav-app-flowbanner",
    name: "Flowbanner",
    kind: "app",
    sourceUrl: "https://www.flowfav.com/app/flowbanner",
    summary:
      "Announcement bar management for promotions, launches, and contextual site messaging.",
    tags: ["app", "banner", "announcement", "conversion"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-dark-elegance",
    name: "Dark Elegance",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/dark-elegance-template",
    summary:
      "Elegant dark-mode interface references for luxury, portfolio, and premium brand websites.",
    tags: ["inspiration", "dark-mode", "brand"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-island-dunes",
    name: "Island Dunes",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/real-estate-development-website",
    summary:
      "High-end real-estate website inspiration with cinematic media layout and premium typography.",
    tags: ["inspiration", "real-estate", "storytelling"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-pocketbase",
    name: "Pocketbase",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/pocketbase",
    summary:
      "Developer-product marketing reference with docs-friendly structure and clear product hierarchy.",
    tags: ["inspiration", "developer-tools", "docs"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-solar-energy-website",
    name: "Solar Energy Website",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/solar-energy-website-template-1",
    summary:
      "Sustainability-focused web design references with trust cues, proof sections, and CTA rhythm.",
    tags: ["inspiration", "energy", "marketing-site"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-agentic-by-ai",
    name: "Agentic by AI",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/agentic-by-ai",
    summary:
      "AI-brand experience reference with high-contrast modern UI and narrative landing structure.",
    tags: ["inspiration", "ai", "brand-site"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-agency-cloneable",
    name: "Agency Cloneable",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/agency-cloneable",
    summary:
      "Agency landing inspiration highlighting service architecture and social proof sequencing.",
    tags: ["inspiration", "agency", "services"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-adorned-homes",
    name: "Adorned Homes",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/adorned-homes",
    summary:
      "Interior and architecture style references with gallery-first layouts and editorial spacing.",
    tags: ["inspiration", "interior", "gallery"],
    codeReady: false,
  },
  {
    id: "flowfav-inspiration-portfolio-template",
    name: "Portfolio Template",
    kind: "inspiration",
    sourceUrl: "https://www.flowfav.com/inspiration/portfolio-template",
    summary:
      "Creative portfolio inspiration emphasizing case study cards and layered motion presentation.",
    tags: ["inspiration", "portfolio", "creative"],
    codeReady: false,
  },
];

export function getAllWebflowHubResources(): WebflowHubResource[] {
  return [...WEBFLOW_HUB_RESOURCES];
}

export function getWebflowHubResourcesByKind(
  kind: WebflowResourceKind,
): WebflowHubResource[] {
  return WEBFLOW_HUB_RESOURCES.filter((resource) => resource.kind === kind);
}

export function getAllWebflowHubResourceIds(): string[] {
  return WEBFLOW_HUB_RESOURCES.map((resource) => resource.id);
}

export function getWebflowHubResourceById(
  id: string,
): WebflowHubResource | null {
  return WEBFLOW_HUB_RESOURCES.find((resource) => resource.id === id) ?? null;
}

export function getWebflowHubStats() {
  const all = WEBFLOW_HUB_RESOURCES;
  const byKind = {
    cloneable: all.filter((item) => item.kind === "cloneable").length,
    template: all.filter((item) => item.kind === "template").length,
    app: all.filter((item) => item.kind === "app").length,
    inspiration: all.filter((item) => item.kind === "inspiration").length,
  };
  const codeReady = all.filter((item) => item.codeReady).length;
  return {
    total: all.length,
    byKind,
    codeReady,
  };
}

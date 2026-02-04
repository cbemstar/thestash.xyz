#!/usr/bin/env node
/**
 * Install all Kibo UI components, blocks, and patterns.
 * Run: node scripts/install-all-kibo-ui.mjs
 *
 * Note: Temporarily switches components.json style to "new-york" because
 * the "vega" style registry lacks some shadcn primitives (e.g. card).
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const COMPONENTS_JSON = path.join(ROOT, "components.json");

const KIBO_COMPONENTS = [
  "announcement",
  "avatar-stack",
  "banner",
  "calendar",
  "choicebox",
  "code-block",
  "color-picker",
  "combobox",
  "comparison",
  "contribution-graph",
  "credit-card",
  "cursor",
  "deck",
  "dialog-stack",
  "dropzone",
  "editor",
  "gantt",
  "glimpse",
  "image-crop",
  "image-zoom",
  "kanban",
  "list",
  "marquee",
  "mini-calendar",
  "pill",
  "qr-code",
  "rating",
  "reel",
  "relative-time",
  "sandbox",
  "snippet",
  "spinner",
  "status",
  "stories",
  "table",
  "tags",
  "theme-switcher",
  "ticker",
  "tree",
  "typography",
  "video-player",
];

// Blocks may return 500 from registry - install manually if needed
const KIBO_BLOCKS = [
  "collaborative-canvas",
  "codebase",
  "roadmap",
  "form",
  "hero",
  "pricing",
];

// Editor often fails due to heavy deps; install manually: npx shadcn add @kibo-ui/editor
const ALL_ITEMS = [...KIBO_COMPONENTS, ...KIBO_BLOCKS];

function readComponentsJson() {
  return JSON.parse(fs.readFileSync(COMPONENTS_JSON, "utf8"));
}

function writeComponentsJson(obj) {
  fs.writeFileSync(COMPONENTS_JSON, JSON.stringify(obj, null, 2));
}

function installOne(name) {
  const result = spawnSync(
    "npx",
    ["shadcn@latest", "add", `@kibo-ui/${name}`, "--yes"],
    {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
    }
  );
  return { name, ok: result.status === 0, stderr: result.stderr };
}

function main() {
  console.log("Installing all Kibo UI components and blocks...\n");

  const config = readComponentsJson();
  const originalStyle = config.style;

  if (config.style === "vega") {
    console.log("Temporarily switching style to new-york (vega lacks some primitives)...");
    config.style = "new-york";
    writeComponentsJson(config);
  }

  const installed = [];
  const failed = [];

  for (const name of ALL_ITEMS) {
    process.stdout.write(`  ${name}... `);
    const { ok } = installOne(name);
    if (ok) {
      console.log("✓");
      installed.push(name);
    } else {
      console.log("✗");
      failed.push(name);
    }
  }

  if (originalStyle === "vega") {
    console.log("\nRestoring style to vega...");
    config.style = originalStyle;
    writeComponentsJson(config);
  }

  console.log("\n--- Summary ---");
  console.log(`Installed: ${installed.length}`);
  if (failed.length) {
    console.log(`Failed: ${failed.length} - ${failed.join(", ")}`);
  }
}

main();

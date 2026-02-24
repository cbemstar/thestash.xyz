#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const dryRun = process.argv.includes("--dry-run");
const withMedia = process.argv.includes("--with-media");
const mediaArgs = withMedia ? ["--with-media"] : [];

const steps = dryRun
  ? [
      {
        label: "Dry run: decision-guide refresh preview",
        script: "scripts/refresh-latest-articles-2026.mjs",
        args: ["--dry-run", ...mediaArgs],
      },
      {
        label: "Dry run: content chunking optimization preview",
        script: ".agents/skills/content-chunking-optimizer/scripts/optimize-sanity-article-chunks.mjs",
        args: ["--dry-run"],
      },
    ]
  : [
      {
        label: "Revise latest decision-guide style articles",
        script: "scripts/refresh-latest-articles-2026.mjs",
        args: [...mediaArgs],
      },
      {
        label: "Refresh 2026 benchmark blocks across published blogs",
        script: "scripts/refresh-articles-2026.mjs",
        args: [...mediaArgs],
      },
      {
        label: "Rewrite legacy references and source links",
        script: "scripts/rewrite-legacy-article-references-2026.mjs",
        args: [],
      },
      {
        label: "Optimize chunking for AI Overviews and snippets",
        script: ".agents/skills/content-chunking-optimizer/scripts/optimize-sanity-article-chunks.mjs",
        args: ["--apply"],
      },
    ];

function runStep(step, index, total) {
  console.log(`\n[${index + 1}/${total}] ${step.label}`);
  const result = spawnSync(process.execPath, [resolve(step.script), ...step.args], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    const code = result.status ?? 1;
    console.error(`\nFailed: ${step.script} (exit ${code})`);
    process.exit(code);
  }
}

for (let i = 0; i < steps.length; i += 1) {
  runStep(steps[i], i, steps.length);
}

if (dryRun) {
  console.log(
    `\nDry run complete. No Sanity content was changed${withMedia ? " (with media simulation)" : ""}.`
  );
} else {
  console.log(
    `\nDone. All blog revision steps were applied to Sanity${withMedia ? " (with media enhancements)" : ""}.`
  );
}

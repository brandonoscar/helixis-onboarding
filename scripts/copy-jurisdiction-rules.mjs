/**
 * Copies the landlord-rules data the /state-laws pages are built from.
 *
 *   node scripts/copy-jurisdiction-rules.mjs ../AgenticHelixis
 *
 * ⚠ THE BUILD NEVER READS THE OTHER REPO. Vercel builds this repo alone, so
 * the pages are generated from the committed copy in src/data/. Run this by
 * hand when AgenticHelixis changes its jurisdiction data, review the diff,
 * and commit both files. The .source.json file records exactly which file,
 * version and commit the copy came from, and every state page prints the
 * version.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_PATH = "src/helixis/geo/data/jurisdiction_rules.json";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = process.argv[2];
if (!repo) {
  console.error("usage: node scripts/copy-jurisdiction-rules.mjs <path to AgenticHelixis>");
  process.exit(2);
}

const src = join(repo, SOURCE_PATH);
const data = JSON.parse(readFileSync(src, "utf8"));
const states = Object.keys(data.states ?? {});
if (typeof data.version !== "string" || states.length !== 51) {
  console.error(`refusing: expected a version and 51 states, got ${data.version} and ${states.length}`);
  process.exit(1);
}

const commit = execFileSync("git", ["log", "-1", "--format=%H", "--", SOURCE_PATH], {
  cwd: repo,
  encoding: "utf8",
}).trim();

copyFileSync(src, join(root, "src/data/jurisdiction_rules.json"));
writeFileSync(
  join(root, "src/data/jurisdiction_rules.source.json"),
  JSON.stringify(
    {
      repository: "brandonoscar/AgenticHelixis",
      path: SOURCE_PATH,
      version: data.version,
      commit,
    },
    null,
    2,
  ) + "\n",
);
console.log(`copied ${SOURCE_PATH} version ${data.version} (${states.length} states) at ${commit.slice(0, 7)}`);

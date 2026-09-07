/**
 * Every asset the hero slideshow names must actually be in `public/`.
 *
 * ⚠ Vite does NOT resolve `/public` references. A slide pointing at a file
 * that is not there builds clean, deploys clean, and renders a broken image
 * on the front door of the product — the failure only shows up to a visitor.
 * That is the "silently permits more" shape: the loud failure (a missing file
 * that breaks the build) is the one you would have noticed anyway.
 *
 * So this reads the SLIDES table as the source of truth and checks the disk.
 * It runs before `vite build`, which means a missing screenshot stops the
 * deploy instead of shipping.
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "src/FeatureSlideshow.tsx"), "utf8");

// Only the absolute site paths — a bare identifier or an imported URL is not
// a public-folder reference and must not be reported as a missing file.
const refs = [...source.matchAll(/\bsrc:\s*"(\/[^"]+)"/g)].map((m) => m[1]);

if (refs.length === 0) {
  console.error(
    "check-assets: found no slide sources in src/FeatureSlideshow.tsx.\n" +
      "The scan matched nothing, which means it is broken — not that the " +
      "slideshow is empty. A check that examined zero things is not a check " +
      "that passed.",
  );
  process.exit(1);
}

const missing = refs.filter((p) => {
  const onDisk = join(root, "public", p);
  return !existsSync(onDisk) || statSync(onDisk).size === 0;
});

if (missing.length) {
  console.error(
    `\ncheck-assets: ${missing.length} of ${refs.length} slide assets are missing from public/\n`,
  );
  for (const p of missing) console.error(`  public${p}`);
  console.error(
    "\nThe capability screenshots are produced by the AgenticHelixis repo:\n" +
      "  python scripts/feature_shots.py --url https://occupella.com\n" +
      "then copy shots\\0*.png into this repo's public/demo/ folder.\n",
  );
  process.exit(1);
}

console.log(`check-assets: ${refs.length}/${refs.length} slide assets present.`);

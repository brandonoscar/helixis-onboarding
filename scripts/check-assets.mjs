/**
 * Every `/demo/…` and `/shots/…` file the site names must actually be in
 * `public/`.
 *
 * ⚠ Vite does NOT resolve `/public` references. A page pointing at a file that
 * is not there builds clean, deploys clean, and renders a broken image or a
 * dead video on the front door of the product — visible only to a visitor.
 * That is the "silently permits more" shape: the loud failure, a missing file
 * that breaks the build, is the one you would have noticed anyway.
 *
 * ⚠ It scans the WHOLE of `src/`, not one component. The first version read
 * `FeatureSlideshow.tsx` by name and went blind the moment that file was
 * deleted — a guard pointed at one call site is a guard that expires. What has
 * to be measured is what the pages actually reference today.
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sources(p);
    return [".ts", ".tsx", ".html"].includes(extname(e.name)) ? [p] : [];
  });
}

const files = [...sources(join(root, "src")), join(root, "index.html")];

// Absolute site paths only. A bare identifier, a bundled import, or an
// external URL is not a public-folder reference and must not be reported.
const refs = new Map();
for (const f of files) {
  for (const m of readFileSync(f, "utf8").matchAll(/["'](\/(?:demo|shots)\/[^"']+)["']/g)) {
    if (!refs.has(m[1])) refs.set(m[1], f);
  }
}

if (refs.size === 0) {
  console.error(
    "check-assets: found no /demo or /shots references anywhere in src/.\n" +
      "The scan matched nothing, which means it is broken — not that the site " +
      "uses no assets. A check that examined zero things is not a check that " +
      "passed.",
  );
  process.exit(1);
}

const missing = [...refs].filter(([p]) => {
  const onDisk = join(root, "public", p);
  return !existsSync(onDisk) || statSync(onDisk).size === 0;
});

if (missing.length) {
  console.error(`\ncheck-assets: ${missing.length} of ${refs.size} referenced assets are missing\n`);
  for (const [p, from] of missing) {
    console.error(`  public${p}   <- named by ${from.slice(root.length + 1)}`);
  }
  console.error(
    "\nThe capability screenshots come from the AgenticHelixis repo:\n" +
      "  python scripts/feature_shots.py --url https://occupella.com\n" +
      "then copy shots\\0*.png into this repo's public/demo/ folder.\n",
  );
  process.exit(1);
}

console.log(`check-assets: ${refs.size}/${refs.size} referenced assets present.`);

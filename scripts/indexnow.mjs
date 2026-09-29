/**
 * Tell IndexNow (Bing, and the engines that read Bing's index) that every
 * page in the live sitemap may have changed. Run by
 * .github/workflows/indexnow.yml after each production deploy.
 *
 * ⚠ It reads the LIVE sitemap and checks the LIVE key file, not dist/. A
 * submission for a key the host doesn't serve is rejected (403), and a URL
 * list built from a local build could name a page production doesn't have.
 *
 * The key is public by design: IndexNow proves you own the host by fetching
 * /<key>.txt from it. It is not a secret and is safe to commit.
 *
 *   node scripts/indexnow.mjs            submit
 *   node scripts/indexnow.mjs --dry-run  print what would be submitted
 *
 * INDEXNOW_READ_FROM=http://localhost:4177 reads the key file and sitemap
 * from a local server instead, and is refused without --dry-run.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "occupella.com";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const keys = readdirSync(publicDir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keys.length !== 1) {
  console.error(`indexnow: expected one key file in public/, found ${keys.length}`);
  process.exit(1);
}
const key = keys[0].slice(0, -".txt".length);
const keyLocation = `${ORIGIN}/${key}.txt`;

const dryRun = process.argv.includes("--dry-run");
const readFrom = process.env.INDEXNOW_READ_FROM ?? ORIGIN;
if (readFrom !== ORIGIN && !dryRun) {
  console.error("indexnow: INDEXNOW_READ_FROM is for --dry-run only");
  process.exit(1);
}

const served = await fetch(`${readFrom}/${key}.txt`);
const servedKey = served.ok ? (await served.text()).trim() : "";
if (servedKey !== key) {
  console.error(`indexnow: ${keyLocation} answered ${served.status} without the key; is this deploy live?`);
  process.exit(1);
}

const sitemap = await fetch(`${readFrom}/sitemap.xml`);
if (!sitemap.ok) {
  console.error(`indexnow: sitemap answered ${sitemap.status}`);
  process.exit(1);
}
const urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) {
  // Zero is a claim to check, not a result: a sitemap with no <loc> is broken.
  console.error("indexnow: the live sitemap lists no URLs");
  process.exit(1);
}
if (urlList.some((u) => !u.startsWith(`${ORIGIN}/`))) {
  console.error("indexnow: the sitemap names a URL on another host; IndexNow would reject the batch");
  process.exit(1);
}

if (dryRun) {
  console.log(`indexnow: would submit ${urlList.length} URLs with key ${key}`);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
});
// 200 = accepted, 202 = accepted and the key is still being checked.
console.log(`indexnow: submitted ${urlList.length} URLs, answered ${res.status} ${await res.text()}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);

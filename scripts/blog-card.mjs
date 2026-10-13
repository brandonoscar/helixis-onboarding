/**
 * Draws a blog post's share card: the image LinkedIn and other sites show
 * when somebody pastes the post's link.
 *
 *   node scripts/blog-card.mjs <slug>     public/blog/<slug>.png, from content/blog/<slug>.md
 *   node scripts/blog-card.mjs --default  public/blog/card.png, for /blog and any post without one
 *
 * Then add `image: /blog/<slug>.png` to the post's frontmatter (the script
 * prints the line). docs/blog.md has the whole procedure.
 *
 * ⚠ THE CARD IS THE ARTICLE, NOT AN AD: its title, the byline and the date,
 * in the site's type, on a plain background. No product screenshot, no
 * button, no offer. The site's default share image (social-preview.png) is a
 * product screenshot, which is right for the product pages and wrong for a post.
 *
 * Needs Playwright with Chromium. Claude Code cloud sessions have it at
 * /opt/node-tools; elsewhere run `npm i --no-save playwright` and
 * `npx playwright install chromium` first. It is not a dependency of the
 * site, so the Vercel build never installs it: cards are drawn once and
 * committed.
 */

import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Laid out at 1200x630, LinkedIn's shape, and written at twice that,
// 2400x1260. At 1x the small type went soft once LinkedIn shrank and
// recompressed it (2026-10-13). src/blog/posts.ts CARD_SIZE must match;
// blog.test.tsx reads each card's real size.
const W = 1200;
const H = 630;
const SCALE = 2;

const arg = process.argv[2];
if (!arg) {
  console.error("usage: node scripts/blog-card.mjs <slug> | --default");
  process.exit(2);
}

/** The two frontmatter fields the card prints. src/blog/posts.ts is the full parser. */
function frontmatter(slug) {
  const raw = readFileSync(join(root, "content/blog", `${slug}.md`), "utf8").replace(/\r\n?/g, "\n");
  const block = /^---\n([\s\S]*?)\n---/.exec(raw)?.[1] ?? "";
  const field = (key) => {
    const v = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(block)?.[1]?.trim();
    if (!v) throw new Error(`content/blog/${slug}.md has no ${key}`);
    if (v.startsWith('"')) return JSON.parse(v);
    if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
    return v;
  };
  return { title: field("title"), date: field("datePublished") };
}

const formatDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const font = (pkg, file) =>
  `url(data:font/woff2;base64,${readFileSync(join(root, "node_modules", pkg, "files", file)).toString("base64")}) format("woff2")`;

function cardHtml({ title, foot }) {
  // Long titles step down so they stay on three lines at most.
  const size = title.length > 90 ? 58 : title.length > 60 ? 68 : 76;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: "Fraunces"; src: ${font("@fontsource-variable/fraunces", "fraunces-latin-opsz-normal.woff2")}; font-weight: 100 900; }
    @font-face { font-family: "Plex"; src: ${font("@fontsource-variable/ibm-plex-sans", "ibm-plex-sans-latin-wght-normal.woff2")}; font-weight: 100 700; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${W}px; height: ${H}px; background: #F6F8FB; }
    .card {
      width: ${W}px; height: ${H}px; padding: 72px 88px 64px;
      display: flex; flex-direction: column; justify-content: space-between;
      border-top: 10px solid #1957A0; font-family: "Plex", sans-serif;
    }
    .who { font-size: 34px; font-weight: 600; color: #55606E; letter-spacing: -0.005em; }
    h1 {
      font-family: "Fraunces", serif; font-optical-sizing: auto; font-weight: 560;
      font-size: ${size}px; line-height: 1.08; letter-spacing: -0.02em; color: #0E1620;
      max-width: 1000px; text-wrap: balance;
    }
    .foot { display: flex; justify-content: space-between; font-size: 30px; color: #55606E; }
  </style></head><body><div class="card">
    <div class="who">Occupella Engineering</div>
    <h1>${esc(title)}</h1>
    <div class="foot"><span>occupella.com/blog</span><span>${esc(foot)}</span></div>
  </div></body></html>`;
}

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const spec of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
    try {
      return require(spec);
    } catch {
      /* try the next place */
    }
  }
  console.error("blog-card: Playwright isn't installed. Run `npm i --no-save playwright` and `npx playwright install chromium`, or run this in a Claude Code session.");
  process.exit(1);
}

const card =
  arg === "--default"
    ? { file: "card.png", title: "Notes on property-management APIs", foot: "" }
    : (() => {
        const { title, date } = frontmatter(arg);
        return { file: `${arg}.png`, title, foot: formatDate(date) };
      })();

const { chromium } = loadPlaywright();
const browser = await chromium
  .launch()
  .catch(() => chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" }));
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
await page.setContent(cardHtml(card));
await page.evaluate(() => document.fonts.ready);
const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
if (!fonts.includes("Fraunces") || !fonts.includes("Plex")) {
  console.error(`blog-card: the site's fonts did not load (${fonts.join(", ") || "none"}); not writing a card in a fallback font.`);
  process.exit(1);
}
const out = join(root, "public/blog", card.file);
mkdirSync(dirname(out), { recursive: true });
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log(`blog-card: wrote public/blog/${card.file} (${W * SCALE}x${H * SCALE})`);
if (arg !== "--default") console.log(`Add to content/blog/${arg}.md frontmatter:  image: /blog/${card.file}`);

/**
 * Writes static HTML for every marketing page, after `vite build` and
 * `vite build --ssr src/entry-server.tsx`.
 *
 *   dist/index.html, dist/features.html, ...  each page, with its own head
 *                                             tags and its real copy in #root
 *   dist/404.html                             served by Vercel with a 404
 *   dist/app-shell.html                       the empty shell /start and
 *                                             /oauth are rewritten to
 *   dist/sitemap.xml                          from src/seo/routes.ts
 *
 * Then it runs vercel.json against what it wrote (src/seo/vercelRouting.ts)
 * and checks /start, /oauth/callback and every page get the right file.
 *
 * ⚠ IT CHECKS ITS OWN OUTPUT AND FAILS THE BUILD, and in this repo a failed
 * build freezes the live site on the previous deploy (gotcha 131). That is the
 * safer direction here: without the check, a page that rendered empty would
 * ship to Google as a blank page with a valid title.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrDir = join(root, "dist-ssr");

const ssr = await import(pathToFileURL(join(ssrDir, "entry-server.js")).href);

const problems = [];
const template = readFileSync(join(dist, "index.html"), "utf8");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const region = new RegExp(`${escapeRe(ssr.HEAD_START)}[\\s\\S]*?${escapeRe(ssr.HEAD_END)}`);
const ROOT_EMPTY = '<div id="root"></div>';
if (!region.test(template)) problems.push("index.html has no page-head markers");
if (!template.includes(ROOT_EMPTY)) problems.push(`index.html has no ${ROOT_EMPTY}`);

function page(head, body) {
  return template.replace(region, head).replace(ROOT_EMPTY, `<div id="root">${body}</div>`);
}

function write(file, html) {
  const out = join(dist, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return html;
}

/** Visible words, roughly: what a crawler that runs no JavaScript reads. */
function bodyText(html) {
  const body = html.slice(html.indexOf('<div id="root">'));
  return body
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const canonicals = (html) => [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);

for (const route of ssr.MARKETING_ROUTES) {
  const file = ssr.pageFile(route.path);
  const html = write(file, page(ssr.headTags(route), ssr.render(route.path)));
  const expected = route.path === "/" ? "https://occupella.com/" : `https://occupella.com${route.path}`;
  if (JSON.stringify(canonicals(html)) !== JSON.stringify([expected])) {
    problems.push(`${file}: canonical is ${JSON.stringify(canonicals(html))}, expected ${expected}`);
  }
  if (!html.includes(ssr.headTags(route))) problems.push(`${file}: its head tags are missing`);
  const words = bodyText(html).split(" ").length;
  if (words < 80) problems.push(`${file}: only ${words} words of page copy in the HTML`);
}

const notFound = write("404.html", page(ssr.notFoundHead(), ssr.render(ssr.NOT_FOUND_PATH)));
if (!notFound.includes('content="noindex"')) problems.push("404.html is not noindex");
if (canonicals(notFound).length) problems.push("404.html has a canonical");

const shell = write("app-shell.html", template.replace(region, ssr.appShellHead()));
if (!shell.includes(ROOT_EMPTY)) problems.push("app-shell.html is not an empty shell");
if (canonicals(shell).length) problems.push("app-shell.html has a canonical");

function lastCommitDate(source) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", source], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : undefined;
  } catch {
    return undefined; // no git history in this build: leave lastmod out
  }
}
writeFileSync(join(dist, "sitemap.xml"), ssr.sitemapXml((r) => lastCommitDate(r.source)));

// What Vercel will actually serve, from vercel.json and the files just
// written: /start and /oauth/callback must reach the shell, every marketing
// page its own file. On 2026-09-29 the rewrite pointed at a name cleanUrls
// never serves and signup returned the 404 page; see src/seo/vercelRouting.ts.
const builtFiles = new Set(
  readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => relative(dist, join(d.parentPath, d.name)).split(sep).join("/")),
);
const vercelConfig = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
problems.push(
  ...ssr.routingProblems(
    vercelConfig,
    builtFiles,
    ssr.MARKETING_ROUTES.map((r) => r.path),
    ssr.CLIENT_ONLY_PREFIXES,
  ),
);

rmSync(ssrDir, { recursive: true, force: true });

if (problems.length) {
  console.error("prerender: FAILED\n  " + problems.join("\n  "));
  process.exit(1);
}
const written = ssr.MARKETING_ROUTES.length;
console.log(`prerender: ${written} pages, 404.html, app-shell.html and sitemap.xml written to dist/`);
if (!existsSync(join(dist, "robots.txt"))) console.warn("prerender: dist/robots.txt is missing");

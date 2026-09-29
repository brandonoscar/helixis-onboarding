/**
 * Which built file Vercel serves for a URL, given vercel.json and the files
 * in dist/. The build (scripts/prerender.mjs) runs it against the real dist/
 * and fails if /start, /oauth/callback or any marketing page would not be
 * served the file it needs.
 *
 * ⚠ WHY THIS EXISTS: on 2026-09-29 /start, the signup page, returned the 404
 * page in production for about five minutes. vercel.json rewrote it to
 * "/app-shell.html"; with cleanUrls on, Vercel serves dist/app-shell.html
 * only at /app-shell, so the rewrite matched no file. Every test passed,
 * because the tests read vercel.json and the file list separately and nothing
 * joined the two. This joins them.
 *
 * It models only what this site uses, and throws on a rule it does not
 * understand rather than guessing. The behaviour it encodes:
 *   1. the filesystem answers first (documented, and measured: robots.txt is
 *      served as itself);
 *   2. with cleanUrls, "/x" is served from x.html, and "/x.html" redirects
 *      to "/x";
 *   3. then the first matching rewrite, whose destination is looked up the
 *      same way, and a destination ending in .html matches nothing (measured
 *      2026-09-29, above);
 *   4. otherwise 404.html, with a 404 status.
 */

export interface VercelConfig {
  cleanUrls?: boolean;
  rewrites?: { source: string; destination: string }[];
}

export type Served =
  | { status: 200; file: string }
  | { status: 308; location: string }
  | { status: 404; file: string | undefined };

/** "/start/:path*" → /^\/start(?:\/.*)?$/. Only literals, `:name`, `:name*`. */
export function sourcePattern(source: string): RegExp {
  if (!source.startsWith("/")) throw new Error(`rewrite source ${source} does not start with /`);
  let re = "";
  for (const seg of source.slice(1).split("/")) {
    if (/^:\w+\*$/.test(seg)) re += "(?:/.*)?";
    else if (/^:\w+$/.test(seg)) re += "/[^/]+";
    else if (/^[\w.-]*$/.test(seg)) re += "/" + seg.replace(/\./g, "\\.");
    else throw new Error(`rewrite source ${source}: segment "${seg}" is not modelled here`);
  }
  return new RegExp(`^${re || "/"}$`);
}

/** The file a path names, without rewrites. */
function fileFor(path: string, files: ReadonlySet<string>, cleanUrls: boolean): string | undefined {
  const p = path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (p === "") return files.has("index.html") ? "index.html" : undefined;
  if (files.has(p) && !(cleanUrls && p.endsWith(".html"))) return p;
  if (cleanUrls && files.has(`${p}.html`)) return `${p}.html`;
  if (files.has(`${p}/index.html`)) return `${p}/index.html`;
  return undefined;
}

export function resolve(path: string, config: VercelConfig, files: ReadonlySet<string>): Served {
  const cleanUrls = config.cleanUrls === true;
  if (cleanUrls && path.endsWith(".html")) {
    const clean = path.slice(0, -".html".length);
    return { status: 308, location: clean.endsWith("/index") ? clean.slice(0, -"index".length) : clean };
  }
  const direct = fileFor(path, files, cleanUrls);
  if (direct) return { status: 200, file: direct };
  for (const r of config.rewrites ?? []) {
    if (!sourcePattern(r.source).test(path)) continue;
    const target = fileFor(r.destination, files, cleanUrls);
    if (target) return { status: 200, file: target };
    break;
  }
  return { status: 404, file: files.has("404.html") ? "404.html" : undefined };
}

/** The file the build writes for a marketing path. */
export function pageFile(path: string): string {
  return path === "/" ? "index.html" : `${path.slice(1)}.html`;
}

/**
 * Every way the served site could be wrong for the paths that matter, as
 * sentences. Empty means right. The build fails on any.
 */
export function routingProblems(
  config: VercelConfig,
  files: ReadonlySet<string>,
  marketingPaths: readonly string[],
  clientOnlyPrefixes: readonly string[],
): string[] {
  const problems: string[] = [];
  const expect = (path: string, status: number, file: string) => {
    const got = resolve(path, config, files);
    const gotFile = "file" in got ? got.file : got.location;
    if (got.status !== status || gotFile !== file) {
      problems.push(`${path} is served ${got.status} ${gotFile ?? "(nothing)"}, expected ${status} ${file}`);
    }
  };
  for (const prefix of clientOnlyPrefixes) {
    // The wizard opens at bare /start; the OAuth popup returns to
    // /oauth/callback. Any sub-path of either must reach the shell.
    if (prefix === "/start") expect(prefix, 200, "app-shell.html");
    expect(`${prefix}/callback`, 200, "app-shell.html");
  }
  for (const path of marketingPaths) expect(path, 200, pageFile(path));
  expect("/this-page-does-not-exist", 404, "404.html");
  for (const file of ["robots.txt", "sitemap.xml"]) expect(`/${file}`, 200, file);
  return problems;
}

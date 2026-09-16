/**
 * What a search engine can read on the host that is becoming occupella.com.
 *
 * This repo serves the marketing site and the setup wizard. On 2026-09-15 it
 * takes the apex: the landing, pricing, features and legal pages move from
 * setup.occupella.com to occupella.com, and the web app moves the other way to
 * app.occupella.com. That makes this deployment the brand's front door and the
 * document Google indexes under the name, so its crawlable surface stops being
 * a secondary concern.
 *
 * ⚠ THE LOAD-BEARING TEST IN THIS FILE IS THE CORPUS ONE, and it exists
 * because this repo had the defect AgenticHelixis had already fixed. Its
 * vercel.json was a bare `"/(.*)" → /index.html` with NO exclusions at all, so
 * `robots.txt`, `sitemap.xml`, `favicon.svg` and `social-preview.png` were
 * every one of them a candidate to answer 200 with the app shell and the HTML
 * content-type. No error on any surface; the only symptom is a search result
 * that looks wrong. That is gotcha 124 in the authority repo's CLAUDE.md,
 * arriving here as gotcha 25's fan-out — a rule fixed on one surface never
 * reaching the other, and reaching the wrong one first, because the repo that
 * had the fix was the app and the repo that needed it was the marketing site.
 *
 * The exclusion list is hand-written and a hand-written list is exactly how
 * the favicon got missed the first time, so it is checked against what
 * `public/` ACTUALLY holds rather than against itself. A control whose failure
 * mode is "silently permits more" has to read the corpus.
 *
 * ⚠ NOT VERIFIED AGAINST VERCEL OR GOOGLE. occupella.com is egress-blocked
 * from the container this was written in. Vercel is documented to check the
 * filesystem before applying rewrites, under which the exclusions are
 * belt-and-braces rather than the fix — but the app repo carries the same list
 * and both readings cannot be true, so the config is written to be correct
 * under either. One fetch of https://occupella.com/robots.txt from anywhere
 * with egress settles it: HTML back means the rewrite was shadowing it.
 */

import { describe, expect, it } from 'vitest';

import html from '../index.html?raw';
import vercelRaw from '../vercel.json?raw';
import robots from '../public/robots.txt?raw';
import sitemap from '../public/sitemap.xml?raw';
import mainTsx from './main.tsx?raw';

/** Every file sitting at the root of public/, by name. Keys only — the
 *  importers are never invoked, so the binaries are never read. */
const PUBLIC_FILES = Object.keys(import.meta.glob('../public/*')).map(
  (p) => p.split('/').pop() as string,
);

/** The catch-all that turns any unmatched path into the app shell. */
function spaRewrite(): RegExp {
  const config = JSON.parse(vercelRaw) as {
    rewrites: { source: string; destination: string }[];
  };
  const spa = config.rewrites.find((r) => r.destination === '/index.html');
  expect(spa, 'vercel.json no longer has an /index.html catch-all').toBeTruthy();
  return new RegExp(`^${spa!.source}$`);
}

describe('static files a crawler asks for reach the filesystem', () => {
  it('found some files to judge', () => {
    // A glob that silently resolves to nothing makes every assertion below
    // vacuously true, and the whole file reports green while testing the
    // empty set.
    expect(PUBLIC_FILES.length).toBeGreaterThan(2);
    expect(PUBLIC_FILES).toContain('robots.txt');
    expect(PUBLIC_FILES).toContain('sitemap.xml');
  });

  it('excludes EVERY file in public/, not just the ones somebody remembered', () => {
    const rewrite = spaRewrite();
    const swallowed = PUBLIC_FILES.filter((name) => rewrite.test(`/${name}`));
    expect(
      swallowed,
      'these files would be served as index.html instead of themselves — ' +
        'add them to the exclusion list in vercel.json',
    ).toEqual([]);
  });

  it('still sends real marketing routes to the shell', () => {
    // The other direction, and the one a careless widening breaks: a pattern
    // that excludes everything passes the test above perfectly while serving
    // a 404 for every page of the site.
    const rewrite = spaRewrite();
    for (const path of ['/', '/features', '/pricing', '/start', '/terms', '/privacy', '/sms']) {
      expect(rewrite.test(path), `${path} must still render the site`).toBe(true);
    }
  });

  it('leaves the pre-built assets and the demo media alone', () => {
    const rewrite = spaRewrite();
    for (const path of ['/assets/index-abc123.js', '/demo/inbox.mp4', '/shots/features-1.png']) {
      expect(rewrite.test(path), `${path} must not become index.html`).toBe(false);
    }
  });
});

describe('robots.txt', () => {
  it('lets the site be crawled', () => {
    expect(robots).toMatch(/^User-agent:\s*\*/m);
    expect(robots).toMatch(/^Allow:\s*\//m);
    // The failure that matters is the inverse — a blanket disallow ships a
    // site nobody can find and nothing reports it.
    expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m);
  });

  it('points at a sitemap that exists', () => {
    const declared = robots.match(/^Sitemap:\s*(\S+)$/m)?.[1];
    expect(declared, 'robots.txt names no sitemap').toBeTruthy();
    // Both sides (the file it names, and the file we ship): a sitemap
    // directive pointing at a 404 is worse than none, because a crawler
    // retries it instead of concluding there is nothing to fetch.
    expect(PUBLIC_FILES).toContain(declared!.split('/').pop());
  });
});

describe('sitemap.xml', () => {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  /**
   * The paths `main.tsx::route()` actually answers.
   *
   * ⚠ Read from the ROUTER, not from a list in this file. The sitemap's own
   * header comment says "Adding a route to main.tsx means adding it here.
   * Nothing enforces that; a missing entry costs nothing visible, which is
   * exactly why it gets missed." This is that enforcement — a second
   * hand-typed list here would restate the problem instead of closing it.
   */
  const routed = [...mainTsx.matchAll(/p\.startsWith\(['"`](\/[^'"`]*)['"`]\)/g)]
    .map((m) => m[1])
    // A popup return target that closes itself, disallowed in robots.txt.
    .filter((p) => !p.startsWith('/oauth'));

  it('reads a router that still looks like a router', () => {
    // If `route()` is refactored into a table, the regex above finds nothing
    // and both assertions below pass against the empty set.
    expect(routed.length).toBeGreaterThan(3);
  });

  it('names the apex, not the host the site is moving off', () => {
    expect(locs).toContain('https://occupella.com/');
    expect(locs.join(' ')).not.toMatch(/setup\.occupella\.com/);
  });

  it('lists every routed page, and lists nothing that is not routed', () => {
    const paths = locs.map((l) => new URL(l).pathname);
    // A page that exists and is not listed is invisible; a page listed and
    // not routed is a soft 404 the crawler trusts the whole file less for.
    for (const r of routed) {
      expect(paths, `main.tsx routes ${r} and the sitemap does not list it`).toContain(r);
    }
    for (const p of paths) {
      if (p === '/') continue; // the landing page is routed by equality, not prefix
      expect(routed, `the sitemap lists ${p} and main.tsx routes nothing there`).toContain(p);
    }
  });
});

describe('index.html', () => {
  it('declares a canonical on the apex', () => {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical, 'no canonical — /features and / compete as duplicates').toBeTruthy();
    expect(canonical).toBe('https://occupella.com/');
  });

  it('carries no reference to the host the site is moving off', () => {
    // og:url and twitter:image are absolute and are what a shared link
    // renders from, so a stale host here survives the DNS change silently.
    expect(html).not.toMatch(/setup\.occupella\.com/);
  });
});

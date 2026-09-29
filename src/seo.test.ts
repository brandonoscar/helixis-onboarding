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
import manifestRaw from '../public/manifest.webmanifest?raw';
import { render } from './entry-server';
import { PAGES } from './pages';
import {
  CLIENT_ONLY_PREFIXES,
  MARKETING_ROUTES,
  SITE_ORIGIN,
  canonicalFor,
  routeFor,
} from './seo/routes';
import {
  HEAD_END,
  HEAD_START,
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  appShellHead,
  breadcrumbJsonLd,
  headTags,
  llmsTxt,
  softwareJsonLd,
  notFoundHead,
  sitemapXml,
} from './seo/head';

/** Every file sitting at the root of public/, by name. Keys only — the
 *  importers are never invoked, so the binaries are never read. */
const PUBLIC_FILES = Object.keys(import.meta.glob('../public/*')).map(
  (p) => p.split('/').pop() as string,
);

/**
 * The rewrites, as regexes. Re-pointed 2026-09 from "the SPA catch-all": every
 * marketing page is now a prerendered file, and only the client-only paths
 * (the wizard and the OAuth popup) are rewritten to the app shell.
 */
function rewrites(): { source: RegExp; destination: string }[] {
  const config = JSON.parse(vercelRaw) as {
    cleanUrls?: boolean;
    rewrites: { source: string; destination: string }[];
  };
  expect(config.cleanUrls, 'cleanUrls serves /features from features.html').toBe(true);
  return config.rewrites.map((r) => ({
    destination: r.destination,
    source: new RegExp(`^${r.source.replace('/:path*', '(?:/.*)?')}$`),
  }));
}
const rewritten = (path: string) => rewrites().some((r) => r.source.test(path));

describe('static files a crawler asks for reach the filesystem', () => {
  it('found some files to judge', () => {
    // A glob that silently resolves to nothing makes every assertion below
    // vacuously true, and the whole file reports green while testing the
    // empty set.
    expect(PUBLIC_FILES.length).toBeGreaterThan(2);
    expect(PUBLIC_FILES).toContain('robots.txt');
  });

  it('rewrites no file in public/, not just the ones somebody remembered', () => {
    const swallowed = PUBLIC_FILES.filter((name) => rewritten(`/${name}`));
    expect(swallowed, 'these files would be served as the app shell').toEqual([]);
  });

  it('sends the wizard and the OAuth popup to the app shell', () => {
    // The direction a careless narrowing breaks: the wizard is the signup
    // path, and a rewrite that misses it serves the 404 page to every trial.
    for (const path of ['/start', '/start/step-2', '/oauth/callback']) {
      expect(rewritten(path), `${path} must reach the app shell`).toBe(true);
    }
    for (const r of rewrites()) expect(r.destination).toBe('/app-shell');
  });

  it('rewrites to the clean URL, never to a .html path', () => {
    // MEASURED in production 2026-09-29: with cleanUrls on, Vercel serves
    // dist/app-shell.html only at /app-shell, and a rewrite to
    // "/app-shell.html" matched nothing. /start, the signup page, returned
    // the 404 page. The local test server had not modelled rewrite targets,
    // so every check passed.
    for (const r of rewrites()) expect(r.destination).not.toMatch(/\.html$/);
  });

  it('rewrites no marketing page, which is served as its own prerendered file', () => {
    // The old catch-all sent these to index.html, which carried the
    // homepage's canonical, which is why /features was never indexed.
    for (const route of MARKETING_ROUTES) {
      expect(rewritten(route.path), `${route.path} would lose its own HTML`).toBe(false);
    }
    // An unknown path is not rewritten either: it gets the static 404 page.
    expect(rewritten('/this-page-does-not-exist')).toBe(false);
  });

  it('leaves the pre-built assets and the demo media alone', () => {
    for (const path of ['/assets/index-abc123.js', '/demo/inbox.mp4', '/shots/features-1.png']) {
      expect(rewritten(path), `${path} must not become the app shell`).toBe(false);
    }
  });
});

/**
 * ⚠ ONE HOST. setup.occupella.com and helixis-onboarding.vercel.app served
 * full copies of the site until 2026-09-29, so every page existed three
 * times. vercel.json now sends both to occupella.com. A redirect with no host
 * condition, or one that matches occupella.com itself, would send every
 * visitor round in a loop; these pin the shape.
 */
describe('other hosts redirect to occupella.com', () => {
  const config = JSON.parse(vercelRaw) as {
    redirects?: { source: string; has?: { type: string; value: string }[]; destination: string; permanent?: boolean }[];
  };
  const canonicalHost = new URL(SITE_ORIGIN).host;

  it('sends the two old hosts, and only those, permanently', () => {
    const hosts = (config.redirects ?? []).map((r) => r.has?.find((h) => h.type === 'host')?.value);
    expect(hosts.sort()).toEqual(['helixis-onboarding.vercel.app', 'setup.occupella.com']);
    for (const r of config.redirects ?? []) {
      expect(r.has?.length, r.source).toBe(1);
      expect(r.has![0].value).not.toBe(canonicalHost);
      expect(r.source).toBe('/:path*');
      expect(r.destination).toBe(`${SITE_ORIGIN}/:path*`);
      expect(r.permanent).toBe(true);
    }
  });

  it('serves the IndexNow key file as itself', () => {
    const keys = PUBLIC_FILES.filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
    expect(keys).toHaveLength(1);
    expect(rewritten(`/${keys[0]}`)).toBe(false);
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

  it('points at the sitemap the build generates', () => {
    // Re-pointed 2026-09: the sitemap is no longer a file in public/ but
    // written by scripts/prerender.mjs from src/seo/routes.ts. A sitemap
    // directive pointing at a 404 is worse than none, because a crawler
    // retries it instead of concluding there is nothing to fetch.
    const declared = robots.match(/^Sitemap:\s*(\S+)$/m)?.[1];
    expect(declared).toBe(`${SITE_ORIGIN}/sitemap.xml`);
    expect(sitemapXml(() => undefined)).toContain('<urlset');
  });

  it('keeps the OAuth popup out', () => {
    expect(robots).toMatch(/^Disallow:\s*\/oauth\/\s*$/m);
  });
});

describe('sitemap.xml', () => {
  const xml = sitemapXml(() => undefined);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = locs.map((l) => new URL(l).pathname);

  it('found routes to judge', () => {
    // Re-pointed 2026-09 from a regex over main.tsx's prefix router, which no
    // longer exists: the routes are a table now, so the table is read.
    expect(MARKETING_ROUTES.length).toBeGreaterThan(3);
    expect(locs.length).toBeGreaterThan(3);
  });

  it('names the apex, not the host the site moved off', () => {
    expect(locs).toContain('https://occupella.com/');
    expect(xml).not.toMatch(/setup\.occupella\.com/);
  });

  it('lists every page marked for it, and nothing else', () => {
    // A page that exists and is not listed is invisible; a page listed and
    // not routed is a soft 404 the crawler trusts the whole file less for.
    expect(paths.sort()).toEqual(
      MARKETING_ROUTES.filter((r) => r.inSitemap).map((r) => r.path).sort(),
    );
  });

  it('leaves out a page marked out of it', () => {
    // No route is out of the sitemap today; /compare/leadsimple will be,
    // until it is approved, and this is the line that keeps it out.
    const held = { ...MARKETING_ROUTES[1], path: '/held-back', inSitemap: false };
    expect(sitemapXml(() => undefined, [...MARKETING_ROUTES, held])).not.toContain('/held-back');
  });

  it('never lists the wizard or the OAuth popup', () => {
    for (const p of paths) {
      for (const prefix of CLIENT_ONLY_PREFIXES) expect(p.startsWith(prefix), p).toBe(false);
    }
  });

  it('writes lastmod only when the build knows it', () => {
    expect(xml).not.toContain('<lastmod>');
    expect(sitemapXml(() => '2026-09-29')).toContain('<lastmod>2026-09-29</lastmod>');
  });
});

describe('every marketing route has its own head', () => {
  it('is rendered by exactly the pages the route table lists', () => {
    // Both directions: a page with no route ships with no title; a route
    // with no page prerenders the 404 under a real title.
    expect(Object.keys(PAGES).sort()).toEqual(MARKETING_ROUTES.map((r) => r.path).sort());
  });

  it('has a unique title and description, short enough to show whole', () => {
    const titles = MARKETING_ROUTES.map((r) => r.title);
    const descriptions = MARKETING_ROUTES.map((r) => r.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const r of MARKETING_ROUTES) {
      expect(r.description.length, `${r.path} description`).toBeLessThanOrEqual(155);
      expect(r.title, r.path).not.toMatch(/—/);
      expect(r.description, r.path).not.toMatch(/—/);
    }
  });

  it('points its canonical and og:url at itself, once', () => {
    for (const r of MARKETING_ROUTES) {
      const head = headTags(r);
      const canonicals = [...head.matchAll(/rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
      expect(canonicals, r.path).toEqual([canonicalFor(r)]);
      expect(head).toContain(`<meta property="og:url" content="${canonicalFor(r)}" />`);
      expect(head.startsWith(HEAD_START) && head.endsWith(HEAD_END)).toBe(true);
    }
    expect(canonicalFor(MARKETING_ROUTES.find((r) => r.path === '/features')!)).toBe(
      'https://occupella.com/features',
    );
  });

  it('carries only Organization and WebSite structured data on a page that is not about the product as a whole', () => {
    // Re-pointed 2026-09-29 from the home page, which now also carries
    // SoftwareApplication (next test).
    const head = headTags(MARKETING_ROUTES.find((r) => r.path === '/features')!);
    const types = [...head.matchAll(/"@type":"([^"]+)"/g)].map((m) => m[1]);
    expect(types).toEqual(['Organization', 'WebSite']);
    // sameAs lists only profiles that exist; an empty list is left out.
    expect('sameAs' in ORGANIZATION_JSONLD).toBe(false);
    expect(WEBSITE_JSONLD.url).toBe(`${SITE_ORIGIN}/`);
  });

  it('gives a nested page a breadcrumb only when every link in it is a real page', () => {
    const texas = MARKETING_ROUTES.find((r) => r.path === '/state-laws/texas')!;
    const head = headTags(texas);
    const ld = JSON.parse(head.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList".*?)<\/script>/)![1]);
    expect(ld.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'Landlord rules by state', 'Texas']);
    let withCrumbs = 0;
    for (const r of MARKETING_ROUTES) {
      const b = breadcrumbJsonLd(r) as { itemListElement: { item: string; position: number }[] } | null;
      if (!b) continue;
      withCrumbs += 1;
      expect(b.itemListElement[b.itemListElement.length - 1].item).toBe(canonicalFor(r));
      for (const i of b.itemListElement) {
        expect(routeFor(i.item.replace(SITE_ORIGIN, '') || '/'), i.item).toBeDefined();
      }
    }
    expect(withCrumbs).toBeGreaterThan(51);
    for (const p of ['/', '/features', '/solutions/leasing', '/docs/buildium-api-setup']) {
      expect(breadcrumbJsonLd(MARKETING_ROUTES.find((r) => r.path === p)!), p).toBeNull();
    }
  });

  it('preloads each page\'s largest image, and only an image the page shows', () => {
    const withImage = MARKETING_ROUTES.filter((r) => r.lcpImage);
    expect(withImage.map((r) => r.path)).toEqual(['/', '/features']);
    for (const r of withImage) {
      expect(headTags(r)).toContain(`<link rel="preload" as="image" href="${r.lcpImage}" fetchpriority="high" />`);
      // A preload for an image the page doesn't render is a wasted download
      // on the most important request of the visit.
      expect(render(r.path), r.path).toContain(`poster="${r.lcpImage}"`);
    }
    expect(headTags(MARKETING_ROUTES.find((r) => r.path === '/pricing')!)).not.toContain('rel="preload"');
  });

  it('describes the product with the pricing page\'s own prices', () => {
    const ld = softwareJsonLd() as { offers: { name: string; price: string; priceCurrency: string }[] };
    // The same three prices the pricing route's description states, so the
    // structured data and the page cannot disagree.
    const pricing = MARKETING_ROUTES.find((r) => r.path === '/pricing')!;
    for (const price of ['50', '199', '500']) {
      expect(ld.offers.map((o) => o.price)).toContain(price);
      expect(pricing.description).toContain(`$${price}`);
    }
    expect(ld.offers.find((o) => o.name === 'Trial')!.price).toBe('0');
    expect(ld.offers.every((o) => o.priceCurrency === 'USD')).toBe(true);
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|review/i);
    for (const r of MARKETING_ROUTES) {
      const has = headTags(r).includes('"@type":"SoftwareApplication"');
      expect(has, r.path).toBe(r.path === '/' || r.path === '/pricing');
    }
  });

  it('writes llms.txt from the routes, with the state pages as one entry', () => {
    const txt = llmsTxt();
    expect(txt.startsWith('# Occupella\n')).toBe(true);
    for (const r of MARKETING_ROUTES) {
      if (r.name === 'state_law') expect(txt, r.path).not.toContain(`${canonicalFor(r)})`);
      else expect(txt, r.path).toContain(`(${canonicalFor(r)})`);
    }
    expect(txt).toContain('not affiliated with Buildium');
    expect(txt).not.toMatch(/rentvine|partner|helixis/i);
  });

  it('keeps the 404 page and the app shell out of the index', () => {
    for (const head of [notFoundHead(), appShellHead()]) {
      expect(head).toContain('<meta name="robots" content="noindex" />');
      expect(head).not.toContain('rel="canonical"');
    }
  });

  it('never routes the wizard or the OAuth popup as a marketing page', () => {
    for (const r of MARKETING_ROUTES) {
      for (const prefix of CLIENT_ONLY_PREFIXES) expect(r.path.startsWith(prefix)).toBe(false);
    }
  });
});

/**
 * The mark a tab and a search result show.
 *
 * ⚠ THE DEFECT THESE EXIST FOR WAS INVISIBLE FROM INSIDE THE REPO. The icon
 * was declared as an inline `data:` URI, so index.html looked complete, every
 * test passed, and /favicon.ico was never written — MEASURED 2026-09-21, a
 * real 404 rather than the SPA shell. Google asks for that path by convention
 * and rendered occupella.com with the generic globe. Nothing failed anywhere:
 * the only symptom was a search result that looked abandoned.
 *
 * So the properties below are about FILES ON DISK, not about the HTML reading
 * plausibly. A declaration is not an icon.
 */
describe('the brand mark reaches a browser and a crawler', () => {
  /** Every `/…` icon path index.html points at, however it is spelled. */
  const declared = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g)]
    .map((m) => m[0].match(/href="([^"]+)"/)?.[1])
    .filter((h): h is string => Boolean(h));

  it('found the declarations to judge', () => {
    // A tag rewritten across several lines, or `rel` moved after `href`, makes
    // the regex find nothing — and then every assertion below passes against
    // the empty set while the site ships no icon at all.
    expect(declared.length).toBeGreaterThanOrEqual(4);
  });

  it('points at real files, never an inline drawing', () => {
    for (const href of declared) {
      expect(
        href.startsWith('data:'),
        `${href} is drawn inline. That is a SECOND copy of the mark, free to ` +
          'drift from the files this site actually serves — and it is what ' +
          'hid the missing favicon.ico, because the tab looked right.',
      ).toBe(false);
      expect(PUBLIC_FILES, `index.html declares ${href} and public/ has no such file`).toContain(
        href.replace(/^\//, ''),
      );
    }
  });

  it('ships favicon.ico whatever the HTML says', () => {
    // Deliberately NOT derived from `declared`. Google's crawler asks for this
    // path by convention even when nothing links to it, so a guard that only
    // read the HTML would pass with the file absent — which is exactly the
    // state that produced the globe.
    expect(PUBLIC_FILES).toContain('favicon.ico');
  });

  it('gives iOS a PNG, because it ignores an SVG apple-touch-icon', () => {
    // This line pointed at /favicon.svg and therefore did nothing: iOS
    // screenshots the page instead. The file existing is not the property —
    // its FORMAT is.
    const touch = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/)?.[1];
    expect(touch, 'no apple-touch-icon at all').toBeTruthy();
    expect(touch!.endsWith('.png'), `apple-touch-icon is ${touch} — iOS needs a PNG`).toBe(true);
  });

  it('names manifest icons that exist', () => {
    // A manifest pointing at a 404 is the same silent failure one layer over:
    // Android substitutes a generated letter tile, so the customer's phone
    // shows somebody else's icon and nothing reports it.
    const icons = (JSON.parse(manifestRaw) as { icons: { src: string }[] }).icons;
    expect(icons.length).toBeGreaterThan(0);
    for (const { src } of icons) {
      expect(PUBLIC_FILES, `manifest names ${src} and public/ has no such file`).toContain(
        src.replace(/^\//, ''),
      );
    }
  });
});

describe('index.html', () => {
  it('holds the per-page tags only between the markers the build replaces', () => {
    // Re-pointed 2026-09 from "declares a canonical on the apex": that single
    // canonical, served on every route, is what hid /features from Google.
    // The template now carries no canonical at all; each page gets its own.
    expect(html).toContain(HEAD_START);
    expect(html).toContain(HEAD_END);
    const outside = html.replace(
      new RegExp(`${HEAD_START}[\\s\\S]*?${HEAD_END}`),
      '',
    );
    expect(outside).not.toMatch(/rel="canonical"|property="og:|name="twitter:|<title>|name="description"/);
    expect(html).toContain('<div id="root"></div>');
  });

  it('paints the browser chrome white, not the retired dark theme', () => {
    expect(html).toContain('<meta name="theme-color" content="#FFFFFF" />');
  });

  it('carries no reference to the host the site moved off', () => {
    expect(html).not.toMatch(/setup\.occupella\.com/);
  });
});

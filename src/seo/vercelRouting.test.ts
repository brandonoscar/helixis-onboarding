/**
 * The routing model, and the real vercel.json run through it against the
 * files the build writes. The build runs the same check against the real
 * dist/ (scripts/prerender.mjs), so this is the cheap early copy.
 */
import { describe, expect, it } from 'vitest';

import vercelRaw from '../../vercel.json?raw';
import { CLIENT_ONLY_PREFIXES, MARKETING_ROUTES } from './routes';
import { pageFile, resolve, routingProblems, sourcePattern, type VercelConfig } from './vercelRouting';

const config = JSON.parse(vercelRaw) as VercelConfig;
const paths = MARKETING_ROUTES.map((r) => r.path);

/** What dist/ holds after a build, less the hashed assets. */
const BUILT = new Set([
  ...paths.map(pageFile),
  '404.html',
  'app-shell.html',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
]);

describe('the served site', () => {
  it('serves every path that matters the file it needs', () => {
    expect(routingProblems(config, BUILT, paths, CLIENT_ONLY_PREFIXES)).toEqual([]);
  });

  it('catches the 2026-09-29 outage: a rewrite to the .html name', () => {
    // The config that shipped in #32. /start returned the 404 page.
    const broken: VercelConfig = {
      cleanUrls: true,
      rewrites: [
        { source: '/start', destination: '/app-shell.html' },
        { source: '/oauth/:path*', destination: '/app-shell.html' },
      ],
    };
    expect(resolve('/start', broken, BUILT)).toEqual({ status: 404, file: '404.html' });
    const problems = routingProblems(broken, BUILT, paths, CLIENT_ONLY_PREFIXES);
    expect(problems.some((p) => p.startsWith('/start '))).toBe(true);
    expect(problems.some((p) => p.startsWith('/oauth/callback '))).toBe(true);
  });

  it('catches a missing shell, and a missing page', () => {
    const noShell = new Set([...BUILT].filter((f) => f !== 'app-shell.html'));
    expect(routingProblems(config, noShell, paths, CLIENT_ONLY_PREFIXES)).not.toEqual([]);
    const noPricing = new Set([...BUILT].filter((f) => f !== 'pricing.html'));
    expect(routingProblems(config, noPricing, paths, CLIENT_ONLY_PREFIXES)).toEqual([
      '/pricing is served 404 404.html, expected 200 pricing.html',
    ]);
  });

  it('catches a rewrite that swallows a marketing page', () => {
    const greedy: VercelConfig = { ...config, rewrites: [{ source: '/:path*', destination: '/app-shell' }] };
    const noPages = new Set(['404.html', 'app-shell.html', 'robots.txt', 'sitemap.xml']);
    expect(routingProblems(greedy, noPages, paths, CLIENT_ONLY_PREFIXES)).toContain(
      '/features is served 200 app-shell.html, expected 200 features.html',
    );
  });
});

describe('the model', () => {
  it('lets a file answer before any rewrite', () => {
    const all: VercelConfig = { cleanUrls: true, rewrites: [{ source: '/:path*', destination: '/app-shell' }] };
    expect(resolve('/robots.txt', all, BUILT)).toEqual({ status: 200, file: 'robots.txt' });
  });

  it('redirects a .html URL to its clean one', () => {
    expect(resolve('/features.html', config, BUILT)).toEqual({ status: 308, location: '/features' });
    expect(resolve('/index.html', config, BUILT)).toEqual({ status: 308, location: '/' });
  });

  it('matches :path* with and without a tail', () => {
    const re = sourcePattern('/oauth/:path*');
    expect(re.test('/oauth')).toBe(true);
    expect(re.test('/oauth/callback')).toBe(true);
    expect(re.test('/oauthx')).toBe(false);
  });

  it('refuses a source it does not model, rather than guessing', () => {
    expect(() => sourcePattern('/(.*)')).toThrow(/not modelled/);
  });
});

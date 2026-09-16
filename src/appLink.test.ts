/**
 * Every route from this site into the product names the product.
 *
 * `APP_URL` is behind "Sign in" in the header and the footer (Site.tsx) and
 * behind the wizard's hand-off at the end of setup (App.tsx). It is the
 * most-clicked link here and it is the LAST thing somebody sees before they
 * type a password.
 *
 * ⚠ IT DEFAULTED TO `https://agentichelixis.vercel.app` UNTIL 2026-09-15, and
 * nothing anywhere failed. A raw Vercel hostname in the status bar at the
 * moment of a password entry is what a phishing page looks like, and the
 * failure is entirely silent: the link works, the app loads, and the only
 * symptom is a customer who hesitates. The domain swap made it wrong in a
 * second way — the web app moved to app.occupella.com while this site took the
 * apex — so the value now has to be right for two reasons at once.
 *
 * ⚠ A build-time env var can override it (`VITE_HELIXIS_APP_URL`), and gotcha 3
 * in the authority repo is this project's record of a stale Vercel dashboard
 * value silently beating the code. That gotcha's own prescription is a baked
 * default which makes a stale value inert rather than load-bearing — so the
 * DEFAULT is what this pins. Whether the dashboard also carries one is not
 * knowable from a test and is not what protects anybody.
 */

import { describe, expect, it } from 'vitest';

import apiSource from './lib/api.ts?raw';
import siteSource from './Site.tsx?raw';

/** The literal on the right of `VITE_HELIXIS_APP_URL || …`. */
function bakedDefault(): string {
  const m = apiSource.match(
    /VITE_HELIXIS_APP_URL\s*\|\|\s*["'`]([^"'`]+)["'`]/,
  );
  expect(m, 'APP_URL no longer has a baked default — a missing env var now yields undefined').toBeTruthy();
  return m![1];
}

describe('the link into the product', () => {
  it('names the product, not the host that happens to serve it', () => {
    const url = bakedDefault();
    expect(url).toBe('https://app.occupella.com');
    // Stated separately from the equality above so the failure says WHY. A
    // future host change should still refuse a platform URL.
    expect(url, 'a raw platform hostname reads as phishing at a password prompt').not.toMatch(
      /vercel\.app|onrender\.com|netlify\.app/,
    );
  });

  it('is NOT the apex — that is this site, and it has no sign-in', () => {
    // The direction a careless swap breaks: pointing "Sign in" back at the
    // marketing site sends somebody to the page they are already on, forever,
    // with no error anywhere.
    expect(new URL(bakedDefault()).hostname).toBe('app.occupella.com');
  });

  it('is what the header and footer sign-in links actually use', () => {
    // A behavioural test of the constant cannot see a component that hardcodes
    // its own URL instead — which is how the two copies of `needsReauth` got
    // written in the authority repo. Both sign-in links must go through it.
    const hrefs = [...siteSource.matchAll(/href=\{?([^}\s>]+)\}?[\s>]/g)].map((m) => m[1]);
    const signIn = hrefs.filter((h) => h === 'APP_URL');
    expect(signIn.length, 'Site.tsx no longer routes both sign-in links through APP_URL').toBe(2);

    // And no component may write the app host as a literal beside it.
    expect(siteSource).not.toMatch(/["'`]https:\/\/app\.occupella\.com/);
  });
});

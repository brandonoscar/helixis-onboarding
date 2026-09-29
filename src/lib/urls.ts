/**
 * Links the marketing pages need, with nothing heavy behind them.
 *
 * ⚠ KEEP THIS FILE FREE OF IMPORTS. It was part of lib/api.ts, which imports
 * the Supabase client, so every marketing page shipped about 500 KB of auth
 * code to print one URL. main.tsx loads the wizard (and Supabase with it)
 * only on /start.
 */

/** Where a finished user lands to actually start using Occupella (the web
 *  chat app). Baked default + VITE_HELIXIS_* name so a stale Vercel env
 *  var can't silently win at build time (see gotcha 3 / ADR 0003).
 *
 *  ⚠ THIS IS THE MOST-CLICKED LINK ON THE SITE and it named Vercel until
 *  2026-09-15. It is behind "Sign in" in both the header and the footer
 *  (Site.tsx) AND behind the wizard's hand-off at the end of setup (App.tsx),
 *  so every route into the product from the brand's front door reads
 *  `agentichelixis.vercel.app` in the status bar — which is what a phishing
 *  page looks like at the one moment somebody is about to type a password.
 *  The domain swap moved the web app to app.occupella.com; the default has to
 *  say so, because a dashboard override is invisible from here (gotcha 3, and
 *  that gotcha's own prescription is a baked default that makes a stale value
 *  inert rather than load-bearing). */
export const APP_URL: string =
  import.meta.env.VITE_HELIXIS_APP_URL || "https://app.occupella.com";

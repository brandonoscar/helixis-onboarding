/**
 * Authenticated fetch against the AgenticHelixis backend.
 *
 * Phase 1 of the consolidation: onboarding no longer provisions via its
 * own Supabase Edge Functions — it is a pure client of the backend's
 * existing surface:
 *
 *   POST /api/v1/auth/bootstrap          — idempotent company creation
 *   PUT  /api/v1/buildium/credentials    — Fernet-encrypted upsert
 *   POST /api/v1/buildium/test           — live test + account_id backfill
 *   PUT  /api/v1/buildium/webhook-secret — store Buildium-generated secret
 *   POST /api/v1/connectors/{id}/connect — Composio OAuth (Google)
 *
 * Auth: the Supabase project (src/lib/supabase.ts) must be the SAME
 * project the backend verifies JWTs against (helixis-test) — a token
 * minted by any other project will be rejected with 401.
 */

import { supabase } from "./supabase";

export const API_URL: string =
  import.meta.env.VITE_API_URL || "https://agentichelixis.onrender.com";

/** The URL the user registers in Buildium → Settings → Webhooks.
 *  Routing is by Buildium AccountId (backfilled by /buildium/test),
 *  so the endpoint is the same for every company. */
export const BUILDIUM_WEBHOOK_URL = `${API_URL}/webhooks/buildium`;

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

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export interface ApiOptions extends RequestInit {
  /** Bearer token override for the window right after verifyOtp,
   *  before the persisted session is readable. */
  token?: string;
}

export async function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  const { token, headers: extraHeaders, ...rest } = options;

  let accessToken = token;
  if (!accessToken) {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token;
  }
  if (!accessToken) throw new ApiError(401, "Not signed in");

  const headers = new Headers(extraHeaders);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (rest.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* non-JSON error body — keep the status line */
    }
    throw new ApiError(res.status, detail);
  }
  return res;
}

export async function apiJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  return (await res.json()) as T;
}

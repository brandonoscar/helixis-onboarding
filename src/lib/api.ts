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

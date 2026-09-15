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
  /** Override the request deadline in milliseconds. 0 disables it. */
  timeoutMs?: number;
}

/**
 * How long anything here may take before it is treated as failed.
 *
 * ⚠ Matched to the app's own deadline deliberately, and the reason is the
 * backend rather than taste: its connection pool gives up at 10s and answers
 * with a cause. A client deadline SHORTER than that turns a diagnosable server
 * error into a client-side abort with nothing in Sentry; one that is absent
 * entirely — which is what this file had — means a stalled connection spins
 * the button until the browser's own limit, which for a hung socket is
 * effectively never.
 */
const DEFAULT_TIMEOUT_MS = 45_000;

/**
 * The phrases HTTP supplies, which are not messages to anybody.
 *
 * ⚠ FastAPI answers an unmatched route with `{"detail": "Not Found"}` and an
 * unhandled exception with `{"detail": "Internal Server Error"}`, and this
 * file handed `detail` straight to `setError` — so somebody halfway through
 * creating an account read the words **"Not Found"**, with no subject, no
 * cause and nothing to do next. A route that wrote a real sentence keeps it;
 * this list is only the ones where the backend said nothing and HTTP filled
 * in the blank.
 */
const HTTP_REASON_PHRASES = new Set([
  "bad request",
  "unauthorized",
  "forbidden",
  "not found",
  "method not allowed",
  "conflict",
  "unprocessable entity",
  "unprocessable content",
  "too many requests",
  "internal server error",
  "not implemented",
  "bad gateway",
  "service unavailable",
  "gateway timeout",
]);

/**
 * What to say when the backend did not say anything worth repeating.
 *
 * Wording is for somebody SIGNING UP, which is why it differs from the app's.
 * A person who has not got an account yet cannot "ask an admin" and has no
 * workspace to go back to — the only useful next actions are retry, or tell
 * us. Anything that reads as their mistake is wrong here: at this point in the
 * funnel they have typed an email address and nothing else.
 */
function fallbackMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "That sign-in link or code is no longer valid. Request a new one and try again.";
  }
  if (status === 404) {
    return "Setup could not reach that step. Refresh the page and try again — if it keeps happening, email team@occupella.com.";
  }
  if (status === 409) {
    return "That looks like it is already set up. Refresh the page to pick up where you left off.";
  }
  if (status === 429) {
    return "Too many attempts in a short time. Wait a minute and try again.";
  }
  if (status >= 500) {
    return "Something went wrong on our side, not yours. Try again in a moment — if it keeps happening, email team@occupella.com.";
  }
  return "That did not go through. Try again — if it keeps happening, email team@occupella.com.";
}

/**
 * Whose outage is it?
 *
 * ⚠ `=== false` IS A FACT AND `true` IS NOT. The browser reporting no network
 * is the browser reporting its own state, so it can be asserted. `true` means
 * only that an interface is up — a captive portal, a wedged VPN and a working
 * connection all report it — so that side claims nothing and the sentence
 * stays neutral about blame. Never `!navigator.onLine`: where the property is
 * absent (an embedded webview) the loose spelling tells somebody their
 * internet is down on no evidence at all.
 */
function unreachableMessage(): string {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return offline
    ? "Your device looks offline. Reconnect and try again — nothing was lost."
    : "We could not reach Occupella just now. Try again in a moment — nothing was lost.";
}

/**
 * ⚠ STATUS 0 MEANS THE REQUEST NEVER REACHED A SERVER — it is not a success
 * and it is not an HTTP status. Callers branching on `status` must not read it
 * as one, which is why it is a named constant rather than a bare zero: a
 * `status < 400` test would treat a total network failure as fine.
 */
export const STATUS_UNREACHABLE = 0;

/** One wording, because two copies of a deadline message drift. */
const TOOK_TOO_LONG = "That took too long to respond. Try again — nothing was lost.";

export async function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  const { token, headers: extraHeaders, timeoutMs, ...rest } = options;

  const deadline = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;
  if (deadline > 0) timer = setTimeout(() => controller.abort(), deadline);

  /**
   * ⚠ A RACE, NOT A try/finally, AND THE DIFFERENCE IS THE WHOLE FIX.
   *
   * `controller.abort()` signals `fetch` and NOTHING ELSE. An await on any
   * other pending promise inside this function is untouched by it — so the
   * first cut of this put `getSession()` inside the try, commented that the
   * deadline therefore covered it, and was simply wrong: a hung session
   * refresh never reaches `fetch`, so nothing is listening to the signal and
   * the call hangs forever exactly as it did before. The test caught it, the
   * comment did not.
   *
   * Racing the whole body against the abort is what makes the deadline mean
   * "this call settles", which is the only version of the promise worth
   * making. It also covers every await added here later, rather than only
   * the two that exist today.
   */
  const failOnAbort = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () =>
      reject(new ApiError(STATUS_UNREACHABLE, TOOK_TOO_LONG)),
    );
  });

  const work = async (): Promise<Response> => {
    let accessToken = token;
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token;
    }
    if (!accessToken) throw new ApiError(401, "Not signed in");

    const headers = new Headers(extraHeaders);
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (rest.body) headers.set("Content-Type", "application/json");

    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, { ...rest, headers, signal: controller.signal });
    } catch (err) {
      // ⚠ THIS BRANCH IS THE WHOLE POINT. `fetch` rejects with a bare
      // `TypeError: Failed to fetch` when nothing answered, and that string
      // was reaching the screen verbatim — a browser's internal error text,
      // shown to a prospect mid-signup, naming nobody and suggesting nothing.
      //
      // ⚠ No abort branch here, deliberately. `controller.abort()` settles
      // `failOnAbort` SYNCHRONOUSLY inside the event listener, while fetch's
      // own AbortError has to propagate out of the fetch implementation
      // afterwards — so the race has always already been decided by the time
      // this catch could see one. A ternary on `err.name === "AbortError"`
      // was here and a mutation proved it could not change any output; it is
      // deleted rather than kept as decoration (gotcha 58). The deadline
      // message lives on the race, which is the branch that actually fires.
      if (err instanceof ApiError) throw err;
      throw new ApiError(STATUS_UNREACHABLE, unreachableMessage());
    }

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") detail = body.detail.trim();
      } catch {
        /* non-JSON error body — the fallback below says something useful */
      }
      // A status line is not a sentence, and neither is an empty body.
      if (!detail || HTTP_REASON_PHRASES.has(detail.toLowerCase())) {
        detail = fallbackMessage(res.status);
      }
      throw new ApiError(res.status, detail);
    }
    return res;
  };

  try {
    // `Promise.race` subscribes to both, so the loser's rejection is handled
    // and cannot surface as an unhandled rejection.
    return await Promise.race([work(), failOnAbort]);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

export async function apiJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  return (await res.json()) as T;
}

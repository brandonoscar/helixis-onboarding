/**
 * Lightweight localStorage persistence for wizard progress.
 *
 * Without this, all wizard state lives in in-memory React state, so a page
 * refresh — or a magic-link redirect, which reloads the SPA — silently
 * discards the user's workspace name, current step, and invites and drops
 * them back at step 1. This persists the non-sensitive progress so a
 * reload/redirect resumes where they were.
 *
 * SECURITY: never stores secrets. Buildium client_id/secret and the webhook
 * signing secret are entered in step-local component state and are never
 * lifted into App state, so they never reach this module. Only workspace
 * name/slug, step, completed-set, invited emails, and the user's email are
 * persisted — all non-sensitive (and the email is already in the JWT).
 */

const KEY = "helixis_onboarding_v1";

export interface PersistedWizard {
  step?: string;
  completed?: string[];
  workspace?: { name: string; slug: string; id?: string };
  members?: { email: string; role: string; status: string }[];
  webhooksConfigured?: boolean;
  userEmail?: string;
}

export function loadWizard(): PersistedWizard {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistedWizard) : {};
  } catch {
    // Corrupt JSON, private-mode storage block, etc. — start fresh.
    return {};
  }
}

export function saveWizard(state: PersistedWizard): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — non-fatal; the wizard just won't persist.
  }
}

export function clearWizard(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * Step 2's property-management-system choice: Buildium or Rentvine.
 *
 * The rules live here rather than inline in App.tsx so they can be tested
 * without rendering the wizard.
 *
 * ⚠ The backend is the authority on all of it (ADR 0003, ADR 0010):
 *  - `GET /api/v1/rentvine/credentials` says whether this deployment accepts a
 *    Rentvine credential at all (`connector_enabled`).
 *  - `PUT` answers 503 while the connector is off, 409 when the workspace is
 *    already on Buildium, 422 when it cannot work out the Rentvine subdomain.
 *    Each carries a sentence written for the customer, and the form shows it
 *    verbatim.
 *  - A passing `POST /test` starts the first sync.
 */

export type Pms = "buildium" | "rentvine";

export const PMS_NAME: Record<Pms, string> = {
  buildium: "Buildium",
  rentvine: "Rentvine",
};

/**
 * What each system sends, in the words the customer would use. Rentvine
 * mirrors seven kinds of record and no ledger; saying "bills" or "balances"
 * for it would promise data that never arrives.
 */
export const PMS_READS: Record<Pms, string> = {
  buildium: "properties, units, leases, tenants, work orders and bills",
  rentvine: "properties, units, leases, tenants, owners, vendors and work orders",
};

/** Where the wizard goes after a system is connected. */
export function stepAfterConnect(pms: Pms): "live" | "channels" {
  // Live updates are Buildium webhooks. Rentvine's receiver refuses every
  // delivery until its signature scheme is known, so the step would ask the
  // customer to wire up something that cannot work. Rentvine is re-read on a
  // schedule instead.
  return pms === "buildium" ? "live" : "channels";
}

/** Whether the Rentvine option can be offered, from the GET's answer. */
export type RentvineAvailability = "available" | "off" | "unknown";

export function rentvineAvailability(status: unknown): RentvineAvailability {
  if (!status || typeof status !== "object") return "unknown";
  const enabled = (status as { connector_enabled?: unknown }).connector_enabled;
  if (enabled === true) return "available";
  if (enabled === false) return "off";
  // An older backend that predates the field. Offer it: the PUT still refuses
  // honestly (503) if the connector is off, so the cost of guessing wrong is
  // one clear message, while hiding it would lose a customer who could connect.
  return "unknown";
}

/**
 * The PUT body. ⚠ A blank account code is OMITTED, never sent as "".
 *
 * The backend treats a missing `account_code` as "discover it from the keys"
 * and an empty string as a supplied value it then rejects with 422. Sending ""
 * would make every customer who left the box blank fail on the path built
 * for them (gotcha 156).
 */
export function rentvineCredentialsBody(
  apiKey: string,
  apiSecret: string,
  accountCode: string,
): Record<string, string> {
  const body: Record<string, string> = { api_key: apiKey.trim(), api_secret: apiSecret.trim() };
  const code = accountCode.trim();
  if (code) body.account_code = code;
  return body;
}

/** A 422 from the PUT means "tell us your subdomain": show that field. */
export function asksForAccountCode(status: number): boolean {
  return status === 422;
}

/** What the first-scan endpoint returns (only the fields the cards read). */
export interface ScanData {
  synced: boolean;
  properties: number;
  units: number;
  tenants: number;
  active_leases: number;
  open_work_orders: number;
  stalled_work_orders: number;
  expiring_leases: number;
  expiring_window_days: number;
  /** `null` when the system does not send lease balances (Rentvine today). */
  delinquent_leases: number | null;
  delinquent_total: number | null;
  pending_promises: number;
  pms?: string | null;
}

export interface Card {
  num: string;
  label: string;
  sub: string;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The launch screen's findings, or `null` while the mirror is still empty.
 *
 * ⚠ The rent-owed card is LEFT OUT when the backend sends `null`, never shown
 * as $0. A new Rentvine customer told "$0 owed across 0 leases" would read it
 * as a fact about their tenants, and it is only a fact about what Rentvine
 * sends us.
 */
export function findingCards(scan: ScanData | null): Card[] | null {
  if (!scan || !scan.synced) return null;
  const cards: Card[] = [
    {
      num: String(scan.open_work_orders),
      label: `open work order${scan.open_work_orders === 1 ? "" : "s"}`,
      sub:
        scan.stalled_work_orders > 0
          ? `${scan.stalled_work_orders} look stalled — no update in over 7 days.`
          : "None look stalled right now.",
    },
    {
      num: String(scan.expiring_leases),
      label: `lease${scan.expiring_leases === 1 ? "" : "s"} ending in the next ${scan.expiring_window_days} days`,
      sub: "Occupella tracks these dates.",
    },
  ];
  if (scan.delinquent_total !== null && scan.delinquent_leases !== null) {
    cards.push({
      num: usd.format(scan.delinquent_total),
      label: `owed across ${scan.delinquent_leases} lease${scan.delinquent_leases === 1 ? "" : "s"}`,
      sub:
        scan.pending_promises > 0
          ? `${scan.pending_promises} tenant${scan.pending_promises === 1 ? " has" : "s have"} promised payment — Occupella tracks those dates.`
          : "Rent reminders Occupella will send once you approve them.",
    });
  }
  return cards;
}

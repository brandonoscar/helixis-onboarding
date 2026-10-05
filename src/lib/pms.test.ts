/**
 * Step 2's Buildium-or-Rentvine choice (Phase 7 of the Rentvine connector).
 *
 * Two halves, and each needs the other:
 *  - the rules in `lib/pms.ts`, tested directly;
 *  - the WIRING in App.tsx, read with the TypeScript compiler rather than a
 *    substring search, because the comments beside each call quote the rule
 *    they enforce, and a text scan would match the comment.
 */

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import appSource from '../App.tsx?raw';
import {
  asksForAccountCode,
  findingCards,
  PMS_NAME,
  PMS_READS,
  propertywareCredentialsBody,
  rentmanagerCredentialsBody,
  rentvineAvailability,
  rentvineCredentialsBody,
  stepAfterConnect,
  SWITCHED_PATHS,
  SWITCHED_PMS,
  switchedPmsOffered,
  type ScanData,
} from './pms';

const SCAN: ScanData = {
  synced: true,
  properties: 12,
  units: 37,
  tenants: 15,
  active_leases: 8,
  open_work_orders: 3,
  stalled_work_orders: 1,
  expiring_leases: 2,
  expiring_window_days: 45,
  delinquent_leases: 2,
  delinquent_total: 900,
  pending_promises: 0,
};

describe('the PUT body', () => {
  it('omits a blank account code instead of sending ""', () => {
    // The backend reads a MISSING code as "discover it" and "" as a supplied
    // value it rejects with 422, so "" would break the path built for them.
    expect(rentvineCredentialsBody('key', 'secret', '')).toEqual({
      api_key: 'key',
      api_secret: 'secret',
    });
    expect(rentvineCredentialsBody('key', 'secret', '   ')).not.toHaveProperty('account_code');
  });

  it('sends a code the customer typed, trimmed', () => {
    expect(rentvineCredentialsBody(' key ', ' secret ', ' acme ')).toEqual({
      api_key: 'key',
      api_secret: 'secret',
      account_code: 'acme',
    });
  });
});

describe('whether Rentvine can be offered', () => {
  it('reads connector_enabled from the GET', () => {
    expect(rentvineAvailability({ configured: false, connector_enabled: true })).toBe('available');
    expect(rentvineAvailability({ configured: false, connector_enabled: false })).toBe('off');
  });

  it('treats an older backend or a failed read as unknown, not off', () => {
    // Hiding the option on a guess would lose a customer who could connect;
    // the PUT's 503 still refuses honestly if the connector is off.
    expect(rentvineAvailability({ configured: false })).toBe('unknown');
    expect(rentvineAvailability(null)).toBe('unknown');
    expect(rentvineAvailability('nope')).toBe('unknown');
  });

  it('only a 422 asks for the account code', () => {
    expect(asksForAccountCode(422)).toBe(true);
    for (const status of [400, 401, 403, 409, 503]) expect(asksForAccountCode(status)).toBe(false);
  });
});

describe('Rent Manager and Propertyware', () => {
  it('are offered only on an explicit yes from their GET', () => {
    expect(switchedPmsOffered({ configured: false, connector_enabled: true })).toBe(true);
    expect(switchedPmsOffered({ configured: false, connector_enabled: false })).toBe(false);
  });

  it('stay hidden when the backend predates them or the read fails', () => {
    // Unlike Rentvine's rule, unknown is NOT offered: a backend from before
    // these connectors has no such route, and offering one would end the
    // customer at an error after they had pasted their keys.
    expect(switchedPmsOffered({ configured: false })).toBe(false);
    expect(switchedPmsOffered({ connector_enabled: 'true' })).toBe(false);
    expect(switchedPmsOffered(null)).toBe(false);
    expect(switchedPmsOffered('nope')).toBe(false);
  });

  it('call the backend routes ADR 0003 names', () => {
    // The backend's route tests pin the same paths and field names; the two
    // repos meet only through this contract.
    expect(SWITCHED_PATHS).toEqual({
      rentmanager: {
        credentials: '/api/v1/rentmanager/credentials',
        test: '/api/v1/rentmanager/test',
      },
      propertyware: {
        credentials: '/api/v1/propertyware/credentials',
        test: '/api/v1/propertyware/test',
      },
    });
    expect([...SWITCHED_PMS]).toEqual(['rentmanager', 'propertyware']);
  });

  it("have a name and say what they read", () => {
    for (const pms of SWITCHED_PMS) {
      expect(PMS_NAME[pms]).toBeTruthy();
      expect(PMS_READS[pms]).toBeTruthy();
    }
  });
});

describe("Rent Manager's PUT body", () => {
  it('sends the contract fields, the location as a number', () => {
    expect(rentmanagerCredentialsBody(' acme ', ' 3 ', ' occupella ', 'p@ss', '')).toEqual({
      corp_id: 'acme',
      location_id: 3,
      username: 'occupella',
      password: 'p@ss',
    });
  });

  it('omits a blank partner token instead of sending ""', () => {
    expect(rentmanagerCredentialsBody('acme', '1', 'u', 'p', '   ')).not.toHaveProperty('partner_token');
    expect(rentmanagerCredentialsBody('acme', '1', 'u', 'p', ' tok ')).toMatchObject({ partner_token: 'tok' });
  });

  it('sends the password exactly as typed', () => {
    // A person types it; a space at either end may be part of it.
    expect(rentmanagerCredentialsBody('acme', '1', 'u', ' pass word ', '')).toMatchObject({
      password: ' pass word ',
    });
  });

  it('refuses a location that is not a whole number above zero', () => {
    for (const bad of ['', '  ', '0', '-1', '1.5', '01', '1e3', 'one', '2 3']) {
      expect(rentmanagerCredentialsBody('acme', bad, 'u', 'p', '')).toBeNull();
    }
  });
});

describe("Propertyware's PUT body", () => {
  it('sends the contract fields, trimmed', () => {
    expect(propertywareCredentialsBody(' 12345 ', ' cid ', ' secret ')).toEqual({
      system_id: '12345',
      client_id: 'cid',
      client_secret: 'secret',
    });
  });
});

describe('where the wizard goes after connecting', () => {
  it('goes straight to the scan for Rent Manager and Propertyware (no webhooks)', () => {
    expect(stepAfterConnect('rentmanager')).toBe('scan');
    expect(stepAfterConnect('propertyware')).toBe('scan');
  });

  it('shows live updates for Buildium and skips them for Rentvine', () => {
    expect(stepAfterConnect('buildium')).toBe('live');
    // Re-pointed 2026-09-29: Scan now comes before Email, so Rentvine (no
    // live-updates step) goes straight to the scan.
    expect(stepAfterConnect('rentvine')).toBe('scan');
  });
});

describe('the launch screen', () => {
  it('shows rent owed when the backend knows it', () => {
    const cards = findingCards(SCAN)!;
    expect(cards.map((c) => c.label)).toContain('owed across 2 leases');
  });

  it('leaves rent owed OUT, not $0, when the system sends no balances', () => {
    const cards = findingCards({ ...SCAN, delinquent_leases: null, delinquent_total: null })!;
    expect(cards).toHaveLength(2);
    expect(cards.some((c) => c.num.includes('$') || c.label.includes('owed'))).toBe(false);
  });

  it('shows nothing while the mirror is still empty', () => {
    expect(findingCards({ ...SCAN, synced: false })).toBeNull();
    expect(findingCards(null)).toBeNull();
  });
});

// ── the wiring in App.tsx ────────────────────────────────────────────

const source = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Names called inside the function or const declared as `name`. */
function callsIn(name: string): Set<string> {
  let scope: ts.Node | undefined;
  const find = (node: ts.Node): void => {
    if (
      (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    ) {
      scope = node;
      return;
    }
    ts.forEachChild(node, find);
  };
  find(source);
  if (!scope) throw new Error(`${name} not found in App.tsx`);
  const called = new Set<string>();
  const walk = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) called.add(node.expression.text);
    ts.forEachChild(node, walk);
  };
  walk(scope);
  return called;
}

/** String literals inside the function named `name`. */
function stringsIn(name: string): Set<string> {
  const out = new Set<string>();
  let scope: ts.Node | undefined;
  const find = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) scope = node;
    else ts.forEachChild(node, find);
  };
  find(source);
  const walk = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.add(node.text);
    ts.forEachChild(node, walk);
  };
  if (scope) walk(scope);
  return out;
}

describe('App.tsx uses the rules', () => {
  it('the picker asks the backend before offering Rentvine', () => {
    expect(callsIn('StepPms')).toContain('rentvineAvailability');
    expect(stringsIn('StepPms')).toContain('/api/v1/rentvine/credentials');
  });

  it('the Rentvine form builds its body with the helper', () => {
    expect(callsIn('StepRentvine')).toContain('rentvineCredentialsBody');
    expect(callsIn('StepRentvine')).toContain('asksForAccountCode');
  });

  it('the picker asks the backend before offering Rent Manager or Propertyware', () => {
    expect(callsIn('StepPms')).toContain('switchedPmsOffered');
  });

  it('the Rent Manager and Propertyware forms build their bodies with the helpers', () => {
    expect(callsIn('StepRentManager')).toContain('rentmanagerCredentialsBody');
    expect(callsIn('StepRentManager')).toContain('saveAndTest');
    expect(callsIn('StepPropertyware')).toContain('propertywareCredentialsBody');
    expect(callsIn('StepPropertyware')).toContain('saveAndTest');
  });

  it('saving saves, then tests', () => {
    const called = callsIn('saveAndTest');
    expect(called).toContain('apiFetch');
    expect(called).toContain('apiJson');
  });

  it('connecting routes through stepAfterConnect', () => {
    expect(callsIn('handlePmsConnected')).toContain('stepAfterConnect');
  });

  it('the scan screen builds its cards with findingCards', () => {
    // Re-pointed 2026-09-29 from StepFinish: the scan became its own step.
    expect(callsIn('StepScan')).toContain('findingCards');
  });
});

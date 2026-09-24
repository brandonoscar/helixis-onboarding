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
  rentvineAvailability,
  rentvineCredentialsBody,
  stepAfterConnect,
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

describe('where the wizard goes after connecting', () => {
  it('shows live updates for Buildium and skips them for Rentvine', () => {
    expect(stepAfterConnect('buildium')).toBe('live');
    expect(stepAfterConnect('rentvine')).toBe('channels');
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

  it('connecting routes through stepAfterConnect', () => {
    expect(callsIn('handlePmsConnected')).toContain('stepAfterConnect');
  });

  it('the launch screen builds its cards with findingCards', () => {
    expect(callsIn('StepFinish')).toContain('findingCards');
  });
});

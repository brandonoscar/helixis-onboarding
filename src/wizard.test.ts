// @vitest-environment node
/**
 * The setup wizard's copy and wiring, read from App.tsx with the TypeScript
 * parser.
 *
 * ⚠ AST, never a substring search of the source. The comment beside each
 * guarded line quotes the defect it replaced ("or finish the setup here",
 * "Gmail, Calendar and Drive"), so a text scan would fire on the explanation
 * rather than on the code. Only string literals, template pieces and JSX text
 * are read here, which is what a person actually sees.
 *
 * The logic each step calls lives in `lib/` and is tested there; this file
 * pins that App.tsx calls it, and that the words on screen match what the
 * backend does.
 */

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import appSource from './App.tsx?raw'
import analyticsSource from './lib/analytics.ts?raw'

const source = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

/** The function or const declared as `name`, anywhere in the file. */
function scopeOf(name: string): ts.Node {
  let scope: ts.Node | undefined
  const find = (node: ts.Node): void => {
    if (scope) return
    if (
      (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    ) {
      scope = node
      return
    }
    ts.forEachChild(node, find)
  }
  find(source)
  if (!scope) throw new Error(`${name} not found in App.tsx`)
  return scope
}

/** Every piece of text a person can see inside `node`: string literals,
 *  template pieces and JSX text, whitespace collapsed. Comments are not
 *  nodes, so they are never read. */
function visibleText(node: ts.Node): string[] {
  const out: string[] = []
  const walk = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(n.text)
    else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) out.push(n.text)
    else if (ts.isJsxText(n)) {
      const t = n.text.replace(/\s+/g, ' ').trim()
      if (t) out.push(t)
    }
    ts.forEachChild(n, walk)
  }
  walk(node)
  return out
}

/** The JSX text of `node` joined into running prose, so a sentence split
 *  across source lines (or around an entity) reads as one. */
function prose(node: ts.Node): string {
  return visibleText(node).join(' ').replace(/\s+/g, ' ')
}

describe('reading App.tsx at all', () => {
  it('finds the steps it guards', () => {
    // A scan that finds nothing is a claim to check, not a result.
    for (const name of ['StepIdentify', 'StepFinish']) {
      expect(() => scopeOf(name)).not.toThrow()
    }
    expect(visibleText(scopeOf('StepIdentify')).length).toBeGreaterThan(5)
  })

  it('stops at the account: no step connects a system, scans or connects Gmail', () => {
    // The wizard's PMS, live-updates, scan and Gmail steps went on 2026-11-07
    // (founder; ADR-one-product decision 5): setup continues in the app.
    for (const name of ['StepPms', 'StepBuildium', 'StepRentvine', 'StepLive', 'StepScan', 'StepChannels']) {
      expect(() => scopeOf(name)).toThrow()
    }
    expect(prose(source)).not.toMatch(/Buildium|Rentvine/)
  })

  it('says nothing of the Buildium assistant on its screens', () => {
    // The last screen named "Gmail" in the checklist, and its side panel
    // promised "each event comes with a drafted next step" (founder,
    // 2026-11-13: remove both). The first said "14 days free": the books are
    // free, and only the AI add-on has a trial.
    const words = prose(source)
    expect(words).not.toMatch(/Gmail|drafted next step|each event/i)
    expect(words).not.toMatch(/14 days|free trial/i)
    expect(prose(scopeOf('StepFinish'))).toMatch(/Getting started checklist/)
    expect(prose(scopeOf('StepIdentify'))).toMatch(/Free to use, no card/)
  })
})

describe('the addresses the wizard sends people to', () => {
  it('uses team@, the one address the site has confirmed', () => {
    // support@ is not confirmed to receive mail (the TODO in Contact.tsx).
    // Every mailto that NAMES an address must be team@: the finish step's
    // setup help and the footer, since the wizard stops at the account.
    const mailtos = visibleText(source).filter((t) => t.startsWith('mailto:') && !t.startsWith('mailto:?'))
    expect(mailtos.length).toBeGreaterThanOrEqual(2)
    expect(mailtos.filter((m) => !m.startsWith('mailto:team@occupella.com'))).toEqual([])
    expect(prose(source)).not.toMatch(/support@occupella\.com/)
  })
})

/** The event names `WizardEvents` declares, read from lib/analytics.ts. */
function declaredEvents(): string[] {
  const sf = ts.createSourceFile('analytics.ts', analyticsSource, ts.ScriptTarget.Latest, true)
  const names: string[] = []
  const walk = (n: ts.Node): void => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === 'WizardEvents') {
      for (const m of n.members) if (m.name && ts.isIdentifier(m.name)) names.push(m.name.text)
      return
    }
    ts.forEachChild(n, walk)
  }
  walk(sf)
  return names
}

/** Every `captureWizard(...)` call in App.tsx. */
function wizardCalls(): ts.CallExpression[] {
  const out: ts.CallExpression[] = []
  const walk = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'captureWizard') out.push(n)
    ts.forEachChild(n, walk)
  }
  walk(source)
  return out
}

describe('where the wizard events are fired', () => {
  const declared = declaredEvents()
  const calls = wizardCalls()
  const fired = calls.map((c) => (c.arguments[0] as ts.StringLiteral).text)

  it('reads both sides at all', () => {
    expect(declared).toEqual(['wizard_step_viewed', 'wizard_account_created'])
    expect(calls.length).toBeGreaterThan(0)
  })

  it('fires every declared event, each from exactly one place', () => {
    // An event declared and never fired is a funnel step that reads as zero
    // people; one fired from two places double-counts.
    for (const name of declared) {
      expect(fired.filter((f) => f === name), `${name} call sites`).toHaveLength(1)
    }
    expect(fired.filter((f) => !declared.includes(f))).toEqual([])
  })

  it('never passes person data, keys or free text', () => {
    // The types already refuse most of this; this catches a cast.
    const forbidden = new Set([
      'email',
      'userEmail',
      'workspace',
      'workspaceName',
      'name',
      'apiKey',
      'apiSecret',
      'secret',
      'accountCode',
      'otherName',
      'note',
      'password',
      'returningAs',
    ])
    const used: string[] = []
    for (const call of calls) {
      const walk = (n: ts.Node): void => {
        if (ts.isIdentifier(n) && forbidden.has(n.text)) used.push(`${n.text} in ${call.getText(source)}`)
        if (ts.isShorthandPropertyAssignment(n) && forbidden.has(n.name.text)) used.push(n.name.text)
        ts.forEachChild(n, walk)
      }
      call.arguments.forEach(walk)
    }
    expect(used).toEqual([])
  })
})

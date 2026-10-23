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

/** `a.b.c` property-access chains used inside `node`, as text. */
function propertyChains(node: ts.Node): string[] {
  const out: string[] = []
  const walk = (n: ts.Node): void => {
    if (ts.isPropertyAccessExpression(n)) out.push(n.getText(source))
    ts.forEachChild(n, walk)
  }
  walk(node)
  return out
}

describe('reading App.tsx at all', () => {
  it('finds the steps it guards', () => {
    // A scan that finds nothing is a claim to check, not a result.
    for (const name of ['StepBuildium', 'StepPms', 'StepChannels', 'handoffInstructions']) {
      expect(() => scopeOf(name)).not.toThrow()
    }
    expect(visibleText(scopeOf('handoffInstructions')).length).toBeGreaterThan(5)
  })
})

/** Names called inside `node` (bare identifiers only, like `foo(...)`). */
function callsIn(node: ts.Node): Set<string> {
  const called = new Set<string>()
  const walk = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) called.add(n.expression.text)
    ts.forEachChild(n, walk)
  }
  walk(node)
  return called
}

describe('the email step connects Gmail, and says only that', () => {
  const step = scopeOf('StepChannels')

  it('starts the Gmail grant and reads back Gmail alone', () => {
    expect(visibleText(step)).toContain('/api/v1/connectors/gmail/connect')
    // The Connected tick is decided by the helper that ignores Calendar and
    // Drive (lib/google.test.ts), not by an inline any-of-three check.
    expect(callsIn(step)).toContain('gmailConnected')
    const otherGrants = visibleText(step).filter((t) => t === 'google_calendar' || t === 'google_drive')
    expect(otherGrants).toEqual([])
  })

  it('does not promise Calendar or Drive from this button', () => {
    const text = prose(step)
    expect(text).not.toMatch(/Gmail, Calendar and Drive/)
    expect(text).toMatch(/Connect Gmail/)
    // Calendar and Drive are named only as separate connections.
    expect(text).toMatch(/Google Calendar and Google Drive are separate connections/)
  })
})

describe('"My system isn\'t listed"', () => {
  const form = scopeOf('NotListedForm')
  const picker = scopeOf('StepPms')

  it('is a tile on the system step that opens the form', () => {
    // JSX text keeps entities as written, so `&rsquo;` is matched too.
    expect(prose(picker)).toMatch(/My system isn(&rsquo;|’|')t listed/)
    // The system step renders the form, and nothing else in the file does.
    const rendersIn = (scope: ts.Node): number => {
      let n = 0
      const walk = (node: ts.Node): void => {
        if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'NotListedForm') n += 1
        ts.forEachChild(node, walk)
      }
      walk(scope)
      return n
    }
    expect(rendersIn(picker)).toBe(1)
    expect(rendersIn(source)).toBe(1)
  })

  it('sends through the shared fetch helper to the feedback route, with the helper-built body', () => {
    const calls = callsIn(form)
    expect(calls).toContain('apiFetch')
    expect(calls).toContain('notListedBody')
    expect(calls).toContain('notListedReady')
    // The path is the constant matched to feedback.py, not a second copy.
    expect(form.getText(source)).toContain('FEEDBACK_PATH')
  })

  it('passes step 1’s doors answer down, instead of dropping it', () => {
    let passed = false
    const walk = (n: ts.Node): void => {
      if (ts.isJsxAttribute(n) && n.name.getText(source) === 'doors') {
        const el = n.parent.parent
        if ((ts.isJsxSelfClosingElement(el) || ts.isJsxOpeningElement(el)) && el.tagName.getText(source) === 'StepPms') passed = true
      }
      ts.forEachChild(n, walk)
    }
    walk(source)
    expect(passed, '<StepPms doors={...}> is not passed the doors range').toBe(true)
  })

  it('shows the thank-you only from the success path', () => {
    // `setSent(true)` must sit in the try, after the awaited POST, and
    // never in the catch: a thank-you on a failed send is the defect the
    // app's own feedback dialog shipped once.
    const sets: { inTry: boolean; inCatch: boolean }[] = []
    const walk = (n: ts.Node, inTry: boolean, inCatch: boolean): void => {
      if (ts.isTryStatement(n)) {
        walk(n.tryBlock, true, inCatch)
        if (n.catchClause) walk(n.catchClause, inTry, true)
        if (n.finallyBlock) walk(n.finallyBlock, inTry, inCatch)
        return
      }
      if (ts.isCallExpression(n) && n.expression.getText(source) === 'setSent') sets.push({ inTry, inCatch })
      ts.forEachChild(n, (c) => walk(c, inTry, inCatch))
    }
    walk(form, false, false)
    expect(sets).toEqual([{ inTry: true, inCatch: false }])
  })

  it('promises nothing about adding support', () => {
    expect(prose(form)).not.toMatch(/waitlist|coming soon|we will add|we(&rsquo;|’|')ll (add|let)|notify you/i)
  })
})

describe('the Buildium step when the keys do not work', () => {
  const step = scopeOf('StepBuildium')

  it('routes a failed test through the readable-sentence helper', () => {
    // A bare `testData.error` here is the raw "Buildium 401 /rentals: ..."
    // text on screen again (lib/buildium.test.ts pins the sentence).
    expect(callsIn(step)).toContain('buildiumTestFailure')
  })

  it('says, hedged, that API access depends on the Buildium plan', () => {
    const text = prose(step)
    expect(text).toMatch(/only offers API keys on some of its plans/)
    expect(text).toMatch(/may not include API access/)
    // Not verified which plans, so none is named and no price is given.
    expect(text).not.toMatch(/\$\d/)
  })
})

describe('the addresses the wizard sends people to', () => {
  it('uses team@, the one address the site has confirmed', () => {
    // support@ is not confirmed to receive mail (the TODO in Contact.tsx).
    // `mailto:?subject=` is the admin hand-off: no address, the person picks
    // their admin. Every mailto that NAMES an address must be team@.
    const mailtos = visibleText(source).filter((t) => t.startsWith('mailto:') && !t.startsWith('mailto:?'))
    expect(mailtos.length).toBeGreaterThan(2)
    expect(mailtos.filter((m) => !m.startsWith('mailto:team@occupella.com'))).toEqual([])
    expect(prose(source)).not.toMatch(/support@occupella\.com/)
  })
})

describe('the admin hand-off email', () => {
  const email = scopeOf('handoffInstructions')

  it('never sends the admin to /start, which would create a second workspace', () => {
    // /start always bootstraps a NEW user and company. An admin who finished
    // setup there connected Buildium to a workspace of their own, and the
    // requester's connect was then refused as already connected elsewhere.
    expect(visibleText(email).filter((t) => t.includes('/start'))).toEqual([])
    expect(propertyChains(email).filter((c) => c.startsWith('window.location'))).toEqual([])
  })

  it('ends with the keys going back to the person who asked', () => {
    const text = visibleText(email).join('')
    expect(text).toMatch(/Send both back to me securely/)
    expect(text).toMatch(/no need to sign up yourself/)
  })

  it('the panel promises neither a link back nor saved progress', () => {
    const panel = prose(scopeOf('StepBuildium'))
    expect(panel).not.toMatch(/link back here/i)
    expect(panel).not.toMatch(/progress is saved/i)
  })
})

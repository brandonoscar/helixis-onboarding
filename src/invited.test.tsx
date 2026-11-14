// @vitest-environment jsdom
/**
 * The owner and tenant invite page (/invited, Invited.tsx, lib/invite.ts).
 *
 * What has to hold, in the format agreed with the app (AgenticHelixis
 * docs/plans/one-login-one-ui.md, the portal sign-in note):
 *
 *   · the token is read from the fragment as the PMS makes it (20 to 100 URL-safe characters),
 *     and leaves the address at once, before analytics or any other script can read it;
 *   · it is kept in memory only, and leaves the page in the hand-off fragment alone: the /start
 *     hand-off's keys and `books_invite`;
 *   · a new account is marked as a portal person, and nothing here makes a company;
 *   · /invited reaches the app shell (never indexed, never in the sitemap), and is counted as
 *     itself, not as a 404.
 */
import ts from 'typescript'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import invitedSource from './Invited.tsx?raw'
import inviteSource from './lib/invite.ts?raw'
import mainSource from './main.tsx?raw'
import appSource from './App.tsx?raw'
import vercelJson from '../vercel.json'

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}))
const released = vi.hoisted(() => vi.fn())
vi.mock('./lib/supabase', () => ({ supabase: { auth }, releaseSessionForHandOff: released }))

import Invited, { SAY } from './Invited'
import {
  HAND_OFF_KEY,
  handOffUrl,
  INVITE_TOKEN,
  isInvitedPath,
  PORTAL_METADATA,
  readArrival,
  takeInviteFromUrl,
} from './lib/invite'
import { pageName } from './lib/analytics'
import { routingProblems, type VercelConfig } from './seo/vercelRouting'
import { CLIENT_ONLY_PREFIXES, MARKETING_ROUTES } from './seo/routes'

// 43 characters, as secrets.token_urlsafe(32) makes one. Synthetic.
const TOKEN = 'Xh3_fake-invite-token-000000000000000000Qe0'

describe('reading the fragment', () => {
  it('finds a token the PMS makes', () => {
    expect(TOKEN).toHaveLength(43)
    expect(readArrival(`#${TOKEN}`)).toEqual({ kind: 'invite', token: TOKEN })
  })

  it.each([
    ['too short', 'a'.repeat(19)],
    ['too long', 'a'.repeat(101)],
    ['not URL-safe', `${'a'.repeat(30)}+/=`],
    ['a key and value', `books_invite=${TOKEN}`],
    ['empty', ''],
  ])('calls one that is %s broken', (_why, fragment) => {
    expect(readArrival(`#${fragment}`)).toEqual({ kind: 'broken' })
  })

  it('takes the PMS bounds exactly', () => {
    expect(INVITE_TOKEN.test('a'.repeat(20))).toBe(true)
    expect(INVITE_TOKEN.test('a'.repeat(100))).toBe(true)
    // The app's pattern is the same (AgenticHelixis frontend/src/services/booksInvite.ts).
    expect(INVITE_TOKEN.source).toBe('^[A-Za-z0-9_-]{20,100}$')
  })

  it('knows the emailed sign-in link, which carries a session and no invite', () => {
    expect(readArrival('#access_token=a.b.c&refresh_token=r&type=magiclink')).toEqual({ kind: 'sign-in-link' })
    expect(readArrival('#error_description=Email+link+is+invalid')).toEqual({ kind: 'sign-in-link' })
  })

  it('takes the fragment out of the address at once, whatever it held', () => {
    const replaceState = vi.fn()
    expect(takeInviteFromUrl({ hash: `#${TOKEN}`, pathname: '/invited' }, { replaceState })).toEqual({
      kind: 'invite',
      token: TOKEN,
    })
    expect(replaceState).toHaveBeenCalledWith(null, '', '/invited')
    replaceState.mockClear()
    takeInviteFromUrl({ hash: '#access_token=a.b.c&refresh_token=r', pathname: '/invited' }, { replaceState })
    expect(replaceState).toHaveBeenCalledWith(null, '', '/invited')
    replaceState.mockClear()
    takeInviteFromUrl({ hash: '', pathname: '/invited' }, { replaceState })
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('answers on /invited and under it only', () => {
    expect(isInvitedPath('/invited')).toBe(true)
    expect(isInvitedPath('/invited/x')).toBe(true)
    expect(isInvitedPath('/invitedx')).toBe(false)
    expect(isInvitedPath('/start')).toBe(false)
  })
})

describe('the hand-off', () => {
  const session = { access_token: 'a.b.c', refresh_token: 'r-1', expires_in: 3600, expires_at: 1, token_type: 'bearer' }

  it("is /start's fragment with the invite beside it, never a query", () => {
    const url = handOffUrl('https://app.occupella.com', session, TOKEN)
    expect(url.startsWith('https://app.occupella.com/#')).toBe(true)
    expect(url).not.toContain('?')
    const frag = new URLSearchParams(url.split('#')[1])
    expect(Object.fromEntries(frag)).toEqual({
      access_token: 'a.b.c',
      refresh_token: 'r-1',
      expires_in: '3600',
      token_type: 'bearer',
      expires_at: '1',
      books_invite: TOKEN,
    })
    expect(HAND_OFF_KEY).toBe('books_invite')
  })

  it("carries every key /start's hand-off sends (App.tsx StepFinish)", () => {
    // Read from the syntax tree: the keys of the URLSearchParams /start builds.
    const sf = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const keys = new Set<string>()
    const visit = (node: ts.Node) => {
      if (ts.isNewExpression(node) && node.expression.getText(sf) === 'URLSearchParams') {
        const arg = node.arguments?.[0]
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const p of arg.properties) if (p.name) keys.add(p.name.getText(sf))
        }
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'set' &&
        node.expression.expression.getText(sf) === 'frag' &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        keys.add(node.arguments[0].text)
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
    expect(keys.size).toBeGreaterThanOrEqual(4)
    const ours = new URLSearchParams(handOffUrl('https://app.occupella.com', session, TOKEN).split('#')[1])
    for (const key of keys) expect(ours.has(key), key).toBe(true)
  })
})

// ── the token's path through the code ────────────────────────────────

function sourceFile(name: string, text: string) {
  return ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function walk(node: ts.Node, visit: (n: ts.Node) => void) {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

describe('the token never lands anywhere but the hand-off', () => {
  it('neither file touches storage, cookies, the console or a query string', () => {
    for (const [name, text] of [['Invited.tsx', invitedSource], ['lib/invite.ts', inviteSource]] as const) {
      const sf = sourceFile(name, text)
      const touched: string[] = []
      walk(sf, (n) => {
        if (ts.isIdentifier(n) && ['localStorage', 'sessionStorage', 'console'].includes(n.text)) touched.push(n.text)
        if (ts.isPropertyAccessExpression(n) && ['cookie', 'search'].includes(n.name.text)) touched.push(n.getText(sf))
      })
      expect(touched, name).toEqual([])
    }
  })

  it("the page passes the token to handOffUrl and nowhere else", () => {
    const sf = sourceFile('Invited.tsx', invitedSource)
    const uses: string[] = []
    walk(sf, (n) => {
      if (ts.isPropertyAccessExpression(n) && n.name.text === 'token' && n.expression.getText(sf) === 'arrival') {
        const call = n.parent
        uses.push(ts.isCallExpression(call) ? call.expression.getText(sf) : n.parent.getText(sf))
      }
    })
    expect(uses).toEqual(['handOffUrl'])
  })

  it('main.tsx takes it out of the address before analytics or any tracker starts', () => {
    const sf = sourceFile('main.tsx', mainSource)
    const order: string[] = []
    walk(sf, (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) order.push(n.expression.text)
    })
    const take = order.indexOf('takeInviteFromUrl')
    expect(take, 'takeInviteFromUrl is not called in main.tsx').toBeGreaterThan(-1)
    for (const later of ['initAnalytics', 'watchStartClicks', 'maybeLoadVisitorTracker', 'createRoot']) {
      expect(order.indexOf(later), later).toBeGreaterThan(take)
    }
  })
})

// ── the page ─────────────────────────────────────────────────────────

let root: Root | null = null
let host: HTMLDivElement
const replace = vi.fn()

beforeEach(() => {
  auth.signInWithOtp.mockReset().mockResolvedValue({ error: null })
  auth.verifyOtp.mockReset()
  released.mockReset()
  replace.mockReset()
  host = document.createElement('div')
  document.body.appendChild(host)
  vi.stubGlobal('location', { ...window.location, origin: 'https://occupella.com', replace })
})

afterEach(() => {
  act(() => root?.unmount())
  root = null
  host.remove()
  vi.unstubAllGlobals()
})

async function show(arrival: Parameters<typeof Invited>[0]['arrival']) {
  await act(async () => {
    root = createRoot(host)
    root.render(<Invited arrival={arrival} />)
  })
}

async function type(selector: string, value: string) {
  const input = host.querySelector(selector) as HTMLInputElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function submit() {
  await act(async () => {
    ;(host.querySelector('form') as HTMLFormElement).requestSubmit()
  })
}

describe('the page', () => {
  it('signs up or in with an emailed code, marks a new account, and hands off with the invite', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: { session: { access_token: 'a.b.c', refresh_token: 'r-1', expires_in: 3600, token_type: 'bearer' } },
      error: null,
    })
    await show({ kind: 'invite', token: TOKEN })
    expect(host.textContent).toContain(SAY.lead)
    expect(host.textContent).toContain(SAY.emailHint)

    await type('#inv-email', 'tenant@example.com')
    await submit()
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'tenant@example.com',
      options: { emailRedirectTo: 'https://occupella.com/invited', data: { occupella_portal: true } },
    })
    expect(PORTAL_METADATA).toEqual({ occupella_portal: true })
    expect(host.textContent).toContain(SAY.codeSent('tenant@example.com'))

    await type('#inv-code', '123 456')
    await submit()
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'tenant@example.com', token: '123456', type: 'email' })
    expect(released).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledTimes(1)
    const url = String(replace.mock.calls[0][0])
    expect(url.startsWith('https://app.occupella.com/#')).toBe(true)
    expect(new URLSearchParams(url.split('#')[1]).get('books_invite')).toBe(TOKEN)
  })

  it('says a wrong code is wrong and hands nothing off', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'Token has expired or is invalid' } })
    await show({ kind: 'invite', token: TOKEN })
    await type('#inv-email', 'tenant@example.com')
    await submit()
    await type('#inv-code', '000000')
    await submit()
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(SAY.wrongCode)
    expect(replace).not.toHaveBeenCalled()
    expect(released).not.toHaveBeenCalled()
  })

  it('says a broken link is broken, and asks for no email', async () => {
    await show({ kind: 'broken' })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(SAY.broken)
    expect(host.querySelector('input')).toBeNull()
  })

  it('says the emailed sign-in link cannot carry the invite', async () => {
    await show({ kind: 'sign-in-link' })
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(SAY.signInLink)
    expect(host.querySelector('input')).toBeNull()
  })

  it('never reaches the backend: no workspace bootstrap, no company (read from its imports)', () => {
    const sf = sourceFile('Invited.tsx', invitedSource)
    const imports = sf.statements
      .filter(ts.isImportDeclaration)
      .map((d) => (d.moduleSpecifier as ts.StringLiteral).text)
      .sort()
    expect(imports).toEqual(['./Site', './lib/invite', './lib/supabase', './lib/urls', 'react'])
  })
})

// ── where /invited is served, and how it is counted ──────────────────

describe('serving and counting /invited', () => {
  const BUILT = new Set(['index.html', '404.html', 'app-shell.html', 'robots.txt', 'sitemap.xml', 'llms.txt'])
  for (const r of MARKETING_ROUTES) BUILT.add(r.path === '/' ? 'index.html' : `${r.path.slice(1)}.html`)
  const paths = MARKETING_ROUTES.map((r) => r.path)

  it('reaches the app shell, bare and below', () => {
    expect(CLIENT_ONLY_PREFIXES).toContain('/invited')
    expect(routingProblems(vercelJson as VercelConfig, BUILT, paths, CLIENT_ONLY_PREFIXES)).toEqual([])
  })

  it('would be caught without its rewrites', () => {
    const without: VercelConfig = {
      ...(vercelJson as VercelConfig),
      rewrites: (vercelJson as VercelConfig).rewrites?.filter((r) => !r.source.startsWith('/invited')),
    }
    const problems = routingProblems(without, BUILT, paths, CLIENT_ONLY_PREFIXES)
    expect(problems.some((p) => p.startsWith('/invited '))).toBe(true)
    expect(problems.some((p) => p.startsWith('/invited/callback '))).toBe(true)
  })

  it('is no marketing page: never prerendered, never in the sitemap', () => {
    expect(MARKETING_ROUTES.some((r) => r.path.startsWith('/invited'))).toBe(false)
  })

  it('is counted as itself, never as a 404', () => {
    expect(pageName('/invited')).toBe('invited')
    expect(pageName('/invitedx')).toBe('not_found')
  })
})

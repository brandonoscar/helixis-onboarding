import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { APP_ORIGIN, authFlowInHash, rescueAuthLanding } from './authRescue'

/**
 * The marketing site can be handed a live Supabase session by mistake.
 *
 * `POST /company/invite` asks GoTrue to send the invitee to the app. GoTrue
 * honours that only if the URL is allowlisted on the Supabase project, and
 * otherwise falls back to the Site URL WITHOUT erroring — which since the
 * 2026-09-15 swap can be this site. So the two properties worth guarding are
 * that a misrouted landing reaches the app, and that an ordinary fragment is
 * left alone.
 *
 * ⚠ The third is an ORDERING property no behavioural test can observe: the
 * forward has to happen before analytics initialises, because posthog builds
 * `$current_url` from `location.href` and would otherwise ship an access token
 * to a third party. That one is a source scan.
 */

function fakeLocation(hash: string) {
  return {
    hash,
    href: 'https://occupella.com/' + hash,
    replace: vi.fn(),
    assign: vi.fn(),
  } as unknown as Location & { replace: ReturnType<typeof vi.fn>; assign: ReturnType<typeof vi.fn> }
}

describe('recognising a Supabase auth landing', () => {
  // These are the shapes GoTrue actually produces, and they are the same ones
  // the app's own parser matches. Both repos have to agree; nothing can check
  // that automatically, so the cases are written out here too.
  it.each([
    ['#access_token=abc&expires_in=3600&type=invite', 'invite'],
    ['#access_token=abc&type=recovery', 'recovery'],
    ['#type=invite', 'invite'],
    ['#refresh_token=x&type=recovery&token_type=bearer', 'recovery'],
  ])('%s → %s', (hash, expected) => {
    expect(authFlowInHash(hash)).toBe(expected)
  })

  // The other direction, and it is the one that breaks the site if it is
  // wrong: a rescue that swallowed every fragment would hijack the first
  // anchor link anybody adds.
  it.each([
    '',
    '#',
    '#pricing',
    '#faq',
    '#type=signup',
    '#typeinvite',
    '#mytype=invite-ish',
  ])('leaves %s alone', (hash) => {
    expect(authFlowInHash(hash)).toBeNull()
  })
})

describe('forwarding', () => {
  it('sends an invite landing to the app, fragment intact', () => {
    const loc = fakeLocation('#access_token=abc&type=invite')
    expect(rescueAuthLanding(loc)).toBe(true)
    expect(loc.replace).toHaveBeenCalledWith(
      'https://app.occupella.com/#access_token=abc&type=invite',
    )
  })

  it('uses replace, never assign', () => {
    // Back must not return somebody to a page that cannot sign them in,
    // holding a token that may by then be spent.
    const loc = fakeLocation('#type=recovery')
    rescueAuthLanding(loc)
    expect(loc.replace).toHaveBeenCalledTimes(1)
    expect(loc.assign).not.toHaveBeenCalled()
  })

  it('does not navigate on an ordinary fragment', () => {
    const loc = fakeLocation('#pricing')
    expect(rescueAuthLanding(loc)).toBe(false)
    expect(loc.replace).not.toHaveBeenCalled()
  })

  it('ignores a destination smuggled into the URL', () => {
    // ⚠ This page is handed a live credential, which makes it the worst place
    // in the product for an open redirect. The destination is a constant, so a
    // crafted link cannot move it.
    const loc = fakeLocation(
      '#access_token=abc&type=invite&redirect_to=https://evil.example/steal',
    )
    rescueAuthLanding(loc)
    const target = loc.replace.mock.calls[0][0] as string
    expect(target.startsWith(APP_ORIGIN + '/')).toBe(true)
    expect(new URL(target).origin).toBe(APP_ORIGIN)
  })
})

describe('the ordering that keeps a token out of analytics', () => {
  // ⚠ Comments are stripped first. main.tsx now EXPLAINS this rule in prose
  // that names both functions, so a raw scan would find `initAnalytics` in the
  // comment above the call and measure the wrong position.
  const source = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

  it('forwards before analytics initialises', () => {
    const rescue = source.indexOf('rescueAuthLanding(')
    const analytics = source.indexOf('initAnalytics(')
    expect(rescue, 'rescueAuthLanding is not called in main.tsx').toBeGreaterThan(-1)
    expect(analytics, 'initAnalytics is not called in main.tsx').toBeGreaterThan(-1)
    expect(
      rescue,
      'analytics initialises before the auth fragment is forwarded — posthog ' +
        'builds $current_url from location.href, so the access token ships to ' +
        'a third party',
    ).toBeLessThan(analytics)
  })

  // ⚠ A POSITION CHECK IS SATISFIED BY A CALL THAT NEVER RUNS.
  // `if (false && rescueAuthLanding())` keeps the call exactly where the two
  // assertions above look for it, passes both, and lets every misrouted invite
  // die — which is the whole defect this file exists to prevent. So the SHAPE
  // of the condition is pinned too: the branch must turn on the call itself.
  it('gates the whole page on the call, not merely on its presence', () => {
    expect(
      /if\s*\(\s*rescueAuthLanding\(\)\s*\)/.test(source),
      'the forward is no longer the sole condition of its own branch. If that ' +
        'is deliberate, the new condition has to be one that cannot silently ' +
        'disable it — a `false &&` reads identically to the working version.',
    ).toBe(true)
  })

  it('forwards before the page renders at all', () => {
    const rescue = source.indexOf('rescueAuthLanding(')
    const render = source.indexOf('createRoot(')
    expect(rescue).toBeLessThan(render)
  })
})

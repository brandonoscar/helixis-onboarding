/**
 * A path named in a TEST is not a promise to ship a file.
 *
 * `scripts/check-assets.mjs` runs first in `npm run build`, so what it refuses
 * is what Vercel refuses to deploy. On 2026-09-15 commit 7d5e783 added this to
 * `seo.test.ts`, proving the SPA rewrite does not swallow real files:
 *
 *     for (const path of ['/assets/index-abc123.js', '/demo/inbox.mp4',
 *                         '/shots/features-1.png'])
 *
 * All three are deliberately FICTIONAL — chosen precisely because they look
 * like real assets, which is what makes them a fair test of the regex. The
 * scanner read two of them as references to files that must exist, exited 1,
 * and took `npm run build` down with it. Every deploy of the marketing site
 * failed from that commit onward, the live site froze on the previous build,
 * and there is no surface anywhere a person would see the cause: the site is
 * up, it is just months behind.
 *
 * ⚠ THE LOAD-BEARING TEST HERE IS THE THIRD ONE. A test asserting only that
 * the real assets exist passes with the exclusion deleted — the refs from
 * source files resolve either way. What has to be pinned is that the fake
 * paths ARE still named in a test file and ARE still ignored, because that is
 * the one input on which the fixed scanner and the broken one disagree.
 */

import { describe, expect, it } from 'vitest'

import checkAssetsSource from '../scripts/check-assets.mjs?raw'

/** Every `.ts`/`.tsx` under `src/`, as raw text. */
const SOURCES = import.meta.glob('./**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Everything in `public/`, at any depth. Keys only — never read. */
const PUBLIC = new Set(
  Object.keys(import.meta.glob('../public/**/*')).map((p) =>
    p.replace(/^\.\.\/public/, ''),
  ),
)

const isTest = (path: string) => /\.test\.[cm]?[jt]sx?$/.test(path)

/** The same reference shape the scanner matches: an absolute /demo or /shots path. */
function refsIn(source: string): string[] {
  return [...source.matchAll(/["'](\/(?:demo|shots)\/[^"']+)["']/g)].map(
    (m) => m[1],
  )
}

describe('the asset checker judges the site, not the tests', () => {
  it('found sources and public files to judge', () => {
    // gotchas 49/100/101 — a scan that finds zero is a claim to check, not a
    // result. Without this the two assertions below are vacuously true and
    // the file reports green while measuring the empty set.
    expect(Object.keys(SOURCES).length).toBeGreaterThan(5)
    expect(PUBLIC.size).toBeGreaterThan(3)
  })

  it('every asset the SITE names is actually in public/', () => {
    const missing: string[] = []
    for (const [path, source] of Object.entries(SOURCES)) {
      if (isTest(path)) continue
      for (const ref of refsIn(source)) {
        if (!PUBLIC.has(ref)) missing.push(`${ref} <- ${path}`)
      }
    }

    // The property the script exists for: Vite does not resolve /public
    // references, so a page pointing at a file that is not there builds
    // clean, deploys clean, and renders a dead video on the front door.
    expect(missing).toEqual([])
  })

  it('a path named ONLY in a test is not required to exist', () => {
    const namedInTests = new Set<string>()
    for (const [path, source] of Object.entries(SOURCES)) {
      if (isTest(path)) for (const ref of refsIn(source)) namedInTests.add(ref)
    }

    const fictional = [...namedInTests].filter((ref) => !PUBLIC.has(ref))

    // This is the distinguishing input, and it has to exist for the test
    // above to mean anything. `seo.test.ts` names fictional asset paths on
    // purpose; if that ever stops being true, the exclusion stops being
    // exercised and this file quietly becomes decoration — so the assertion
    // is that such a path is STILL named, not merely that nothing broke.
    expect(
      fictional.length,
      'no test names a fictional /demo or /shots path any more, so nothing ' +
        'here exercises the exclusion — re-point this at whatever does, or ' +
        'delete the exclusion and this file together',
    ).toBeGreaterThan(0)
  })

  it('and the build-time scanner skips test files too', () => {
    // The test above measures the PROPERTY; the script is what ENFORCES it at
    // build time, and the two are separate implementations that can drift.
    // This pins the line on which they would diverge — gotcha 28's both-sides
    // rule, with a node script as the second side.
    expect(checkAssetsSource).toMatch(
      /if\s*\(isTestFile\(e\.name\)\)\s*return\s*\[\]/,
    )
  })

  it("and the scanner's predicate actually recognises a test file", () => {
    // ⚠ Asserting the call site alone is NOT enough, and this is the hole a
    // mutation found in the first cut of this file. Narrowing the predicate to
    // something that matches nothing — `/\.spec\./`, say — leaves the call
    // site above untouched, passes every other assertion here, and silently
    // restores the broken build. The predicate is the half that decides, so
    // the predicate is what has to be exercised.
    //
    // It is read out of the source and RUN, rather than restated: importing
    // the `.mjs` would need a declaration file, and a second copy of the regex
    // typed into this file is the drift it is here to prevent.
    const literal = checkAssetsSource.match(/isTestFile\s*=\s*\(name\)\s*=>\s*(\/.+\/)\.test\(name\)/)
    expect(literal, 'could not find the isTestFile predicate to test').toBeTruthy()

    const body = literal![1]
    const source = body.slice(1, body.lastIndexOf('/'))
    const flags = body.slice(body.lastIndexOf('/') + 1)
    const predicate = new RegExp(source, flags)

    // Both directions (gotchas 38/51): a predicate that excluded everything
    // would pass the first half perfectly and blind the scanner entirely.
    expect(predicate.test('seo.test.ts')).toBe(true)
    expect(predicate.test('analytics.test.ts')).toBe(true)
    expect(predicate.test('ConfirmCard.test.tsx')).toBe(true)
    expect(predicate.test('main.tsx')).toBe(false)
    expect(predicate.test('Landing.tsx')).toBe(false)
    expect(predicate.test('latest.ts')).toBe(false)
  })
})

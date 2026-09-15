// @vitest-environment jsdom

/**
 * What a prospect reads when setup goes wrong.
 *
 * This is the conversion path — somebody who has typed an email address and
 * nothing else — so every message here is read by a person deciding whether
 * the product is real. Before this file, four things could reach that screen
 * and all four were shipped:
 *
 *   1. **"Failed to fetch"** — the browser's own internal error text, verbatim,
 *      via `setError(err.message)`. It names nobody, suggests nothing, and is
 *      what somebody sees when their hotel wifi drops mid-signup.
 *   2. **"Not Found"** — FastAPI's `{"detail": "Not Found"}` handed straight
 *      through. A status line is not a sentence.
 *   3. **"HTTP 500"** — the fallback when the body was not JSON.
 *   4. **Nothing at all, forever** — there was no timeout, so a stalled
 *      connection spun the button until the browser gave up, which for a hung
 *      socket is effectively never.
 *
 * The app repo fixed all four (its own `services/api.ts`). None crossed the
 * repo boundary, because they are separate checkouts and a rule learned in one
 * is invisible in the other — so these tests exist here as well as there, and
 * the messages are written for signing UP rather than for using the product.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 't' } } })) },
  },
}))

import { ApiError, STATUS_UNREACHABLE, apiFetch } from './api'

/** A response the way `fetch` hands one back. */
function response(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('not json')
      return body
    },
  } as unknown as Response
}

function setOnline(value: unknown) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true, writable: true })
}

beforeEach(() => {
  setOnline(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('a request that never reached a server', () => {
  it('does not put the browser\'s own error text on the screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    const err = await apiFetch('/x').catch((e) => e)

    // The headline assertion of this file. `err.message` goes straight to
    // `setError` in App.tsx, so whatever is here is literally what a person
    // reads while creating an account.
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).not.toContain('Failed to fetch')
    expect(err.message).not.toContain('TypeError')
    expect(err.message).toMatch(/try again/i)
    // ⚠ And it says nothing was lost. Somebody mid-signup assumes a failure
    // means starting over; the wizard is idempotent and the sentence is what
    // tells them so.
    expect(err.message).toMatch(/nothing was lost/i)
  })

  it('is status 0, which is not a successful status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const err = await apiFetch('/x').catch((e) => e)

    expect(err.status).toBe(STATUS_UNREACHABLE)
    // ⚠ AND THE LITERAL, because the line above compares the code against
    // itself — a mutation setting the constant to 200 passed it happily
    // (gotcha 45: a self-consistent function agrees with itself). 0 is the
    // value callers reason about: it is the one status that is neither a
    // success nor an HTTP error, and a constant redefined to any real status
    // silently makes a total network failure look like one.
    expect(STATUS_UNREACHABLE).toBe(0)
    expect(err.status).toBeLessThan(400)
  })

  it('blames the device only when the device says so', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))

    setOnline(false)
    const offline = await apiFetch('/x').catch((e) => e)
    setOnline(true)
    const unknown = await apiFetch('/x').catch((e) => e)

    // Two different outages need two different sentences: "your wifi died"
    // and "our server is down" are the same TypeError, and telling somebody
    // their internet is broken when ours is puts our name on their outage.
    expect(offline.message).toMatch(/offline/i)
    expect(unknown.message).not.toMatch(/offline/i)
    expect(unknown.message).toMatch(/could not reach/i)
  })

  it('does not claim offline when the browser never said', async () => {
    // ⚠ The distinguishing input for `=== false` vs `!navigator.onLine`.
    // Where the property is absent — an embedded webview, a non-browser host
    // — the loose spelling tells somebody their internet is down on no
    // evidence at all, and they go and reset a router that was fine.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    setOnline(undefined)

    const err = await apiFetch('/x').catch((e) => e)
    expect(err.message).not.toMatch(/offline/i)
  })
})

describe('a request that takes too long', () => {
  it('is abandoned rather than left spinning', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal = init.signal as AbortSignal
            signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            )
          }),
      ),
    )

    const pending = apiFetch('/x').catch((e) => e)
    await vi.advanceTimersByTimeAsync(46_000)
    const err = await pending

    expect(signal?.aborted).toBe(true)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(STATUS_UNREACHABLE)
    // Distinct from the unreachable sentence: "we could not reach you" and
    // "this is taking unusually long" send a person to different conclusions
    // about whether retrying will work.
    expect(err.message).toMatch(/too long/i)
  })

  it('covers the session lookup, not just the fetch', async () => {
    // ⚠ THE SUBTLE HALF. `getSession()` reaches the network to refresh an
    // expired token, and a hang there never reaches `fetch` at all — so a
    // deadline wrapped around the fetch alone leaves the one stall it cannot
    // see, and the button spins forever on the step right after email entry.
    // The app repo records the same shape: "the outer deadline that fires
    // when a deadlocked auth lookup never reaches the fetch".
    vi.useFakeTimers()
    const { supabase } = await import('./supabase')
    vi.mocked(supabase.auth.getSession).mockImplementationOnce(
      () => new Promise(() => {}) as never,
    )
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const pending = apiFetch('/x').catch((e) => e)
    await vi.advanceTimersByTimeAsync(46_000)

    // It has to REJECT rather than hang. Asserting the abort signal is not
    // enough: nothing is listening to it here, because fetch was never
    // reached — so the only observable property is that the promise settles.
    const err = await Promise.race([
      pending,
      new Promise((r) => setTimeout(() => r('STILL HANGING'), 0)),
    ])
    expect(err).not.toBe('STILL HANGING')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('leaves no pending abort behind on success', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(async () => response(200, {})))

    await apiFetch('/x')
    // A timer that survives the response would fire mid-way through the NEXT
    // step of the wizard, aborting a request that had nothing to do with it.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('can be switched off for a caller that needs it', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(async () => response(200, {})))

    await apiFetch('/x', { timeoutMs: 0 })
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('an error the backend actually explained', () => {
  it('is shown verbatim', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(403, { detail: 'This action requires the manager role.' })),
    )

    // The whole reason the suppression is a LIST rather than "ignore every
    // detail": a route that bothered to write a real sentence knows more
    // about the failure than any generic fallback can.
    const err = await apiFetch('/x').catch((e) => e)
    expect(err.message).toBe('This action requires the manager role.')
  })
})

describe('an error the backend did not explain', () => {
  it('replaces a bare HTTP reason phrase', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(404, { detail: 'Not Found' })))

    const err = await apiFetch('/x').catch((e) => e)
    expect(err.message).not.toBe('Not Found')
    expect(err.message.length).toBeGreaterThan(20)
  })

  it('replaces a non-JSON body rather than printing the status line', async () => {
    // Render's own error pages are HTML, so this is the shape of a real
    // gateway failure — and "HTTP 502" was what it used to render.
    vi.stubGlobal('fetch', vi.fn(async () => response(502)))

    const err = await apiFetch('/x').catch((e) => e)
    expect(err.message).not.toMatch(/^HTTP \d+$/)
    expect(err.message).toMatch(/our side, not yours/i)
  })

  it('replaces an empty detail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(500, { detail: '   ' })))
    const err = await apiFetch('/x').catch((e) => e)
    expect(err.message.trim().length).toBeGreaterThan(20)
  })

  it('tells 403 and 404 apart', async () => {
    // The pair this exists for. "That link expired, get a new one" and
    // "refresh and try again" are different actions, and one message for both
    // leaves somebody guessing which — which is the entire cost of the defect.
    vi.stubGlobal('fetch', vi.fn(async () => response(403, {})))
    const forbidden = await apiFetch('/x').catch((e) => e)
    vi.stubGlobal('fetch', vi.fn(async () => response(404, {})))
    const missing = await apiFetch('/x').catch((e) => e)

    expect(forbidden.message).not.toBe(missing.message)
  })

  it('never says a server fault is the visitor\'s fault', async () => {
    for (const status of [500, 502, 503, 504]) {
      vi.stubGlobal('fetch', vi.fn(async () => response(status, {})))
      const err = await apiFetch('/x').catch((e) => e)
      // A 5xx is ours. Wording that reads as their mistake, at the moment
      // they are deciding whether this product is real, is the most expensive
      // sentence on the site.
      expect(err.message, `status ${status}`).toMatch(/our side/i)
    }
  })

  it('keeps the real status on the error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(409, {})))
    const err = await apiFetch('/x').catch((e) => e)

    // Callers branch on it (App.tsx treats 409 as "already set up"), so
    // rewriting the message must not rewrite the status.
    expect(err.status).toBe(409)
  })
})

describe('nothing talks to the backend around the client', () => {
  const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  it('found the site source to judge', () => {
    // gotchas 49/100/101 — a scan that finds zero is a claim to check.
    expect(Object.keys(SOURCES).length).toBeGreaterThan(8)
  })

  it('only api.ts calls fetch against the backend', () => {
    // Basenames rather than the glob's keys: Vite normalises those and a test
    // pinned to the spelling would fail on a build-tool upgrade rather than on
    // the defect it is here for.
    const callers = Object.entries(SOURCES)
      .filter(([path]) => !path.includes('.test.'))
      .filter(([, src]) => /(?<!api)Fetch\(|[^a-zA-Z]fetch\(/.test(src))
      .map(([path]) => path.split('/').pop() as string)
      .sort()

    // ⚠ `download.ts` is the one legitimate exception and stays on the list:
    // it asks GitHub's public releases API, fails silent by design, and has
    // nothing to do with the backend. A THIRD entry is a call that skips the
    // deadline, the network branch and the message rewriting all at once —
    // and it would look completely normal in review, because `fetch` is the
    // obvious thing to reach for.
    expect(callers).toEqual(['api.ts', 'download.ts'])
  })
})

describe('signing in is still checked first', () => {
  it('reports a missing session as 401, not as unreachable', async () => {
    const { supabase } = await import('./supabase')
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as never)
    vi.stubGlobal('fetch', vi.fn())

    const err = await apiFetch('/x').catch((e) => e)
    // ⚠ The ApiError thrown INSIDE the try must survive the catch that wraps
    // fetch failures, or a plain "not signed in" would be reported as a
    // network outage and send somebody to check their wifi.
    expect(err.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })
})

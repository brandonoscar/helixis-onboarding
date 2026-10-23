import { describe, expect, it } from 'vitest'

import { BUILDIUM_KEYS_REFUSED, buildiumRefusalStatus, buildiumTestFailure } from './buildium'

/**
 * The backend's `error`, built exactly as AgenticHelixis builds it:
 * `f"Buildium rejected the request: {exc}"` around
 * `BuildiumApiError.__str__` = `f"Buildium {status} {path}: {message}"`.
 */
const refused = (status: number, body = '{"UserMessage":"Unauthorized"}') =>
  `Buildium rejected the request: Buildium ${status} /rentals: ${body}`

describe("reading Buildium's status out of a failed test", () => {
  it('finds it in the backend sentence', () => {
    expect(buildiumRefusalStatus(refused(401))).toBe(401)
    expect(buildiumRefusalStatus(refused(403))).toBe(403)
    expect(buildiumRefusalStatus(refused(404, 'Not Found'))).toBe(404)
  })

  it('finds nothing in sentences that are not a Buildium refusal', () => {
    // Status 0 is the client's "network error after N attempts", not HTTP.
    expect(buildiumRefusalStatus('Buildium rejected the request: Buildium 0 /rentals: Network error after 3 attempts')).toBeNull()
    expect(buildiumRefusalStatus('Network error: timed out')).toBeNull()
    expect(buildiumRefusalStatus('No saved credentials.')).toBeNull()
    // The number has to be Buildium's, not any number in the text.
    expect(buildiumRefusalStatus('This Buildium account (ID 401) is already connected to a different Occupella workspace.')).toBeNull()
    expect(buildiumRefusalStatus(null)).toBeNull()
    expect(buildiumRefusalStatus(undefined)).toBeNull()
    expect(buildiumRefusalStatus(401)).toBeNull()
  })
})

describe('what the Buildium step shows when the test fails', () => {
  it('says the keys were refused, in words, for a 401 or a 403', () => {
    for (const status of [401, 403]) {
      const shown = buildiumTestFailure(refused(status))
      expect(shown).toBe(BUILDIUM_KEYS_REFUSED)
      // None of the vendor's raw response reaches the screen.
      expect(shown).not.toMatch(/\/rentals|UserMessage|\b40[13]\b/)
    }
  })

  it('names both things the person can check, and no plan or price', () => {
    expect(BUILDIUM_KEYS_REFUSED).toMatch(/copied whole/)
    expect(BUILDIUM_KEYS_REFUSED).toMatch(/plan includes API access/)
    expect(BUILDIUM_KEYS_REFUSED).not.toMatch(/\$|\bPremium\b|\bEssential\b|\bGrowth\b/)
  })

  it("keeps the backend's own sentences as written", () => {
    const conflict =
      'This Buildium account (ID 12) is already connected to a different Occupella workspace. ' +
      'Each Buildium account can be linked to one workspace at a time.'
    expect(buildiumTestFailure(conflict)).toBe(conflict)
    expect(buildiumTestFailure(refused(404, 'Not Found'))).toBe(refused(404, 'Not Found'))
  })

  it('never shows an empty error', () => {
    expect(buildiumTestFailure(null)).toBe("Buildium didn't accept those keys.")
    expect(buildiumTestFailure('   ')).toBe("Buildium didn't accept those keys.")
  })
})

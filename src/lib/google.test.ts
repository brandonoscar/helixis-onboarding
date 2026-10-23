import { describe, expect, it } from 'vitest'

import { gmailConnected } from './google'

/** Rows shaped like `GET /api/v1/connectors/` (AgenticHelixis connectors.py). */
const row = (id: string, isConnected: boolean, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  category: 'communication',
  description: '',
  authMethod: 'oauth',
  isConnected,
  needsReauth: false,
  stateUnknown: false,
  ...extra,
})

describe('whether the Gmail step is done', () => {
  it('is done when the gmail row is connected', () => {
    expect(gmailConnected([row('gmail', true), row('google_calendar', false)])).toBe(true)
  })

  it('is NOT done when only Calendar or Drive is connected', () => {
    // Separate Composio grants. The step connects Gmail and nothing else, so
    // another Google grant says nothing about whether it worked.
    expect(gmailConnected([row('gmail', false), row('google_calendar', true), row('google_drive', true)])).toBe(false)
    expect(gmailConnected([row('google_drive', true)])).toBe(false)
  })

  it('never reads an unknown state as connected', () => {
    expect(gmailConnected([row('gmail', false, { stateUnknown: true })])).toBe(false)
    expect(gmailConnected([{ id: 'gmail', isConnected: 'true' }])).toBe(false)
    expect(gmailConnected(null)).toBe(false)
    expect(gmailConnected({ gmail: true })).toBe(false)
    expect(gmailConnected([null, 'gmail'])).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import {
  MESSAGE_MAX_CHARS,
  MESSAGE_MIN_CHARS,
  NOT_LISTED_SYSTEMS,
  NOT_LISTED_VIEW,
  notListedBody,
  notListedReady,
  type NotListedAnswer,
} from './notListed'

const answer = (over: Partial<NotListedAnswer> = {}): NotListedAnswer => ({
  system: 'AppFolio',
  otherName: '',
  note: '',
  doors: '51–200',
  ...over,
})

describe('the systems offered', () => {
  it('lists the ones people ask about, and a way to name another', () => {
    expect([...NOT_LISTED_SYSTEMS]).toEqual(['AppFolio', 'Yardi', 'Rent Manager', 'Propertyware', 'DoorLoop', 'Other'])
  })
})

describe('when the form can be sent', () => {
  it('needs a system', () => {
    expect(notListedReady(answer({ system: '' }))).toBe(false)
    expect(notListedReady(answer())).toBe(true)
  })

  it('needs Other to be named', () => {
    expect(notListedReady(answer({ system: 'Other' }))).toBe(false)
    expect(notListedReady(answer({ system: 'Other', otherName: '   ' }))).toBe(false)
    expect(notListedReady(answer({ system: 'Other', otherName: 'Buildout' }))).toBe(true)
  })

  it('does not need a note', () => {
    expect(notListedReady(answer({ note: '' }))).toBe(true)
  })
})

describe('the body sent to POST /api/v1/feedback', () => {
  it('uses only fields and values the backend accepts', () => {
    const body = notListedBody(answer())
    // feedback.py: category in ("bug","idea","other") or 400; view <= 40.
    expect(Object.keys(body).sort()).toEqual(['category', 'message', 'view'])
    expect(['bug', 'idea', 'other']).toContain(body.category)
    expect(body.view).toBe(NOT_LISTED_VIEW)
    expect(body.view.length).toBeLessThanOrEqual(40)
  })

  it('carries the system and the doors range the wizard already holds', () => {
    const { message } = notListedBody(answer({ system: 'Yardi', doors: '201–500', note: 'We use Voyager' }))
    expect(message).toContain('System: Yardi')
    expect(message).toContain('Doors under management: 201–500')
    expect(message).toContain('Note: We use Voyager')
  })

  it('names an Other system in the person’s words', () => {
    const { message } = notListedBody(answer({ system: 'Other', otherName: '  Rentec Direct ' }))
    expect(message).toContain('System: Other: Rentec Direct')
  })

  it('writes an unknown doors range as "not given", never as blank', () => {
    const { message } = notListedBody(answer({ doors: '' }))
    expect(message).toContain('Doors under management: not given')
    expect(notListedBody(answer({ note: '  ' })).message).toContain('Note: none')
  })

  it('always fits the server’s message bounds', () => {
    const huge = notListedBody(
      answer({ system: 'Other', otherName: 'x'.repeat(10_000), note: 'y'.repeat(10_000) }),
    ).message
    expect(huge.length).toBeLessThanOrEqual(MESSAGE_MAX_CHARS)
    expect(huge.length).toBeGreaterThanOrEqual(MESSAGE_MIN_CHARS)
    // Capped per field, so the system line survives a long note.
    expect(huge).toContain('System: Other: ' + 'x'.repeat(80) + '\n')
  })

  it('promises nothing about adding support', () => {
    const { message } = notListedBody(answer())
    expect(message).not.toMatch(/waitlist|coming soon|we will add|we'll add/i)
  })
})

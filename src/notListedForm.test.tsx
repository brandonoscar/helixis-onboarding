// @vitest-environment jsdom
/**
 * "My system isn't listed", driven like a person would: pick a system, send,
 * and see what the screen says.
 *
 * ⚠ The one property that matters most is behavioural: a send that FAILED
 * must never show the thank-you. The app's own feedback dialog shipped that
 * defect once (its fetch resolved on a 422 and the dialog said "Sent"), so
 * the structural check in wizard.test.ts is backed by this one, which rejects
 * the request and reads the page.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ apiFetch: vi.fn(), apiJson: vi.fn() }))
vi.mock('./lib/api', () => ({
  ...api,
  APP_URL: 'https://app.occupella.com',
  BUILDIUM_WEBHOOK_URL: 'https://api.example/webhooks/buildium',
}))
vi.mock('./lib/supabase', () => ({ supabase: { auth: {} }, releaseSessionForHandOff: vi.fn() }))

import { NotListedForm } from './App'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let host: HTMLDivElement

beforeEach(() => {
  api.apiFetch.mockReset()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

function render(onContinue = vi.fn()) {
  act(() => root.render(<NotListedForm doors="51–200" onContinue={onContinue} />))
  return onContinue
}

/** Set a controlled field the way a browser does, so React's onChange runs. */
function choose(el: HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = Object.getPrototypeOf(el) as object
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
}

const sendButton = () => [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Send')!

async function clickSend() {
  await act(async () => {
    sendButton().click()
  })
}

describe('sending which system they use', () => {
  it('cannot be sent before a system is picked, or before Other is named', () => {
    render()
    expect(sendButton().disabled).toBe(true)
    act(() => choose(host.querySelector('select')!, 'Other'))
    expect(sendButton().disabled).toBe(true)
    act(() => choose(host.querySelector<HTMLInputElement>('#ob-nl-other')!, 'Buildout'))
    expect(sendButton().disabled).toBe(false)
  })

  it('posts to the feedback route with the system and the doors range', async () => {
    api.apiFetch.mockResolvedValueOnce(new Response('{"ok":true}'))
    render()
    act(() => choose(host.querySelector('select')!, 'AppFolio'))
    act(() => choose(host.querySelector('textarea')!, 'About 40 owners'))
    await clickSend()

    expect(api.apiFetch).toHaveBeenCalledTimes(1)
    const [path, init] = api.apiFetch.mock.calls[0]
    expect(path).toBe('/api/v1/feedback')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.category).toBe('idea')
    expect(body.message).toContain('System: AppFolio')
    expect(body.message).toContain('Doors under management: 51–200')
    expect(body.message).toContain('Note: About 40 owners')
  })

  it('shows the failure and NO thank-you when the send fails', async () => {
    api.apiFetch.mockRejectedValueOnce(new Error('We could not reach Occupella just now. Try again in a moment — nothing was lost.'))
    const onContinue = render()
    act(() => choose(host.querySelector('select')!, 'Yardi'))
    await clickSend()

    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/could not reach Occupella/)
    expect(host.textContent).not.toMatch(/Thanks/)
    expect(host.querySelector('[role="status"]')).toBeNull()
    // Still on the form, so they can try again.
    expect(sendButton().disabled).toBe(false)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('thanks them after a send that worked, promising nothing, and continues on the skip path', async () => {
    api.apiFetch.mockResolvedValueOnce(new Response('{"ok":true}'))
    const onContinue = render()
    act(() => choose(host.querySelector('select')!, 'DoorLoop'))
    await clickSend()

    const status = host.querySelector('[role="status"]')?.textContent ?? ''
    expect(status).toMatch(/Thanks/)
    expect(status).not.toMatch(/waitlist|soon|support|notify|add/i)
    const next = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Continue')!
    act(() => next.click())
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('falls back to a sentence when the error carries none', async () => {
    api.apiFetch.mockRejectedValueOnce({})
    render()
    act(() => choose(host.querySelector('select')!, 'Rent Manager'))
    await clickSend()
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/didn't send/)
  })
})

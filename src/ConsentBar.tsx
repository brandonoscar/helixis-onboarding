/**
 * The consent bar for third-party visitor identification.
 *
 * ⚠ IT ONLY APPEARS IN CONSENT MODE, and that is the design rather than an
 * optimisation. `lib/visitorTracking.ts` explains the two modes; the short
 * version is that company-level firmographics need NOTICE (a privacy policy
 * that says so, plus one click to decline — the footer link), while
 * person-level identification needs a real gate. Putting a bar on the front
 * door for tracking that is merely firmographic trains people to dismiss the
 * one that matters, which is how a consent mechanism stops meaning anything.
 *
 * ⚠ NOT A BLOCKING MODAL. This is the first thing a prospect sees, and a
 * dialog they must dismiss before reading a word is a worse first impression
 * than the tracking is worth. It sits at the bottom, the page is fully usable
 * behind it, and both buttons are one click.
 *
 * ⚠ NO DEFAULT-ON DISMISSAL. There is no "×" that means accept. A visitor who
 * scrolls past and never answers is a visitor who did not consent, and the
 * tracker stays off for them — which is exactly what makes the attestation
 * Apollo asks for true.
 */

import { useEffect, useState } from 'react'

import {
  maybeLoadVisitorTracker,
  needsConsentPrompt,
  recordChoice,
  storedChoice,
  visitorTrackingConfigured,
} from './lib/visitorTracking'

export function ConsentBar() {
  // Read the decision in an effect rather than during render: `needsConsent
  // Prompt` touches localStorage and `navigator`, and a render-time read is
  // the kind of thing that breaks the day this page is server-rendered.
  const [show, setShow] = useState(false)
  useEffect(() => setShow(needsConsentPrompt()), [])

  if (!show) return null

  function answer(choice: 'accepted' | 'declined') {
    recordChoice(choice)
    setShow(false)
    // Load immediately rather than on the next navigation. A visitor who says
    // yes and then reads three pages should be counted on all three, and the
    // first page is the one that says where they came from.
    if (choice === 'accepted') maybeLoadVisitorTracker()
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cb" role="region" aria-label="Privacy choice">
        <p className="cb-text">
          We&rsquo;d like to recognise the business you&rsquo;re visiting from, so we can tell
          which companies are looking at Occupella. This uses cookies and shares your IP
          address with our analytics provider. It is not required to use the site.{' '}
          <a href="/privacy">How we handle data</a>.
        </p>
        <div className="cb-actions">
          <button type="button" className="btn btn-ghost" onClick={() => answer('declined')}>
            No thanks
          </button>
          <button type="button" className="btn btn-primary" onClick={() => answer('accepted')}>
            That&rsquo;s fine
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * The footer opt-out — the decline that exists in BOTH modes.
 *
 * In notice mode this is the whole opt-out mechanism, and it is what makes
 * company-level firmographics honest without a bar on the front door: the
 * policy discloses, this declines, one click, on every page.
 *
 * ⚠ IT DOES NOT CLAIM TO UNDO THIS PAGE. If the tracker already loaded, that
 * page view has been sent and no link can recall it — so the confirmation
 * says the choice is remembered for this browser rather than implying a
 * retroactive erase. A control that overstates what it did is worse than one
 * that does less and says so.
 *
 * ⚠ Hidden entirely when no tracker is configured. An opt-out link for
 * tracking that is not running is a promise about nothing, and it is the kind
 * of thing that reads as boilerplate and gets ignored on the day it is real.
 */
export function TrackingOptOut() {
  const [state, setState] = useState<'hidden' | 'offer' | 'done'>('hidden')

  useEffect(() => {
    if (!visitorTrackingConfigured) return
    setState(storedChoice() === 'declined' ? 'done' : 'offer')
  }, [])

  if (state === 'hidden') return null
  if (state === 'done') {
    return <span className="lp-optout-done">Visit tracking is off for this browser</span>
  }

  return (
    <button
      type="button"
      className="lp-optout"
      onClick={() => {
        recordChoice('declined')
        setState('done')
      }}
    >
      Do not track my visit
    </button>
  )
}

const CSS = `
  .cb {
    position: fixed;
    left: 16px; right: 16px; bottom: 16px;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px;
    background: var(--canvas);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-md, 12px);
    box-shadow: 0 10px 34px rgba(14, 22, 32, 0.16);
    animation: cb-in var(--dur-reveal) var(--ease-out) both;
  }
  /* A bar that slides up under reduced-motion is the one animation on the page
     somebody is most likely to have asked not to see. */
  @media (prefers-reduced-motion: reduce) { .cb { animation: none; } }
  @keyframes cb-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .cb-text {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--ink-secondary);
  }
  .cb-text a { color: var(--iris); }
  .cb-actions { display: flex; gap: 8px; justify-content: flex-end; }

  @media (min-width: 720px) {
    .cb {
      left: 24px; right: 24px; bottom: 24px;
      flex-direction: row;
      align-items: center;
      gap: 20px;
      padding: 14px 18px;
    }
    .cb-text { flex: 1; max-width: 76ch; }
    .cb-actions { flex: none; }
  }
`

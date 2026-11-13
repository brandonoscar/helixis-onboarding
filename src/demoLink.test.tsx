// @vitest-environment node
/**
 * "Book a demo" renders only once there is a calendar link to point it at.
 *
 * The founder has no booking page yet (2026-11-13), and a button that goes
 * nowhere is worse than none. `DemoLink` reads DEMO_URL (lib/urls.ts), which
 * is left empty; its `url` parameter is how this checks both states.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { render } from './entry-server'
import { DEMO_URL } from './lib/urls'
import { DemoLink } from './Site'

describe('DemoLink', () => {
  it('renders nothing without a link', () => {
    expect(renderToStaticMarkup(<DemoLink className="btn" url="" />)).toBe('')
  })

  it('is in the header exactly when DEMO_URL is set', () => {
    // Left empty on 2026-11-13. Setting it is the whole change: the header
    // and the phone menu then carry the button.
    const html = render('/')
    if (DEMO_URL) {
      expect(html).toContain(`href="${DEMO_URL}"`)
      expect(html.split('Book a demo').length - 1).toBe(2)
    } else {
      expect(html).not.toContain('Book a demo')
    }
  })

  it('renders a secondary button to the calendar once a link is set', () => {
    const html = renderToStaticMarkup(<DemoLink className="btn btn-secondary" url="https://cal.example.com/occupella" />)
    expect(html).toBe('<a class="btn btn-secondary" href="https://cal.example.com/occupella">Book a demo</a>')
  })
})

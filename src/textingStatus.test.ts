// @vitest-environment node
/**
 * What the site calls texting's status, read from the prerendered pages.
 *
 * ⚠ "In carrier review" was the label on /features, /solutions/leasing and
 * the /integrations chip, and no carrier registration had ever been filed (a
 * 2026-10-23 audit found every SMS table in production empty). A status chip
 * is a statement of fact about today, so it now says what is true: texting is
 * not available yet. The pages are read as rendered HTML, the same bytes a
 * visitor and a crawler get, so a comment explaining the change cannot
 * satisfy or trip this.
 */
import { describe, expect, it } from 'vitest'

import { render } from './entry-server'

const PAGES = ['/features', '/solutions/leasing', '/integrations']

/** Visible text only: tags dropped, entities and whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

describe('the texting status label', () => {
  for (const path of PAGES) {
    it(`${path} says texting is not available yet, not that it is in review`, () => {
      const shown = text(render(path))
      expect(shown.length, `${path} rendered nothing`).toBeGreaterThan(500)
      expect(shown).not.toMatch(/in carrier review/i)
      expect(shown).toMatch(/not available yet/i)
    })
  }
})

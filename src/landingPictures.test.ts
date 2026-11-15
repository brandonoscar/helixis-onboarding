// @vitest-environment node
/**
 * The home page's pictures (founder, 2026-11-15: the books themselves and photos of New York).
 *
 * - Each photo is a JPEG of exactly the size its <img> declares, light enough for a first visit,
 *   and credited in public/shots/photos/CREDITS.md with where it came from and why it may be used.
 * - Each screen of the books is a 1600 x 1000 JPEG, with words a screen reader can read.
 * - A screen of a portal whose sign-in is still coming says so (the Coming chip).
 */

import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { PHOTOS, SHOT, TOUR } from './Landing'

function publicFile(sitePath: string): string {
  return fileURLToPath(new URL(`../public${sitePath}`, import.meta.url))
}

/** A baseline or progressive JPEG's width and height, from its frame header. */
function jpegSize(bytes: Buffer): { width: number; height: number } {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('not a JPEG')
  let i = 2
  while (i + 9 < bytes.length) {
    const marker = bytes[i + 1]
    const length = bytes.readUInt16BE(i + 2)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) }
    }
    i += 2 + length
  }
  throw new Error('no frame header')
}

describe("the home page's photos", () => {
  const credits = readFileSync(publicFile('/shots/photos/CREDITS.md'), 'utf8')

  for (const [key, photo] of Object.entries(PHOTOS)) {
    it(`${key} is a JPEG of the size the page reserves, under 400 KB`, () => {
      expect(jpegSize(readFileSync(publicFile(photo.src)))).toEqual({ width: photo.width, height: photo.height })
      expect(statSync(publicFile(photo.src)).size).toBeLessThan(400_000)
    })

    it(`${key} is credited, with where it came from and why it may be used`, () => {
      const name = photo.src.split('/').pop() ?? ''
      const entry = credits.split(/^## /m).find((section) => section.startsWith(name))
      expect(entry, `${name} has no section in public/shots/photos/CREDITS.md`).toBeDefined()
      expect(entry).toMatch(/Public domain/)
      expect(entry).toMatch(/https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(entry).toMatch(/https:\/\/www\.loc\.gov\/item\//)
      expect(entry).toContain('src/Landing.tsx')
      expect(photo.credit).toMatch(/Carol M\. Highsmith, Library of Congress/)
    })
  }
})

describe("the home page's screens of the books", () => {
  const screens = [...TOUR.map((r) => r.src), '/shots/books/rent-roll.jpg']

  for (const src of screens) {
    it(`${src} is a 1600 x 1000 JPEG under 200 KB`, () => {
      expect(jpegSize(readFileSync(publicFile(src)))).toEqual(SHOT)
      expect(statSync(publicFile(src)).size).toBeLessThan(200_000)
    })
  }

  it('describes each screen in words', () => {
    for (const r of TOUR) expect(r.alt.length, r.src).toBeGreaterThan(60)
  })

  it('marks a portal whose sign-in is still coming', () => {
    for (const r of TOUR.filter((r) => /portal/i.test(r.who))) expect(r.coming, r.who).toBe(true)
  })
})

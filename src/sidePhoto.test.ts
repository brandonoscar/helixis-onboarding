// @vitest-environment node
/**
 * The sign-up panel's photo (founder, 2026-11-07: "a photo of NYC" in place of
 * the product crops), read from App.tsx with the TypeScript parser and checked
 * against the file it names.
 *
 * - The file is there and is a JPEG of exactly the width and height the <img>
 *   declares, so the panel keeps its shape while the photo loads.
 * - It stays light enough for a first visit on a phone hotspot.
 * - Where it came from and why it may be used is written down beside it, so
 *   nobody has to work out the licence again before a launch.
 */

import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import appSource from './App.tsx?raw'

const source = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

/** The object literal `const SIDE_PHOTO = {...}` in App.tsx, as plain values. */
function sidePhoto(): Record<string, string | number> {
  let found: Record<string, string | number> | undefined
  const walk = (n: ts.Node): void => {
    if (found) return
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === 'SIDE_PHOTO' && n.initializer) {
      let init: ts.Expression = n.initializer
      while (ts.isAsExpression(init) || ts.isParenthesizedExpression(init)) init = init.expression
      if (!ts.isObjectLiteralExpression(init)) throw new Error('SIDE_PHOTO is not an object literal')
      found = {}
      for (const p of init.properties) {
        if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue
        if (ts.isStringLiteral(p.initializer)) found[p.name.text] = p.initializer.text
        else if (ts.isNumericLiteral(p.initializer)) found[p.name.text] = Number(p.initializer.text)
      }
      return
    }
    ts.forEachChild(n, walk)
  }
  walk(source)
  if (!found) throw new Error('SIDE_PHOTO not found in App.tsx')
  return found
}

/** A file under public/, by its site path. */
function publicFile(sitePath: string): string {
  return fileURLToPath(new URL(`../public${sitePath}`, import.meta.url))
}

/** A baseline or progressive JPEG's width and height, from its frame header. */
function jpegSize(bytes: Buffer): { width: number; height: number } {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('not a JPEG')
  let i = 2
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error(`no marker at byte ${i}`)
    const marker = bytes[i + 1]
    const length = bytes.readUInt16BE(i + 2)
    // SOF0 to SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) }
    }
    i += 2 + length
  }
  throw new Error('no frame header')
}

describe("the sign-up panel's photo", () => {
  const photo = sidePhoto()

  it('is a JPEG of exactly the size the page reserves for it', () => {
    expect(typeof photo.src).toBe('string')
    expect(photo.src).toMatch(/^\/shots\/photos\/[a-z0-9-]+\.jpg$/)
    const size = jpegSize(readFileSync(publicFile(String(photo.src))))
    expect(size).toEqual({ width: photo.width, height: photo.height })
  })

  it('is light enough for a first visit', () => {
    // Wide enough for half of a 1920-pixel screen, and under 400 KB: it is
    // the largest thing on the page.
    expect(Number(photo.width)).toBeGreaterThanOrEqual(960)
    expect(statSync(publicFile(String(photo.src))).size).toBeLessThan(400_000)
  })

  it('loads lazily, so a phone, where the panel is hidden, never downloads it', () => {
    const attrs: Record<string, string>[] = []
    const walk = (n: ts.Node): void => {
      if (ts.isJsxSelfClosingElement(n) && ts.isIdentifier(n.tagName) && n.tagName.text === 'img') {
        const found: Record<string, string> = {}
        for (const a of n.attributes.properties) {
          if (ts.isJsxAttribute(a) && ts.isIdentifier(a.name) && a.initializer && ts.isStringLiteral(a.initializer)) {
            found[a.name.text] = a.initializer.text
          }
        }
        if (found.className === 'ob-side-photo') attrs.push(found)
      }
      ts.forEachChild(n, walk)
    }
    walk(source)
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toMatchObject({ loading: 'lazy', alt: '' })
  })

  it('is credited, with where it came from and why it may be used', () => {
    const credits = readFileSync(publicFile('/shots/photos/CREDITS.md'), 'utf8')
    const name = String(photo.src).split('/').pop() ?? ''
    const entry = credits.split(/^## /m).find((section) => section.startsWith(name))
    expect(entry, `${name} has no section in public/shots/photos/CREDITS.md`).toBeDefined()
    expect(entry).toMatch(/Public domain/)
    expect(entry).toMatch(/https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
    expect(entry).toMatch(/https:\/\/www\.loc\.gov\/item\//)
    expect(photo.credit).toMatch(/Carol M\. Highsmith/)
  })
})

// @vitest-environment jsdom
/**
 * The wizard lets go of the session once the app has it, and never ends it.
 *
 * The hand-off shares one refresh token between occupella.com and
 * app.occupella.com. If this origin refreshes it after the app has, Supabase
 * sees a spent token come back, revokes the session, and the app's user is
 * signed out mid-task. See `releaseSessionForHandOff`.
 */
import ts from 'typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import appSource from '../App.tsx?raw'

const auth = vi.hoisted(() => ({
  stopAutoRefresh: vi.fn(async () => undefined),
  signOut: vi.fn(async () => ({ error: null })),
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth }) }))

import { releaseSessionForHandOff, SESSION_STORAGE_KEY } from './supabase'

beforeEach(() => {
  localStorage.clear()
  auth.stopAutoRefresh.mockClear()
  auth.signOut.mockClear()
})

describe('releasing the session after the hand-off', () => {
  it('uses the key supabase-js stores this project under', () => {
    expect(SESSION_STORAGE_KEY).toBe('sb-shwwcxkeewpotnigwvqp-auth-token')
  })

  it('removes the stored copy and stops refreshing it', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, '{"refresh_token":"r1"}')
    localStorage.setItem(`${SESSION_STORAGE_KEY}-user`, '{}')
    releaseSessionForHandOff()
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(`${SESSION_STORAGE_KEY}-user`)).toBeNull()
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not end the session the app is now holding', () => {
    releaseSessionForHandOff()
    expect(auth.signOut).not.toHaveBeenCalled()
  })
})

describe('the finish step', () => {
  const source = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let scope: ts.Node | undefined
  const find = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'StepFinish') scope = node
    ts.forEachChild(node, find)
  }
  find(source)

  const calls: string[] = []
  const walk = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) calls.push(node.expression.getText(source))
    ts.forEachChild(node, walk)
  }
  if (scope) walk(scope)

  it('releases the session on both ways out: the timer and the buttons', () => {
    expect(scope, 'StepFinish not found in App.tsx').toBeTruthy()
    expect(calls.filter((c) => c === 'releaseSessionForHandOff')).toHaveLength(3)
  })

  it('never signs out, which would end the app’s session too', () => {
    expect(calls.some((c) => c.endsWith('auth.signOut'))).toBe(false)
  })
})

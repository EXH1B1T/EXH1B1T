import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-auth-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

// https is intercepted by patch-node-modules.cjs (Module._load patch).
// The stub returns an empty response body so requestDeviceCode resolves { ok: false }.

import { requestDeviceCode, pollToken, getUser, logout } from '../../src/main/handlers/auth.js'
import { store } from '../../src/main/storage.js'

beforeAll(async () => { await fs.mkdir(TEST_DIR, { recursive: true }) })
afterAll(async () => { await fs.rm(TEST_DIR, { recursive: true, force: true }) })
// Reset the in-memory store before each test
beforeEach(() => { store.clear() })

describe('getUser', () => {
  it('returns null when no user is stored', () => {
    expect(getUser()).toBeNull()
  })

  it('returns stored user object', () => {
    store.set('user', { login: 'alice', name: 'Alice' })
    expect(getUser()).toEqual({ login: 'alice', name: 'Alice' })
  })
})

describe('logout', () => {
  it('clears token and user from store', () => {
    store.set('token', 'ghp_secret')
    store.set('user', { login: 'alice' })

    const result = logout()

    expect(result).toEqual({ ok: true })
    expect(store.get('token')).toBeUndefined()
    expect(store.get('user')).toBeUndefined()
  })

  it('is idempotent — safe to call when not logged in', () => {
    expect(() => logout()).not.toThrow()
    expect(logout().ok).toBe(true)
  })
})

describe('pollToken', () => {
  it('returns { ok: false } when no pending login exists', async () => {
    const result = await pollToken()
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/no pending login/i)
  })
})

describe('requestDeviceCode', () => {
  it('returns { ok: false } when GitHub returns an unparseable response', async () => {
    const result = await requestDeviceCode()
    expect(result.ok).toBe(false)
  })
})

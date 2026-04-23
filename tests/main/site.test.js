import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-site-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

import { getSite, saveSite } from '../../src/main/handlers/site.js'
import { PATHS } from '../../src/main/storage.js'
import { DEFAULTS } from '../../src/shared/types.js'

beforeAll(async () => {
  await fs.mkdir(path.dirname(PATHS.site), { recursive: true })
})

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true })
})

beforeEach(async () => {
  await fs.unlink(PATHS.site).catch(() => {})
})

describe('getSite', () => {
  it('returns default site object when no file exists', async () => {
    const site = await getSite()
    expect(site).toEqual(DEFAULTS.site)
  })

  it('returns saved data when file exists', async () => {
    const custom = { ...DEFAULTS.site, title: 'My Studio', lang: 'th' }
    await saveSite(custom)
    const site = await getSite()
    expect(site.title).toBe('My Studio')
    expect(site.lang).toBe('th')
  })
})

describe('saveSite', () => {
  it('writes JSON to disk and returns { ok: true }', async () => {
    const result = await saveSite({ title: 'Test Site', lang: 'en' })
    expect(result).toEqual({ ok: true })

    const raw = await fs.readFile(PATHS.site, 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed.title).toBe('Test Site')
  })

  it('creates intermediate directories if they do not exist', async () => {
    await fs.rm(path.dirname(PATHS.site), { recursive: true, force: true })
    const result = await saveSite({ title: 'Recreated' })
    expect(result.ok).toBe(true)
    const raw = await fs.readFile(PATHS.site, 'utf-8')
    expect(JSON.parse(raw).title).toBe('Recreated')
  })

  it('overwrites existing data', async () => {
    await saveSite({ title: 'First' })
    await saveSite({ title: 'Second' })
    const site = await getSite()
    expect(site.title).toBe('Second')
  })
})

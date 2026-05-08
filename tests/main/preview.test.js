import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-preview-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

import { buildPreview, getUrl } from '../../src/main/handlers/preview.js'
import { PATHS, writeJson } from '../../src/main/storage.js'

beforeAll(async () => {
  await fs.mkdir(TEST_DIR, { recursive: true })
  await fs.mkdir(path.dirname(PATHS.site), { recursive: true })
  await fs.mkdir(PATHS.albums, { recursive: true })
  await fs.mkdir(PATHS.previewDir, { recursive: true })
})
afterAll(async () => { await fs.rm(TEST_DIR, { recursive: true, force: true }) })

// ── buildPreview ──────────────────────────────────────────────────────────────

describe('buildPreview', () => {
  it('returns { ok: true } and writes index.html to previewDir', async () => {
    await writeJson(PATHS.site, {
      title: 'Test', lang: 'en',
      owner: { name: 'Test' }, social: {}, theme: { name: 'lumen', options: {} },
      home: { layout: 'grid', headline: '', subhead: '', intro: '' },
      about: { portrait: null, exhibitions: [] },
      nav: { style: 'sidebar', homeVisible: true, aboutVisible: true, hiddenAlbums: [], links: [] },
    })
    const result = await buildPreview()
    expect(result.ok).toBe(true)
    await expect(fs.access(path.join(PATHS.previewDir, 'index.html'))).resolves.toBeUndefined()
  })

  it('writes about.html to previewDir', async () => {
    await buildPreview()
    await expect(fs.access(path.join(PATHS.previewDir, 'about.html'))).resolves.toBeUndefined()
  })
})

// ── getUrl ────────────────────────────────────────────────────────────────────

describe('getUrl', () => {
  it('returns file:// URL for index.html when page is "home"', () => {
    const url = getUrl('home', null)
    expect(url).toMatch(/^file:\/\//)
    expect(url).toMatch(/index\.html$/)
    expect(url).toContain(PATHS.previewDir)
  })

  it('returns file:// URL for about.html when page is "about"', () => {
    const url = getUrl('about', null)
    expect(url).toMatch(/about\.html$/)
  })

  it('returns file:// URL for album page when albumSlug is provided', () => {
    const url = getUrl('home', 'my-album')
    expect(url).toMatch(/albums[/\\]my-album\.html$/)
  })

  it('falls back to index.html when albumSlug is null', () => {
    const url = getUrl('home', null)
    expect(url).toMatch(/index\.html$/)
  })

  it('URL paths are absolute (start with root)', () => {
    const url = getUrl('home', null)
    const filePath = url.replace(/^file:\/\//, '')
    expect(path.isAbsolute(filePath)).toBe(true)
  })
})

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'

// vi.hoisted runs before any imports — sets the test dir that electron.stub reads
const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-albums-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

import { listAlbums, getAlbum, createAlbum, updateAlbum, deleteAlbum, reorderAlbums } from '../../src/main/handlers/albums.js'
import { PATHS } from '../../src/main/storage.js'

beforeAll(async () => {
  await fs.mkdir(PATHS.albums, { recursive: true })
})

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true })
})

beforeEach(async () => {
  const files = await fs.readdir(PATHS.albums).catch(() => [])
  await Promise.all(files.map(f => fs.unlink(path.join(PATHS.albums, f))))
})

// ── listAlbums ────────────────────────────────────────────────────────────────

describe('listAlbums', () => {
  it('returns empty array when no albums exist', async () => {
    expect(await listAlbums()).toEqual([])
  })

  it('returns albums sorted by order field', async () => {
    await createAlbum({ title: 'C' })
    await createAlbum({ title: 'B' })
    await createAlbum({ title: 'A' })
    const albums = await listAlbums()
    expect(albums[0].order).toBeLessThanOrEqual(albums[1].order)
    expect(albums[1].order).toBeLessThanOrEqual(albums[2].order)
  })
})

// ── createAlbum ───────────────────────────────────────────────────────────────

describe('createAlbum', () => {
  it('creates a JSON file and returns { ok, album }', async () => {
    const result = await createAlbum({ title: 'My Album', date: '2024-06' })
    expect(result.ok).toBe(true)
    expect(result.album.slug).toBe('my-album')
    expect(result.album.date).toBe('2024-06')
    expect(result.album.photos).toEqual([])
    const raw = await fs.readFile(path.join(PATHS.albums, 'my-album.json'), 'utf-8')
    expect(JSON.parse(raw).title).toBe('My Album')
  })

  it('slugifies title correctly', async () => {
    const { album } = await createAlbum({ title: 'Weddings & Events 2024!' })
    expect(album.slug).toBe('weddings-events-2024')
  })

  it('falls back to "album" for empty title', async () => {
    const { album } = await createAlbum({ title: '' })
    expect(album.slug).toBe('album')
  })

  it('deduplicates slug on collision', async () => {
    await createAlbum({ title: 'Portrait' })
    const second = await createAlbum({ title: 'Portrait' })
    expect(second.album.slug).toMatch(/^portrait-\d+$/)
  })

  it('assigns incrementing order', async () => {
    const a1 = await createAlbum({ title: 'First' })
    const a2 = await createAlbum({ title: 'Second' })
    const a3 = await createAlbum({ title: 'Third' })
    expect(a1.album.order).toBe(0)
    expect(a2.album.order).toBe(1)
    expect(a3.album.order).toBe(2)
  })
})

// ── getAlbum ──────────────────────────────────────────────────────────────────

describe('getAlbum', () => {
  it('returns album for known slug', async () => {
    await createAlbum({ title: 'Paris' })
    const album = await getAlbum('paris')
    expect(album?.title).toBe('Paris')
  })

  it('returns null for unknown slug', async () => {
    expect(await getAlbum('nonexistent')).toBeNull()
  })
})

// ── updateAlbum ───────────────────────────────────────────────────────────────

describe('updateAlbum', () => {
  it('merges patch and preserves other fields', async () => {
    await createAlbum({ title: 'Tokyo', date: '2024-01' })
    const result = await updateAlbum('tokyo', { title: 'Tokyo 2024', description: 'Trip' })
    expect(result.ok).toBe(true)
    expect(result.album.title).toBe('Tokyo 2024')
    expect(result.album.date).toBe('2024-01')
  })

  it('returns { ok: false } for unknown slug', async () => {
    const result = await updateAlbum('ghost', { title: 'Ghost' })
    expect(result.ok).toBe(false)
  })
})

// ── deleteAlbum ───────────────────────────────────────────────────────────────

describe('deleteAlbum', () => {
  it('removes the JSON file', async () => {
    await createAlbum({ title: 'Delete Me' })
    await deleteAlbum('delete-me')
    expect(await getAlbum('delete-me')).toBeNull()
  })

  it('is idempotent for missing album', async () => {
    expect((await deleteAlbum('ghost')).ok).toBe(true)
  })
})

// ── reorderAlbums ─────────────────────────────────────────────────────────────

describe('reorderAlbums', () => {
  it('updates order field on each album', async () => {
    await createAlbum({ title: 'Alpha' })
    await createAlbum({ title: 'Beta' })
    await createAlbum({ title: 'Gamma' })
    await reorderAlbums(['gamma', 'beta', 'alpha'])
    expect((await getAlbum('gamma'))?.order).toBe(0)
    expect((await getAlbum('beta'))?.order).toBe(1)
    expect((await getAlbum('alpha'))?.order).toBe(2)
  })

  it('listAlbums reflects new order', async () => {
    await createAlbum({ title: 'First' })
    await createAlbum({ title: 'Second' })
    await reorderAlbums(['second', 'first'])
    const albums = await listAlbums()
    expect(albums[0].slug).toBe('second')
    expect(albums[1].slug).toBe('first')
  })
})

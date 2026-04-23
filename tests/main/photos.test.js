import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-photos-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

// Mock sharp so tests don't need real images or native binaries
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    jpeg:   vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue({ width: 1920, height: 1080 }),
  }))
  return { default: mockSharp }
})

import { addPhotos, removePhoto, updatePhoto, reorderPhotos, setCover } from '../../src/main/handlers/photos.js'
import { createAlbum } from '../../src/main/handlers/albums.js'
import { PATHS, readJson } from '../../src/main/storage.js'

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

// Helpers
async function freshAlbum(title = 'Test') {
  const { album } = (await createAlbum({ title }))
  return album
}

async function albumJson(slug) {
  return readJson(path.join(PATHS.albums, `${slug}.json`))
}

// ── addPhotos ─────────────────────────────────────────────────────────────────

describe('addPhotos', () => {
  it('returns { ok: false } for unknown album', async () => {
    const result = await addPhotos('ghost-album', ['/fake/photo.jpg'])
    expect(result.ok).toBe(false)
  })

  it('adds photo entries to album.photos', async () => {
    const album = await freshAlbum('Portraits')

    const photoDir = path.join(TEST_DIR, 'fake-photos')
    await fs.mkdir(photoDir, { recursive: true })
    const fakeSrc = path.join(photoDir, 'shot.jpg')
    await fs.writeFile(fakeSrc, 'fake-image-data')

    const result = await addPhotos(album.slug, [fakeSrc])
    expect(result.ok).toBe(true)
    expect(result.added).toHaveLength(1)
    expect(result.added[0].filename).toBe('shot.jpg')
    expect(result.added[0].localPath).toBeTruthy()
  })

  it('sets coverPhoto to first uploaded photo when album has no cover', async () => {
    const album = await freshAlbum('No Cover')
    const photoDir = path.join(TEST_DIR, 'fake-photos2')
    await fs.mkdir(photoDir, { recursive: true })
    const fakeSrc = path.join(photoDir, 'first.jpg')
    await fs.writeFile(fakeSrc, 'data')

    await addPhotos(album.slug, [fakeSrc])
    const saved = await albumJson(album.slug)
    expect(saved.coverPhoto).toBe('first.jpg')
  })
})

// ── removePhoto ───────────────────────────────────────────────────────────────

describe('removePhoto', () => {
  it('removes photo from album.photos array', async () => {
    const album = await freshAlbum('Remove Test')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [
      { filename: 'a.jpg', order: 0 },
      { filename: 'b.jpg', order: 1 },
    ]
    data.coverPhoto = 'a.jpg'
    await fs.writeFile(albumFile, JSON.stringify(data))

    const result = await removePhoto(album.slug, 'a.jpg')
    expect(result.ok).toBe(true)

    const saved = await albumJson(album.slug)
    expect(saved.photos).toHaveLength(1)
    expect(saved.photos[0].filename).toBe('b.jpg')
  })

  it('updates coverPhoto to next photo when current cover is removed', async () => {
    const album = await freshAlbum('Cover Shift')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [{ filename: 'cover.jpg', order: 0 }, { filename: 'other.jpg', order: 1 }]
    data.coverPhoto = 'cover.jpg'
    await fs.writeFile(albumFile, JSON.stringify(data))

    await removePhoto(album.slug, 'cover.jpg')
    const saved = await albumJson(album.slug)
    expect(saved.coverPhoto).toBe('other.jpg')
  })

  it('sets coverPhoto to null when last photo is removed', async () => {
    const album = await freshAlbum('Last Photo')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [{ filename: 'only.jpg', order: 0 }]
    data.coverPhoto = 'only.jpg'
    await fs.writeFile(albumFile, JSON.stringify(data))

    await removePhoto(album.slug, 'only.jpg')
    const saved = await albumJson(album.slug)
    expect(saved.coverPhoto).toBeNull()
  })

  it('returns { ok: false } for unknown album', async () => {
    const result = await removePhoto('ghost', 'photo.jpg')
    expect(result.ok).toBe(false)
  })
})

// ── updatePhoto ───────────────────────────────────────────────────────────────

describe('updatePhoto', () => {
  it('patches caption and altText fields', async () => {
    const album = await freshAlbum('Update Test')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [{ filename: 'img.jpg', caption: null, altText: null, order: 0 }]
    await fs.writeFile(albumFile, JSON.stringify(data))

    await updatePhoto(album.slug, 'img.jpg', { caption: 'Sunset', altText: 'A sunset photo' })
    const saved = await albumJson(album.slug)
    expect(saved.photos[0].caption).toBe('Sunset')
    expect(saved.photos[0].altText).toBe('A sunset photo')
  })

  it('does not modify other photos', async () => {
    const album = await freshAlbum('Multi Photo')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [
      { filename: 'a.jpg', caption: 'original-a', order: 0 },
      { filename: 'b.jpg', caption: 'original-b', order: 1 },
    ]
    await fs.writeFile(albumFile, JSON.stringify(data))

    await updatePhoto(album.slug, 'a.jpg', { caption: 'updated-a' })
    const saved = await albumJson(album.slug)
    expect(saved.photos[1].caption).toBe('original-b')
  })
})

// ── reorderPhotos ─────────────────────────────────────────────────────────────

describe('reorderPhotos', () => {
  it('reorders photos and updates order fields', async () => {
    const album = await freshAlbum('Reorder')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [
      { filename: 'one.jpg', order: 0 },
      { filename: 'two.jpg', order: 1 },
      { filename: 'three.jpg', order: 2 },
    ]
    await fs.writeFile(albumFile, JSON.stringify(data))

    await reorderPhotos(album.slug, ['three.jpg', 'one.jpg', 'two.jpg'])
    const saved = await albumJson(album.slug)
    expect(saved.photos[0].filename).toBe('three.jpg')
    expect(saved.photos[0].order).toBe(0)
    expect(saved.photos[1].filename).toBe('one.jpg')
    expect(saved.photos[2].filename).toBe('two.jpg')
  })
})

// ── setCover ──────────────────────────────────────────────────────────────────

describe('setCover', () => {
  it('sets coverPhoto to the given filename', async () => {
    const album = await freshAlbum('Cover')
    const albumFile = path.join(PATHS.albums, `${album.slug}.json`)
    const data = await readJson(albumFile)
    data.photos = [{ filename: 'a.jpg', order: 0 }, { filename: 'b.jpg', order: 1 }]
    data.coverPhoto = 'a.jpg'
    await fs.writeFile(albumFile, JSON.stringify(data))

    await setCover(album.slug, 'b.jpg')
    const saved = await albumJson(album.slug)
    expect(saved.coverPhoto).toBe('b.jpg')
  })

  it('returns { ok: false } for unknown album', async () => {
    const result = await setCover('ghost', 'photo.jpg')
    expect(result.ok).toBe(false)
  })
})

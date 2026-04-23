const fs = require('fs').promises
const path = require('path')
const { PATHS, readJson, writeJson } = require('../storage')
const { DEFAULTS } = require('../../shared/types')

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'album'
}

function albumPath(slug) {
  return path.join(PATHS.albums, `${slug}.json`)
}

async function listAlbums() {
  const files = await fs.readdir(PATHS.albums).catch(() => [])
  const albums = await Promise.all(
    files.filter(f => f.endsWith('.json')).map(f => readJson(path.join(PATHS.albums, f)))
  )
  return albums.filter(Boolean).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

async function getAlbum(slug) {
  return readJson(albumPath(slug), null)
}

async function createAlbum(data) {
  const existing = await listAlbums()
  let slug = slugify(data.title ?? 'album')
  // Ensure unique slug
  if (existing.find(a => a.slug === slug)) slug = `${slug}-${Date.now()}`

  const album = {
    ...DEFAULTS.album,
    ...data,
    slug,
    order: existing.length,
    photos: [],
  }
  await writeJson(albumPath(slug), album)
  return { ok: true, album }
}

async function updateAlbum(slug, patch) {
  const existing = await readJson(albumPath(slug), null)
  if (!existing) return { ok: false, error: 'Album not found' }
  const updated = { ...existing, ...patch, slug }
  await writeJson(albumPath(slug), updated)
  return { ok: true, album: updated }
}

async function deleteAlbum(slug) {
  await fs.unlink(albumPath(slug)).catch(() => {})
  return { ok: true }
}

async function reorderAlbums(slugs) {
  await Promise.all(slugs.map(async (slug, i) => {
    const album = await readJson(albumPath(slug), null)
    if (album) await writeJson(albumPath(slug), { ...album, order: i })
  }))
  return { ok: true }
}

module.exports = { listAlbums, getAlbum, createAlbum, updateAlbum, deleteAlbum, reorderAlbums }

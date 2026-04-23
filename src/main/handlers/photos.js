const path = require('path')
const fs = require('fs').promises
const sharp = require('sharp')
const { PATHS, readJson, writeJson } = require('../storage')
const { DEFAULTS } = require('../../shared/types')

function albumPath(slug) {
  return path.join(PATHS.albums, `${slug}.json`)
}

function photoDir(slug) {
  return path.join(PATHS.data, 'photos', slug)
}

async function addPhotos(albumSlug, filePaths) {
  const album = await readJson(albumPath(albumSlug), null)
  if (!album) return { ok: false, error: 'Album not found' }

  const dir = photoDir(albumSlug)
  await fs.mkdir(dir, { recursive: true })

  const added = []
  for (const src of filePaths) {
    const filename = path.basename(src)
    const dest     = path.join(dir, filename)
    const thumbDest = path.join(dir, `thumb-${filename.replace(/\.[^.]+$/, '.jpg')}`)

    // Resize original to max 2400px, convert to JPEG q85
    const meta = await sharp(src)
      .rotate() // auto-orient from EXIF
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(dest.replace(/\.[^.]+$/, '.jpg'))

    // Thumbnail 600px
    await sharp(src)
      .rotate()
      .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbDest)

    const normalizedFilename = filename.replace(/\.[^.]+$/, '.jpg')
    added.push({
      ...DEFAULTS.photo,
      filename: normalizedFilename,
      localPath: dest.replace(/\.[^.]+$/, '.jpg'),
      thumbLocalPath: thumbDest,
      width: meta.width,
      height: meta.height,
      order: album.photos.length + added.length,
    })
  }

  album.photos = [...album.photos, ...added]
  if (!album.coverPhoto && added.length) album.coverPhoto = added[0].filename
  await writeJson(albumPath(albumSlug), album)
  return { ok: true, added }
}

async function removePhoto(albumSlug, filename) {
  const album = await readJson(albumPath(albumSlug), null)
  if (!album) return { ok: false, error: 'Album not found' }

  const dir = photoDir(albumSlug)
  await fs.unlink(path.join(dir, filename)).catch(() => {})
  await fs.unlink(path.join(dir, `thumb-${filename}`)).catch(() => {})

  album.photos = album.photos.filter(p => p.filename !== filename)
  if (album.coverPhoto === filename) {
    album.coverPhoto = album.photos[0]?.filename ?? null
  }
  await writeJson(albumPath(albumSlug), album)
  return { ok: true }
}

async function updatePhoto(albumSlug, filename, patch) {
  const album = await readJson(albumPath(albumSlug), null)
  if (!album) return { ok: false, error: 'Album not found' }

  album.photos = album.photos.map(p => p.filename === filename ? { ...p, ...patch } : p)
  await writeJson(albumPath(albumSlug), album)
  return { ok: true }
}

async function reorderPhotos(albumSlug, filenames) {
  const album = await readJson(albumPath(albumSlug), null)
  if (!album) return { ok: false, error: 'Album not found' }

  const map = Object.fromEntries(album.photos.map(p => [p.filename, p]))
  album.photos = filenames.map((fn, i) => ({ ...map[fn], order: i })).filter(Boolean)
  await writeJson(albumPath(albumSlug), album)
  return { ok: true }
}

async function setCover(albumSlug, filename) {
  const album = await readJson(albumPath(albumSlug), null)
  if (!album) return { ok: false, error: 'Album not found' }
  album.coverPhoto = filename
  await writeJson(albumPath(albumSlug), album)
  return { ok: true }
}

module.exports = { addPhotos, removePhoto, updatePhoto, reorderPhotos, setCover }

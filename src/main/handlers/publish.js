const path = require('path')
const fs = require('fs').promises
const os = require('os')
const sharp = require('sharp')
const crypto = require('crypto')
const { Octokit } = require('@octokit/rest')
const { store, PATHS, readJson, writeJson } = require('../storage')
const { buildSite } = require('../build')
const { pushToGitHub } = require('./github')

function getOctokit() {
  return new Octokit({ auth: store.get('token'), userAgent: 'EXHBT-App' })
}

function repoName(login) { return `${login}.github.io` }

function fileHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12)
}

async function publishSite(sendProgress) {
  const user = store.get('user')
  if (!user) return { ok: false, error: 'Not logged in.' }

  const octokit = getOctokit()
  const repo = repoName(user.login)
  const distDir = path.join(os.tmpdir(), `exhbt-publish-${Date.now()}`)
  await fs.mkdir(distDir, { recursive: true })

  try {
    // ── 1. Load data ──────────────────────────────────────────────────────
    sendProgress({ step: 'loading', message: 'Preparing files...', percent: 5 })
    const albums = await loadAlbums()

    // ── 2. Process images ─────────────────────────────────────────────────
    sendProgress({ step: 'images', message: 'Optimizing images...', percent: 15 })
    await processImages(albums)

    // ── 3. Upload photos to GitHub Releases ───────────────────────────────
    sendProgress({ step: 'uploading', message: 'Uploading photos...', percent: 30 })
    await uploadPhotos(octokit, user.login, repo, albums, sendProgress)

    // ── 4. Build HTML ─────────────────────────────────────────────────────
    sendProgress({ step: 'building', message: 'Building site...', percent: 70 })
    await buildSite({ mode: 'publish', outputDir: distDir })

    // ── 5. SEO files ──────────────────────────────────────────────────────
    sendProgress({ step: 'seo', message: 'Generating sitemap...', percent: 80 })
    const site = await readJson(PATHS.site, {})
    await writeSeoFiles(distDir, site, albums, user.login)

    // ── 6. Push to GitHub ─────────────────────────────────────────────────
    sendProgress({ step: 'pushing', message: 'Pushing to GitHub Pages...', percent: 88 })
    await pushToGitHub(distDir, sendProgress)

    sendProgress({ step: 'done', message: 'Done!', percent: 100 })
    return { ok: true, url: `https://${repo}` }
  } catch (e) {
    return { ok: false, error: e.message }
  } finally {
    await fs.rm(distDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function loadAlbums() {
  const files = await fs.readdir(PATHS.albums).catch(() => [])
  const albums = await Promise.all(
    files.filter(f => f.endsWith('.json')).map(f => readJson(path.join(PATHS.albums, f)))
  )
  return albums.filter(Boolean).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

async function processImages(albums) {
  for (const album of albums) {
    for (const photo of album.photos ?? []) {
      if (!photo.localPath || photo.url) continue
      // Already processed by photos.js — just verify file exists
      await fs.access(photo.localPath).catch(() => {})
    }
  }
}

async function uploadPhotos(octokit, owner, repo, albums, sendProgress) {
  const tag = `photos-${Date.now()}`
  let release

  // Check if any photo needs uploading
  const toUpload = albums.flatMap(a => (a.photos ?? []).filter(p => p.localPath && !p.url))
  if (!toUpload.length) return

  // Create release for this batch
  try {
    const { data } = await octokit.repos.createRelease({
      owner, repo, tag_name: tag,
      name: `Photos ${new Date().toISOString().slice(0, 10)}`,
      body: 'Photo assets uploaded by EXHBT',
      draft: false,
    })
    release = data
  } catch (e) {
    throw new Error(`Failed to create GitHub Release: ${e.message}`)
  }

  let uploaded = 0
  for (const album of albums) {
    for (const photo of album.photos ?? []) {
      if (!photo.localPath || photo.url) continue
      const buf = await fs.readFile(photo.localPath).catch(() => null)
      if (!buf) continue

      const assetName = `${album.slug}-${photo.filename}`
      const { data: asset } = await octokit.repos.uploadReleaseAsset({
        owner, repo,
        release_id: release.id,
        name: assetName,
        data: buf,
        headers: { 'content-type': 'image/jpeg', 'content-length': buf.length },
      })
      photo.url = asset.browser_download_url

      // Thumb
      if (photo.thumbLocalPath) {
        const thumbBuf = await fs.readFile(photo.thumbLocalPath).catch(() => null)
        if (thumbBuf) {
          const { data: ta } = await octokit.repos.uploadReleaseAsset({
            owner, repo, release_id: release.id,
            name: `thumb-${assetName}`,
            data: thumbBuf,
            headers: { 'content-type': 'image/jpeg', 'content-length': thumbBuf.length },
          })
          photo.thumbUrl = ta.browser_download_url
        }
      }

      // Persist updated URLs back to album JSON
      await writeJson(path.join(PATHS.albums, `${album.slug}.json`), album)

      uploaded++
      sendProgress({ step: 'uploading', message: `Uploading photos… (${uploaded}/${toUpload.length})`, percent: 30 + Math.floor((uploaded / toUpload.length) * 35) })
    }
  }
}

async function writeSeoFiles(distDir, site, albums, login) {
  const base = site.customDomain ? `https://${site.customDomain}` : `https://${login}.github.io`
  const urls = ['/', '/about', ...albums.map(a => `/albums/${a.slug}`)]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`
  const robots = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap)
  await fs.writeFile(path.join(distDir, 'robots.txt'), robots)
  if (site.customDomain) {
    await fs.writeFile(path.join(distDir, 'CNAME'), site.customDomain)
  }
}

module.exports = { publishSite }

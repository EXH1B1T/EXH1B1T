const path = require('path')
const { PATHS } = require('../storage')
const { buildSite } = require('../build')

async function buildPreview(context) {
  await buildSite({ mode: 'preview', outputDir: PATHS.previewDir })
  return { ok: true }
}

function getUrl(page, albumSlug) {
  let file
  if (page === 'about') {
    file = 'about.html'
  } else if (albumSlug) {
    file = path.join('albums', `${albumSlug}.html`)
  } else {
    file = 'index.html'
  }
  const abs = path.join(PATHS.previewDir, file)
  // file:// URL — Electron WebView can load these directly.
  return `file://${abs}`
}

module.exports = { buildPreview, getUrl }

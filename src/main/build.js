const Handlebars = require('handlebars')
const fs = require('fs').promises
const path = require('path')
const { PATHS, readJson } = require('./storage')
const { PORTFOLIO_SPEC_VERSION } = require('../shared/types')

// ── Helpers ──────────────────────────────────────────────────────────────────

Handlebars.registerHelper('formatDate', (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

Handlebars.registerHelper('albumUrl', (slug) => `/albums/${slug}`)

// Convert an absolute local path to a local:// URL usable in the preview webview.
function toLocalUrl(absPath) {
  if (!absPath) return ''
  // local:// is registered as a standard scheme, so Chromium treats it host-based.
  // local:///Users/foo → hostname=users, pathname=/foo. The protocol handler
  // reconstructs: /${hostname}${pathname} = /users/foo (case-insensitive on macOS).
  return `local://${absPath}`
}

Handlebars.registerHelper('imageUrl', (photo) => photo?.url ?? toLocalUrl(photo?.localPath))
Handlebars.registerHelper('thumbUrl',  (photo) =>
  photo?.thumbUrl ?? toLocalUrl(photo?.thumbLocalPath) ?? photo?.url ?? toLocalUrl(photo?.localPath))
Handlebars.registerHelper('coverUrl',  (album) => {
  const cover = album?.photos?.find(p => p.filename === album.coverPhoto) ?? album?.photos?.[0]
  return cover?.url ?? toLocalUrl(cover?.localPath)
})

Handlebars.registerHelper('eq', (a, b) => a === b)

Handlebars.registerHelper('aspectRatio', (photo) => {
  if (!photo?.width || !photo?.height) return '1 / 1'
  return `${photo.width} / ${photo.height}`
})

Handlebars.registerHelper('photoCount', (album) => album?.photos?.length ?? 0)

Handlebars.registerHelper('ifLang', function (lang, options) {
  return this.site?.lang === lang ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('ifOption', function (key, value, options) {
  return this.site?.theme?.options?.[key] === value ? options.fn(this) : options.inverse(this)
})

// ── Theme loading ─────────────────────────────────────────────────────────────

async function loadTheme(name) {
  const candidates = [
    path.join(PATHS.themes, `${name}.html`),
    path.join(__dirname, '../../resources/themes', `${name}.html`),
  ]
  for (const p of candidates) {
    try { return await fs.readFile(p, 'utf-8') } catch {}
  }
  throw new Error(`Theme "${name}" not found`)
}

function extractTemplates(html) {
  const templates = {}
  const re = /<template\s+data-page="([^"]+)">([\s\S]*?)<\/template>/g
  let m
  while ((m = re.exec(html)) !== null) {
    templates[m[1]] = m[2]
  }
  return templates
}

function extractStyles(html) {
  const m = html.match(/<style[^>]*data-scope="global"[^>]*>([\s\S]*?)<\/style>/)
  return m ? m[1] : ''
}

function extractScript(html) {
  const m = html.match(/<script[^>]*data-scope="global"[^>]*>([\s\S]*?)<\/script>/)
  return m ? m[1] : ''
}

// ── Build ─────────────────────────────────────────────────────────────────────

async function buildSite(options = {}) {
  const { mode = 'preview', outputDir } = options

  const [siteRaw, albumFiles] = await Promise.all([
    readJson(PATHS.site, {}),
    fs.readdir(PATHS.albums).catch(() => []),
  ])

  const albums = (await Promise.all(
    albumFiles
      .filter(f => f.endsWith('.json'))
      .map(f => readJson(path.join(PATHS.albums, f)))
  )).filter(Boolean).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const themeName = siteRaw.theme?.name ?? 'default'
  const themeHtml = await loadTheme(themeName)
  const templates = extractTemplates(themeHtml)
  const globalStyle  = extractStyles(themeHtml)
  const globalScript = extractScript(themeHtml)

  const injectStyle  = `<style>${globalStyle}</style>`
  const injectScript = globalScript ? `<script>${globalScript}</script>` : ''

  const out = outputDir ?? PATHS.previewDir
  await fs.mkdir(out, { recursive: true })

  const ctx = { site: siteRaw, albums, mode }

  const pages = [
    { page: 'home',  file: 'index.html',  data: { ...ctx } },
    { page: 'about', file: 'about.html',  data: { ...ctx } },
    ...albums.map(album => ({
      page: 'album',
      file: path.join('albums', `${album.slug}.html`),
      data: { ...ctx, album },
    })),
  ]

  for (const { page, file, data } of pages) {
    const tpl = templates[page] ?? templates['home'] ?? ''
    const rendered = tpl
      .replace('{{inject-style}}',  injectStyle)
      .replace('{{inject-script}}', injectScript)
    const compiled = Handlebars.compile(rendered)
    const html = compiled(data)
    const dest = path.join(out, file)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.writeFile(dest, html, 'utf-8')
  }

  // Copy _data/ into output so the site has access to it.
  if (mode === 'publish') {
    await copyDir(path.join(PATHS.data, '_data'), path.join(out, '_data'))
  }

  return { ok: true, pages: pages.map(p => p.file) }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dest, e.name)
    if (e.isDirectory()) await copyDir(s, d)
    else await fs.copyFile(s, d)
  }
}

module.exports = { buildSite }

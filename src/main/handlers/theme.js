const fs = require('fs').promises
const path = require('path')
const { PATHS, readJson, writeJson } = require('../storage')
const { PORTFOLIO_SPEC_VERSION } = require('../../shared/types')

// Themes bundled with the app
const BUILTIN_DIR = path.join(__dirname, '../../../resources/themes')

function parseMetadata(html) {
  const name        = html.match(/@portfolio-theme\s+([\w-]+)/)?.[1] ?? null
  const description = html.match(/@description\s+(.+)/)?.[1]?.trim() ?? ''
  const compat      = html.match(/compatibility:\s*portfolio-spec@([\d.]+)/)?.[1] ?? null
  return { name, description, compat }
}

function validate(html) {
  const errors = []
  const meta = parseMetadata(html)
  if (!meta.name)  errors.push('Missing @portfolio-theme name in comment')
  if (!meta.compat) errors.push('Missing compatibility declaration')
  if (!html.includes('<template data-page="home">'))  errors.push('Missing <template data-page="home">')
  if (!html.includes('<template data-page="album">')) errors.push('Missing <template data-page="album">')
  return { valid: errors.length === 0, errors, meta }
}

async function listThemes() {
  const [builtins, userFiles] = await Promise.all([
    fs.readdir(BUILTIN_DIR).catch(() => []),
    fs.readdir(PATHS.themes).catch(() => []),
  ])

  const themes = []
  for (const file of [...builtins.map(f => ({ f, dir: BUILTIN_DIR })), ...userFiles.map(f => ({ f, dir: PATHS.themes }))]) {
    if (!file.f.endsWith('.html')) continue
    const html = await fs.readFile(path.join(file.dir, file.f), 'utf-8').catch(() => '')
    const meta = parseMetadata(html)
    themes.push({ name: meta.name ?? path.basename(file.f, '.html'), description: meta.description, file: file.f })
  }
  return themes
}

async function getCurrent() {
  const site = await readJson(PATHS.site, {})
  return site.theme?.name ?? 'default'
}

async function installTheme(filePath) {
  const html = await fs.readFile(filePath, 'utf-8')
  const { valid, errors, meta } = validate(html)
  if (!valid) return { ok: false, errors }

  const dest = path.join(PATHS.themes, `${meta.name}.html`)
  await fs.copyFile(filePath, dest)
  return { ok: true, name: meta.name }
}

async function applyTheme(name) {
  const site = await readJson(PATHS.site, {})
  site.theme = { ...(site.theme ?? {}), name }
  await writeJson(PATHS.site, site)
  return { ok: true }
}

async function deleteTheme(name) {
  await fs.unlink(path.join(PATHS.themes, `${name}.html`)).catch(() => {})
  return { ok: true }
}

module.exports = { listThemes, getCurrent, installTheme, applyTheme, deleteTheme }

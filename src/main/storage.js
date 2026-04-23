const { app } = require('electron')
const path = require('path')
const fs = require('fs').promises
const Store = require('electron-store').default ?? require('electron-store')

const store = new Store()

const DATA_DIR = path.join(app.getPath('userData'), 'portfolio')

const PATHS = {
  data:         DATA_DIR,
  site:         path.join(DATA_DIR, '_data', 'site.json'),
  albums:       path.join(DATA_DIR, '_data', 'albums'),
  themes:       path.join(DATA_DIR, 'themes'),
  previewDir:   path.join(DATA_DIR, '_preview'),
}

async function ensureAppDirs() {
  await fs.mkdir(path.join(DATA_DIR, '_data', 'albums'), { recursive: true })
  await fs.mkdir(PATHS.themes,     { recursive: true })
  await fs.mkdir(PATHS.previewDir, { recursive: true })
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

module.exports = { store, PATHS, ensureAppDirs, readJson, writeJson }

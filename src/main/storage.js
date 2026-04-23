const path = require('path')
const fs = require('fs').promises

// Under Vitest: electron isn't available as a Node.js module and electron-store
// (pure ESM) can't be require()d synchronously. Use lightweight in-process stubs.
let app, store

if (process.env.VITEST) {
  // electron stub — getPath('userData') reads the per-test temp dir set by vi.hoisted()
  app = { getPath: (_key) => globalThis.__TEST_DIR__ || require('os').tmpdir() }
  // Use the shared global store so both CJS source files and ESM test files see the same state.
  // patch-node-modules.cjs sets this up before any test runs.
  store = globalThis.__VITEST_STORE__ || {
    _d: {},
    get(k)    { return this._d[k] },
    set(k, v) { this._d[k] = v },
    delete(k) { delete this._d[k] },
    clear()   { this._d = {} },
  }
} else {
  app = require('electron').app
  const Store = require('electron-store').default ?? require('electron-store')
  store = new Store()
}

const DATA_DIR = path.join(app.getPath('userData'), 'portfolio')

const PATHS = {
  data:       DATA_DIR,
  site:       path.join(DATA_DIR, '_data', 'site.json'),
  albums:     path.join(DATA_DIR, '_data', 'albums'),
  themes:     path.join(DATA_DIR, 'themes'),
  previewDir: path.join(DATA_DIR, '_preview'),
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

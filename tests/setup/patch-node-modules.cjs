/**
 * Patches Node.js's CJS module loader so require() calls inside source files
 * return test stubs. This runs as a Vitest setupFile (before test imports).
 *
 * Each test worker gets its own module cache, so there's no cross-test-file leakage.
 * Within a test file, use globalThis.__VITEST_STORE__.clear() in beforeEach to reset state.
 */

'use strict'

const Module = require('module')
const os     = require('os')

// ── Shared store (same object for both test code and CJS source files) ────────
// storage.js references this global when process.env.VITEST is set.
if (!globalThis.__VITEST_STORE__) {
  globalThis.__VITEST_STORE__ = {
    _d: {},
    get(k)    { return this._d[k] },
    set(k, v) { this._d[k] = v },
    delete(k) { delete this._d[k] },
    clear()   { this._d = {} },
  }
}

// ── Configurable DNS stub (tests assign to globalThis.__VITEST_DNS_RESOLVE4__) ─
if (!globalThis.__VITEST_DNS_RESOLVE4__) {
  // Default: every domain is "not found"
  globalThis.__VITEST_DNS_RESOLVE4__ = () =>
    Promise.reject(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }))
}

// ── Configurable Octokit stub (tests assign to globalThis.__VITEST_OCTOKIT__) ─
// Default: no-op Octokit that throws "Not mocked"
if (!globalThis.__VITEST_OCTOKIT__) {
  globalThis.__VITEST_OCTOKIT__ = null
}

// ── Static stubs ──────────────────────────────────────────────────────────────
const stubs = {
  // Electron stub: provides app, shell, ipcMain, etc.
  'electron': {
    app: {
      getPath: (_k) => globalThis.__TEST_DIR__ || os.tmpdir(),
      isPackaged: false,
      getName: () => 'exh1b1t-test',
      getVersion: () => '0.0.0-test',
      on: () => {},
      whenReady: () => Promise.resolve(),
    },
    shell:    { openExternal: () => Promise.resolve() },
    ipcMain:  { handle: () => {}, on: () => {}, removeHandler: () => {} },
    dialog:   { showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }) },
    protocol: { registerSchemesAsPrivileged: () => {}, handle: () => {} },
    BrowserWindow: class { constructor() {}; loadURL(){}; loadFile(){}; on(){}; webContents = { send: () => {} } },
    net: {},
    session: { defaultSession: { protocol: { handle: () => {} } } },
  },

  // https stub: returns empty responses so device-flow functions return { ok: false }
  'https': {
    request: (_opts, cb) => {
      if (cb) cb({ on: (ev, fn) => { if (ev === 'end') fn() }, statusCode: 200 })
      return { on: () => {}, write: () => {}, end: () => {} }
    },
    get: (_opts, cb) => {
      if (cb) cb({ on: (ev, fn) => { if (ev === 'end') fn() }, statusCode: 200 })
      return { on: () => {} }
    },
  },

  // dns stub: resolve4 delegates to the per-test configurable global
  'dns': {
    promises: {
      resolve4: (domain) => globalThis.__VITEST_DNS_RESOLVE4__(domain),
    },
  },

  // @octokit/rest stub: delegates to configurable globalThis.__VITEST_OCTOKIT__
  '@octokit/rest': {
    Octokit: class {
      constructor() {
        if (!globalThis.__VITEST_OCTOKIT__) throw new Error('__VITEST_OCTOKIT__ not set')
        return globalThis.__VITEST_OCTOKIT__
      }
    },
  },

  // sharp stub: chainable API, toFile resolves with fake dimensions
  'sharp': (() => {
    const chain = {
      rotate: () => chain,
      resize: () => chain,
      jpeg:   () => chain,
      toFile: () => Promise.resolve({ width: 1920, height: 1080 }),
    }
    const fn = () => chain
    fn.default = fn  // some code does require('sharp').default
    return fn
  })(),
}

// ── Patch Module._load ────────────────────────────────────────────────────────
const originalLoad = Module._load.bind(Module)

Module._load = function patchedLoad(request, parent, isMain) {
  if (Object.prototype.hasOwnProperty.call(stubs, request)) {
    return stubs[request]
  }
  return originalLoad(request, parent, isMain)
}

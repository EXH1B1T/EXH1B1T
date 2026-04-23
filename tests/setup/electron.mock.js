// Shared electron + electron-store mocks for main-process tests.
// Import this file in vi.mock() factory or use setupFiles.
//
// Usage in a test file:
//   import { makeElectronMock, MockStore } from '../setup/electron.mock.js'
//   vi.mock('electron', () => makeElectronMock(TEST_DIR))
//   vi.mock('electron-store', () => ({ default: MockStore }))

export function makeElectronMock(userDataPath) {
  return {
    app:   { getPath: () => userDataPath },
    shell: { openExternal: vi.fn() },
    BrowserWindow: { getAllWindows: vi.fn(() => []) },
    ipcMain: { handle: vi.fn(), on: vi.fn() },
    dialog: { showOpenDialog: vi.fn() },
    net: { fetch: vi.fn() },
    session: { fromPartition: vi.fn(() => ({ protocol: { handle: vi.fn() } })) },
    protocol: { handle: vi.fn(), registerSchemesAsPrivileged: vi.fn() },
  }
}

// In-memory store — mimics electron-store interface.
export class MockStore {
  constructor() { this._data = {} }
  get(key)       { return this._data[key] }
  set(key, val)  { this._data[key] = val }
  delete(key)    { delete this._data[key] }
  clear()        { this._data = {} }
}

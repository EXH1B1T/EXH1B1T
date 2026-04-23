/**
 * Electron stub for tests.
 * app.getPath('userData') returns globalThis.__TEST_DIR__, which each test file
 * sets via vi.hoisted() before any imports run.
 */
import os from 'os'

export const app = {
  getPath: (_key) => globalThis.__TEST_DIR__ || os.tmpdir(),
  isPackaged: false,
  getVersion: () => '0.0.0-test',
  getName: () => 'exh1b1t-test',
  on: () => {},
  whenReady: () => Promise.resolve(),
}

export const shell = {
  openExternal: () => Promise.resolve(),
}

export const ipcMain = {
  handle: () => {},
  on: () => {},
  removeHandler: () => {},
}

export const BrowserWindow = class {
  constructor() {}
  loadURL() {}
  loadFile() {}
  on() {}
  webContents = { send: () => {} }
}

export const dialog = {
  showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
}

export const protocol = {
  registerSchemesAsPrivileged: () => {},
  handle: () => {},
}

export const net = {}
export const session = { defaultSession: { protocol: { handle: () => {} } } }

export default { app, shell, ipcMain, BrowserWindow, dialog, protocol, net, session }

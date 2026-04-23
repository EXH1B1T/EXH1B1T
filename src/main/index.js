const { app, BrowserWindow, shell, protocol, net, session } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const { pathToFileURL } = require('url')
const { setupIpcHandlers } = require('./ipc')
const { ensureAppDirs } = require('./storage')

const isDev = !app.isPackaged

// Must be registered before app is ready.
// 'local' scheme serves absolute local file paths for the renderer.
protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 13 },
    backgroundColor: '#0f0f0f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

app.whenReady().then(async () => {
  // Serve local file paths as local:///<absolute-path>
  // Chromium parses standard-scheme URLs host-based, so local:///Users/foo becomes
  // local://users/foo (hostname=users, pathname=/foo). Reconstruct the absolute path.
  const localHandler = (request) => {
    const url = new URL(request.url)
    const filePath = `/${url.hostname}${decodeURIComponent(url.pathname)}`
    return net.fetch(pathToFileURL(filePath).href)
  }
  protocol.handle('local', localHandler)

  // Register the same local:// handler on the preview webview's session so
  // built preview HTML can load local photos via local:// URLs.
  app.on('session-created', (sess) => {
    if (sess.persist) sess.protocol.handle('local', localHandler)
  })
  // Also register on persist:preview in case it was already created.
  session.fromPartition('persist:preview').protocol.handle('local', localHandler)

  await ensureAppDirs()
  setupIpcHandlers()
  createWindow()

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

autoUpdater.on('update-available',  (info)     => BrowserWindow.getAllWindows()[0]?.webContents.send('updater:available', info))
autoUpdater.on('download-progress', (progress) => BrowserWindow.getAllWindows()[0]?.webContents.send('updater:progress', progress))
autoUpdater.on('update-downloaded', (info)     => BrowserWindow.getAllWindows()[0]?.webContents.send('updater:ready', info))

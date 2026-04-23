const { ipcMain, BrowserWindow, dialog } = require('electron')
const auth    = require('./handlers/auth')
const site    = require('./handlers/site')
const albums  = require('./handlers/albums')
const photos  = require('./handlers/photos')
const theme   = require('./handlers/theme')
const preview = require('./handlers/preview')
const publish = require('./handlers/publish')
const github  = require('./handlers/github')

function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try { return await fn(...args) }
    catch (e) { return { ok: false, error: e.message } }
  })
}

function setupIpcHandlers() {
  // Auth
  handle('auth:requestDeviceCode', auth.requestDeviceCode)
  handle('auth:pollToken',         auth.pollToken)
  handle('auth:getUser',           auth.getUser)
  handle('auth:logout',            auth.logout)

  // Site
  handle('site:get',  site.getSite)
  handle('site:save', site.saveSite)

  // Albums
  handle('albums:list',    albums.listAlbums)
  handle('albums:get',     albums.getAlbum)
  handle('albums:create',  albums.createAlbum)
  handle('albums:update',  albums.updateAlbum)
  handle('albums:delete',  albums.deleteAlbum)
  handle('albums:reorder', albums.reorderAlbums)

  // Photos
  handle('photos:add',     photos.addPhotos)
  handle('photos:remove',  photos.removePhoto)
  handle('photos:update',  photos.updatePhoto)
  handle('photos:reorder', photos.reorderPhotos)
  handle('photos:setCover',photos.setCover)

  // Theme
  handle('theme:list',       theme.listThemes)
  handle('theme:getCurrent', theme.getCurrent)
  handle('theme:install',    theme.installTheme)
  handle('theme:apply',      theme.applyTheme)
  handle('theme:delete',     theme.deleteTheme)

  // Preview
  handle('preview:build',  preview.buildPreview)
  handle('preview:getUrl', preview.getUrl)

  // Publish — streams progress events back to renderer
  ipcMain.handle('publish:start', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const sendProgress = (data) => win?.webContents.send('publish:progress', data)
    return publish.publishSite(sendProgress)
  })

  // Native file dialog
  handle('dialog:openImages', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'heic', 'webp'] }],
    })
    return canceled ? [] : filePaths
  })

  // GitHub
  handle('github:checkRepo',       github.checkRepo)
  handle('github:setupRepo',       github.setupRepo)
  handle('github:checkDns',        github.checkDns)
  handle('github:restoreFromRepo', github.restoreFromRepo)

  // Auto-updater install trigger
  ipcMain.on('updater:install', () => {
    require('electron-updater').autoUpdater.quitAndInstall()
  })
}

module.exports = { setupIpcHandlers }

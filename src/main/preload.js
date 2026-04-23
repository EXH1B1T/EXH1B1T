const { contextBridge, ipcRenderer, webUtils } = require('electron')

let _publishProgressHandler = null

// Helper: send a one-shot IPC call and return the result.
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('api', {
  auth: {
    requestDeviceCode: ()  => invoke('auth:requestDeviceCode'),
    pollToken:         ()  => invoke('auth:pollToken'),
    getUser:           ()  => invoke('auth:getUser'),
    logout:            ()  => invoke('auth:logout'),
  },

  site: {
    get:  ()     => invoke('site:get'),
    save: (data) => invoke('site:save', data),
  },

  albums: {
    list:    ()              => invoke('albums:list'),
    get:     (slug)          => invoke('albums:get', slug),
    create:  (data)          => invoke('albums:create', data),
    update:  (slug, data)    => invoke('albums:update', slug, data),
    delete:  (slug)          => invoke('albums:delete', slug),
    reorder: (slugs)         => invoke('albums:reorder', slugs),
  },

  photos: {
    add:     (albumSlug, filePaths)          => invoke('photos:add', albumSlug, filePaths),
    remove:  (albumSlug, filename)           => invoke('photos:remove', albumSlug, filename),
    update:  (albumSlug, filename, data)     => invoke('photos:update', albumSlug, filename, data),
    reorder: (albumSlug, filenames)          => invoke('photos:reorder', albumSlug, filenames),
    setCover:(albumSlug, filename)           => invoke('photos:setCover', albumSlug, filename),
  },

  theme: {
    list:       ()          => invoke('theme:list'),
    getCurrent: ()          => invoke('theme:getCurrent'),
    install:    (filePath)  => invoke('theme:install', filePath),
    apply:      (name)      => invoke('theme:apply', name),
    delete:     (name)      => invoke('theme:delete', name),
  },

  preview: {
    build:  (context)            => invoke('preview:build', context),
    getUrl: (page, albumSlug)    => invoke('preview:getUrl', page, albumSlug),
  },

  publish: {
    start: () => invoke('publish:start'),
    onProgress: (cb) => {
      _publishProgressHandler = (_event, data) => cb(data)
      ipcRenderer.on('publish:progress', _publishProgressHandler)
    },
    offProgress: () => {
      if (_publishProgressHandler) {
        ipcRenderer.removeListener('publish:progress', _publishProgressHandler)
        _publishProgressHandler = null
      }
    },
  },

  github: {
    checkRepo:       ()       => invoke('github:checkRepo'),
    setupRepo:       ()       => invoke('github:setupRepo'),
    checkDns:        (domain) => invoke('github:checkDns', domain),
    restoreFromRepo: ()       => invoke('github:restoreFromRepo'),
  },

  dialog: {
    openImages: () => invoke('dialog:openImages'),
  },

  // webUtils: needed to get file system paths from drag-dropped File objects
  // (file.path was deprecated in Electron 32 — webUtils.getPathForFile is the replacement)
  utils: {
    getPathForFile: (file) => webUtils.getPathForFile(file),
  },

  // Auto-updater events from main process.
  updater: {
    onAvailable: (cb) => ipcRenderer.on('updater:available', (_e, info) => cb(info)),
    onProgress:  (cb) => ipcRenderer.on('updater:progress', (_e, p)    => cb(p)),
    onReady:     (cb) => ipcRenderer.on('updater:ready',    (_e, info) => cb(info)),
    install:     ()   => ipcRenderer.send('updater:install'),
  },
})

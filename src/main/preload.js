const { contextBridge, ipcRenderer } = require('electron')

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
    onProgress:  (cb) => {
      const handler = (_event, data) => cb(data)
      ipcRenderer.on('publish:progress', handler)
    },
    offProgress: () => ipcRenderer.removeAllListeners('publish:progress'),
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

  // Auto-updater events from main process.
  updater: {
    onAvailable: (cb) => ipcRenderer.on('updater:available', (_e, info) => cb(info)),
    onProgress:  (cb) => ipcRenderer.on('updater:progress', (_e, p)    => cb(p)),
    onReady:     (cb) => ipcRenderer.on('updater:ready',    (_e, info) => cb(info)),
    install:     ()   => ipcRenderer.send('updater:install'),
  },
})

// Default window.api mock used by all renderer component tests.
// Individual tests can override specific methods with vi.fn().

export function makeWindowApi(overrides = {}) {
  return {
    auth: {
      requestDeviceCode: vi.fn().mockResolvedValue({ ok: true, user_code: 'ABCD-1234', verification_uri: 'https://github.com/login/device' }),
      pollToken:         vi.fn().mockResolvedValue({ ok: true, user: { login: 'testuser', name: 'Test User', avatar_url: '' } }),
      getUser:           vi.fn().mockResolvedValue({ login: 'testuser', name: 'Test User', avatar_url: '' }),
      logout:            vi.fn().mockResolvedValue({ ok: true }),
    },
    site: {
      get:  vi.fn().mockResolvedValue({
        title: 'My Portfolio', description: '', lang: 'en',
        owner: { name: 'Test User', bio: '', avatar: null },
        social: { instagram: null, facebook: null, email: null },
        seo: { googleAnalyticsId: null, faviconUrl: null },
        customDomain: null,
        theme: { name: 'default', options: {} },
        home: { layout: 'grid', headline: '', subhead: '', intro: '' },
        about: { portrait: null, exhibitions: [] },
        nav: { style: 'sidebar', homeVisible: true, aboutVisible: true, hiddenAlbums: [], links: [] },
      }),
      save: vi.fn().mockResolvedValue({ ok: true }),
    },
    albums: {
      list:    vi.fn().mockResolvedValue([]),
      get:     vi.fn().mockResolvedValue(null),
      create:  vi.fn().mockResolvedValue({ ok: true, album: { slug: 'new-album', title: 'New Album', photos: [], order: 0 } }),
      update:  vi.fn().mockResolvedValue({ ok: true }),
      delete:  vi.fn().mockResolvedValue({ ok: true }),
      reorder: vi.fn().mockResolvedValue({ ok: true }),
    },
    photos: {
      add:      vi.fn().mockResolvedValue({ ok: true, added: [] }),
      remove:   vi.fn().mockResolvedValue({ ok: true }),
      update:   vi.fn().mockResolvedValue({ ok: true }),
      reorder:  vi.fn().mockResolvedValue({ ok: true }),
      setCover: vi.fn().mockResolvedValue({ ok: true }),
    },
    theme: {
      list:       vi.fn().mockResolvedValue([{ name: 'default', description: 'Default theme' }]),
      getCurrent: vi.fn().mockResolvedValue('default'),
      install:    vi.fn().mockResolvedValue({ ok: true, name: 'custom' }),
      apply:      vi.fn().mockResolvedValue({ ok: true }),
      delete:     vi.fn().mockResolvedValue({ ok: true }),
    },
    preview: {
      build:  vi.fn().mockResolvedValue({ ok: true }),
      getUrl: vi.fn().mockResolvedValue('file:///tmp/preview/index.html'),
    },
    publish: {
      start:       vi.fn().mockResolvedValue({ ok: true, url: 'https://testuser.github.io' }),
      onProgress:  vi.fn(),
      offProgress: vi.fn(),
    },
    github: {
      checkRepo:       vi.fn().mockResolvedValue({ ok: true, repoExists: false, hasData: false }),
      setupRepo:       vi.fn().mockResolvedValue({ ok: true }),
      checkDns:        vi.fn().mockResolvedValue({ ok: true, status: 'waiting' }),
      restoreFromRepo: vi.fn().mockResolvedValue({ ok: true, filesRestored: 3 }),
    },
    dialog: {
      openImages: vi.fn().mockResolvedValue([]),
    },
    utils: {
      getPathForFile: vi.fn((file) => `/fake/path/${file?.name ?? 'file.jpg'}`),
    },
    updater: {
      onAvailable: vi.fn(),
      onProgress:  vi.fn(),
      onReady:     vi.fn(),
      install:     vi.fn(),
    },
    ...overrides,
  }
}

// Install a fresh mock before each test — call this in beforeEach.
export function installWindowApi(overrides = {}) {
  global.window = global.window ?? {}
  global.window.api = makeWindowApi(overrides)
}

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-build-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

import { buildSite } from '../../src/main/build.js'
import { PATHS } from '../../src/main/storage.js'

// ── Minimal test theme fixture ─────────────────────────────────────────────────
const TEST_THEME_HTML = `<!--
  @portfolio-theme test-theme
  @description For unit tests
  compatibility: portfolio-spec@1.4
-->
<style data-scope="global">
  body { font-family: sans-serif; }
</style>
<template data-page="home">
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <title>{{site.title}}</title>
  {{inject-style}}
</head>
<body>
  <h1 data-testid="headline">{{site.home.headline}}</h1>
  {{#each albums}}
    <a href="{{albumUrl slug}}" class="album-link">{{title}}</a>
  {{/each}}
  {{inject-script}}
</body>
</html>
</template>
<template data-page="album">
<!DOCTYPE html>
<html>
<head><title>{{album.title}}</title>{{inject-style}}</head>
<body>
  <h1 class="album-title">{{album.title}}</h1>
  <p class="album-date">{{formatDate album.date}}</p>
  <p class="photo-count">{{photoCount album}} photos</p>
  {{#each album.photos}}
    <img src="{{imageUrl this}}" alt="{{altText}}" class="photo-img" />
  {{/each}}
  {{inject-script}}
</body>
</html>
</template>
<template data-page="about">
<!DOCTYPE html>
<html>
<head><title>About</title>{{inject-style}}</head>
<body>
  <h1 class="owner-name">{{site.owner.name}}</h1>
  <p class="owner-bio">{{site.owner.bio}}</p>
</body>
</html>
</template>
`

const OUTPUT_DIR = path.join(TEST_DIR, 'test-output')

const sampleSite = {
  title: 'Jane Doe Photography',
  lang: 'en',
  owner: { name: 'Jane Doe', bio: 'Portrait photographer.' },
  social: {},
  theme: { name: 'test-theme', options: {} },
  home: { layout: 'grid', headline: 'Jane Doe', subhead: 'Photographer', intro: '' },
  about: { portrait: null, exhibitions: [] },
  nav: { style: 'sidebar', homeVisible: true, aboutVisible: true, hiddenAlbums: [], links: [] },
}

const sampleAlbum = {
  slug: 'portraits',
  title: 'Portraits',
  date: '2024-06-01',
  coverPhoto: 'shot.jpg',
  order: 0,
  photos: [
    { filename: 'shot.jpg', altText: 'A portrait', caption: null, width: 1920, height: 1080, order: 0, url: 'https://cdn/shot.jpg', thumbUrl: 'https://cdn/thumb-shot.jpg' },
    { filename: 'wide.jpg', altText: 'Wide angle',  caption: null, width: 3000, height: 2000, order: 1, url: 'https://cdn/wide.jpg', thumbUrl: null },
  ],
}

beforeAll(async () => {
  await fs.mkdir(PATHS.albums, { recursive: true })
  await fs.mkdir(PATHS.themes, { recursive: true })
  await fs.mkdir(path.dirname(PATHS.site), { recursive: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Install test theme into user themes dir
  await fs.writeFile(path.join(PATHS.themes, 'test-theme.html'), TEST_THEME_HTML)
})

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true })
})

beforeEach(async () => {
  await fs.writeFile(PATHS.site, JSON.stringify(sampleSite))
  const files = await fs.readdir(PATHS.albums).catch(() => [])
  await Promise.all(files.map(f => fs.unlink(path.join(PATHS.albums, f))))
  await fs.writeFile(path.join(PATHS.albums, 'portraits.json'), JSON.stringify(sampleAlbum))
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
})

// ── buildSite ─────────────────────────────────────────────────────────────────

describe('buildSite', () => {
  it('returns { ok: true, pages } with expected page files', async () => {
    const result = await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    expect(result.ok).toBe(true)
    expect(result.pages).toContain('index.html')
    expect(result.pages).toContain('about.html')
    expect(result.pages.some(p => p.includes('portraits'))).toBe(true)
  })

  it('creates index.html', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    await expect(fs.access(path.join(OUTPUT_DIR, 'index.html'))).resolves.toBeUndefined()
  })

  it('creates about.html', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    await expect(fs.access(path.join(OUTPUT_DIR, 'about.html'))).resolves.toBeUndefined()
  })

  it('creates album page at albums/[slug].html', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    await expect(fs.access(path.join(OUTPUT_DIR, 'albums', 'portraits.html'))).resolves.toBeUndefined()
  })

  it('injects site.title into home page', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
    expect(html).toContain('Jane Doe Photography')
  })

  it('injects site.lang as html lang attribute', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
    expect(html).toContain('lang="en"')
  })

  it('renders album links on home page via {{albumUrl}}', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
    expect(html).toContain('/albums/portraits')
  })

  it('renders album title on album page', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'albums', 'portraits.html'), 'utf-8')
    expect(html).toContain('Portraits')
  })

  it('renders formatted date via {{formatDate}} helper', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'albums', 'portraits.html'), 'utf-8')
    expect(html).toContain('June 2024')
  })

  it('renders {{photoCount}} correctly', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'albums', 'portraits.html'), 'utf-8')
    expect(html).toContain('2 photos')
  })

  it('renders {{imageUrl}} with url when photo has url', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'albums', 'portraits.html'), 'utf-8')
    expect(html).toContain('https://cdn/shot.jpg')
  })

  it('renders {{imageUrl}} with local:// when photo has only localPath', async () => {
    const localAlbum = {
      ...sampleAlbum,
      photos: [{ filename: 'local.jpg', altText: '', width: 1000, height: 800, order: 0,
                  url: null, localPath: '/Users/test/photos/local.jpg' }],
    }
    await fs.writeFile(path.join(PATHS.albums, 'portraits.json'), JSON.stringify(localAlbum))
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'albums', 'portraits.html'), 'utf-8')
    expect(html).toContain('local://')
  })

  it('renders owner name on about page', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'about.html'), 'utf-8')
    expect(html).toContain('Jane Doe')
  })

  it('injects global style from theme', async () => {
    await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    const html = await fs.readFile(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
    expect(html).toContain('font-family: sans-serif')
  })

  it('builds multiple album pages when multiple albums exist', async () => {
    const album2 = { ...sampleAlbum, slug: 'landscapes', title: 'Landscapes', order: 1 }
    await fs.writeFile(path.join(PATHS.albums, 'landscapes.json'), JSON.stringify(album2))
    const result = await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    expect(result.pages.some(p => p.includes('landscapes'))).toBe(true)
    expect(result.pages.some(p => p.includes('portraits'))).toBe(true)
  })

  it('handles empty albums array gracefully', async () => {
    const files = await fs.readdir(PATHS.albums)
    await Promise.all(files.map(f => fs.unlink(path.join(PATHS.albums, f))))
    const result = await buildSite({ mode: 'preview', outputDir: OUTPUT_DIR })
    expect(result.ok).toBe(true)
    await expect(fs.access(path.join(OUTPUT_DIR, 'index.html'))).resolves.toBeUndefined()
  })
})

// ── Handlebars helpers ────────────────────────────────────────────────────────

describe('Handlebars helpers', () => {
  describe('formatDate', () => {
    it('formats ISO date as "Month YYYY"', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['formatDate']
      expect(fn('2023-12-15')).toBe('December 2023')
    })

    it('returns empty string for null/undefined', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['formatDate']
      expect(fn(null)).toBe('')
      expect(fn(undefined)).toBe('')
    })

    it('returns original string for unparseable date', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['formatDate']
      expect(fn('not-a-date')).toBe('not-a-date')
    })
  })

  describe('albumUrl', () => {
    it('returns /albums/[slug]', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['albumUrl']
      expect(fn('my-album')).toBe('/albums/my-album')
    })
  })

  describe('aspectRatio', () => {
    it('returns "W / H" string', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['aspectRatio']
      expect(fn({ width: 1920, height: 1080 })).toBe('1920 / 1080')
    })

    it('returns "1 / 1" when dimensions are missing', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['aspectRatio']
      expect(fn({})).toBe('1 / 1')
      expect(fn(null)).toBe('1 / 1')
    })
  })

  describe('photoCount', () => {
    it('returns photo count', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['photoCount']
      expect(fn({ photos: [1, 2, 3] })).toBe(3)
      expect(fn({ photos: [] })).toBe(0)
      expect(fn({})).toBe(0)
    })
  })

  describe('imageUrl / thumbUrl', () => {
    it('imageUrl prefers photo.url over localPath', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['imageUrl']
      const photo = { url: 'https://cdn/img.jpg', localPath: '/local/img.jpg' }
      expect(fn(photo)).toBe('https://cdn/img.jpg')
    })

    it('imageUrl falls back to local:// URL when no url', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['imageUrl']
      const photo = { url: null, localPath: '/Users/test/img.jpg' }
      expect(fn(photo)).toContain('local://')
    })

    it('thumbUrl prefers photo.thumbUrl', async () => {
      const Handlebars = (await import('handlebars')).default
      const fn = Handlebars.helpers['thumbUrl']
      const photo = { thumbUrl: 'https://cdn/thumb.jpg', url: 'https://cdn/full.jpg' }
      expect(fn(photo)).toBe('https://cdn/thumb.jpg')
    })
  })
})

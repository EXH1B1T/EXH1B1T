import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-theme-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

import { listThemes, getCurrent, installTheme, applyTheme, deleteTheme } from '../../src/main/handlers/theme.js'
import { PATHS } from '../../src/main/storage.js'

// ── Minimal valid theme HTML ───────────────────────────────────────────────────
const VALID_THEME = `<!--
  @portfolio-theme my-theme
  @description A test theme
  compatibility: portfolio-spec@1.4
-->
<style data-scope="global">body { margin: 0; }</style>
<template data-page="home"><h1>{{site.title}}</h1>{{inject-style}}</template>
<template data-page="album"><h2>{{album.title}}</h2></template>
<template data-page="about"><p>About</p></template>
`

const INVALID_THEME_NO_NAME = `<!--
  compatibility: portfolio-spec@1.4
-->
<template data-page="home"><h1>Hi</h1></template>
<template data-page="album"><p>Album</p></template>
`

const INVALID_THEME_NO_HOME = `<!--
  @portfolio-theme broken
  compatibility: portfolio-spec@1.4
-->
<template data-page="album"><p>Album</p></template>
`

beforeAll(async () => {
  await fs.mkdir(PATHS.themes, { recursive: true })
  await fs.mkdir(path.dirname(PATHS.site), { recursive: true })
})

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true })
})

beforeEach(async () => {
  const files = await fs.readdir(PATHS.themes).catch(() => [])
  await Promise.all(files.map(f => fs.unlink(path.join(PATHS.themes, f))))
  await fs.unlink(PATHS.site).catch(() => {})
})

// ── installTheme ──────────────────────────────────────────────────────────────

describe('installTheme', () => {
  it('installs a valid theme and returns { ok: true, name }', async () => {
    const src = path.join(TEST_DIR, 'my-theme.html')
    await fs.writeFile(src, VALID_THEME)

    const result = await installTheme(src)
    expect(result.ok).toBe(true)
    expect(result.name).toBe('my-theme')

    const dest = path.join(PATHS.themes, 'my-theme.html')
    await expect(fs.access(dest)).resolves.toBeUndefined()
  })

  it('rejects theme missing @portfolio-theme name', async () => {
    const src = path.join(TEST_DIR, 'no-name.html')
    await fs.writeFile(src, INVALID_THEME_NO_NAME)

    const result = await installTheme(src)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/@portfolio-theme/i)]))
  })

  it('rejects theme missing <template data-page="home">', async () => {
    const src = path.join(TEST_DIR, 'no-home.html')
    await fs.writeFile(src, INVALID_THEME_NO_HOME)

    const result = await installTheme(src)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/home/i)]))
  })

  it('rejects theme missing compatibility declaration', async () => {
    const noCompat = VALID_THEME.replace('compatibility: portfolio-spec@1.4', '')
    const src = path.join(TEST_DIR, 'no-compat.html')
    await fs.writeFile(src, noCompat)

    const result = await installTheme(src)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/compatibility/i)]))
  })
})

// ── getCurrent ────────────────────────────────────────────────────────────────

describe('getCurrent', () => {
  it('returns "default" when no site.json exists', async () => {
    const name = await getCurrent()
    expect(name).toBe('default')
  })

  it('returns the theme name stored in site.json', async () => {
    await fs.writeFile(PATHS.site, JSON.stringify({ theme: { name: 'minimal' } }))
    const name = await getCurrent()
    expect(name).toBe('minimal')
  })
})

// ── applyTheme ────────────────────────────────────────────────────────────────

describe('applyTheme', () => {
  it('writes theme.name to site.json', async () => {
    await fs.writeFile(PATHS.site, JSON.stringify({ title: 'Test', theme: { name: 'default' } }))
    const result = await applyTheme('my-theme')
    expect(result.ok).toBe(true)
    const saved = JSON.parse(await fs.readFile(PATHS.site, 'utf-8'))
    expect(saved.theme.name).toBe('my-theme')
    expect(saved.title).toBe('Test')  // other fields preserved
  })
})

// ── deleteTheme ───────────────────────────────────────────────────────────────

describe('deleteTheme', () => {
  it('removes the theme file', async () => {
    const src = path.join(TEST_DIR, 'temp-theme.html')
    await fs.writeFile(src, VALID_THEME)
    await installTheme(src)

    const dest = path.join(PATHS.themes, 'my-theme.html')
    await expect(fs.access(dest)).resolves.toBeUndefined()

    const result = await deleteTheme('my-theme')
    expect(result.ok).toBe(true)
    await expect(fs.access(dest)).rejects.toThrow()
  })

  it('is idempotent — returns { ok: true } even if file missing', async () => {
    const result = await deleteTheme('nonexistent')
    expect(result.ok).toBe(true)
  })
})

// ── listThemes ────────────────────────────────────────────────────────────────

describe('listThemes', () => {
  it('includes installed user themes', async () => {
    const src = path.join(TEST_DIR, 'list-theme.html')
    await fs.writeFile(src, VALID_THEME)
    await installTheme(src)

    const themes = await listThemes()
    expect(themes.some(t => t.name === 'my-theme')).toBe(true)
  })

  it('each theme entry has name and description', async () => {
    const src = path.join(TEST_DIR, 'desc-theme.html')
    await fs.writeFile(src, VALID_THEME)
    await installTheme(src)

    const themes = await listThemes()
    const t = themes.find(t => t.name === 'my-theme')
    expect(t).toBeDefined()
    expect(t.description).toBe('A test theme')
  })
})

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs/promises'

const { TEST_DIR } = vi.hoisted(() => {
  const os = require('os')
  const p = require('path')
  const { randomUUID } = require('crypto')
  const dir = p.join(os.tmpdir(), `exh1b1t-github-${randomUUID()}`)
  globalThis.__TEST_DIR__ = dir
  return { TEST_DIR: dir }
})

// @octokit/rest is intercepted by patch-node-modules.cjs (Module._load patch).
// Tests set globalThis.__VITEST_OCTOKIT__ so new Octokit() returns this mock.
const mockOctokit = {
  repos: {
    get:                        vi.fn(),
    createForAuthenticatedUser: vi.fn().mockResolvedValue({ data: {} }),
    createPagesSite:            vi.fn().mockResolvedValue({ data: {} }),
    getContent:                 vi.fn(),
    uploadReleaseAsset:         vi.fn(),
    createRelease:              vi.fn(),
  },
  git: {
    getTree:      vi.fn(),
    getRef:       vi.fn(),
    getCommit:    vi.fn(),
    createBlob:   vi.fn(),
    createTree:   vi.fn(),
    createCommit: vi.fn(),
    updateRef:    vi.fn(),
  },
}
globalThis.__VITEST_OCTOKIT__ = mockOctokit

// dns is intercepted by patch-node-modules.cjs (Module._load patch).
// Tests override globalThis.__VITEST_DNS_RESOLVE4__ to control resolve4 behaviour.

import { checkRepo, setupRepo, checkDns, restoreFromRepo } from '../../src/main/handlers/github.js'
import { PATHS, store } from '../../src/main/storage.js'

beforeAll(async () => {
  await fs.mkdir(path.dirname(PATHS.site), { recursive: true })
  await fs.mkdir(PATHS.albums, { recursive: true })
})
afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true })
})
beforeEach(() => {
  // Set up user/token in store for authenticated operations
  store.clear()
  store.set('token', 'ghp_test')
  store.set('user', { login: 'testuser', name: 'Test' })

  // Reset dns stub to default (ENOTFOUND) before each test
  globalThis.__VITEST_DNS_RESOLVE4__ = () =>
    Promise.reject(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }))

  globalThis.__VITEST_OCTOKIT__ = mockOctokit
  vi.clearAllMocks()
  mockOctokit.repos.createForAuthenticatedUser.mockResolvedValue({ data: {} })
  mockOctokit.repos.createPagesSite.mockResolvedValue({ data: {} })
})

// ── checkDns ──────────────────────────────────────────────────────────────────

describe('checkDns', () => {
  it('returns idle status for empty domain', async () => {
    const result = await checkDns('')
    expect(result.status).toBe('idle')
  })

  it('returns active when IP resolves to a GitHub Pages address', async () => {
    globalThis.__VITEST_DNS_RESOLVE4__ = () => Promise.resolve(['185.199.108.153'])
    const result = await checkDns('example.com')
    expect(result.ok).toBe(true)
    expect(result.status).toBe('active')
  })

  it('returns wrong when IP does not match GitHub Pages', async () => {
    globalThis.__VITEST_DNS_RESOLVE4__ = () => Promise.resolve(['1.2.3.4'])
    const result = await checkDns('example.com')
    expect(result.status).toBe('wrong')
    expect(result.message).toMatch(/1\.2\.3\.4/)
  })

  it('returns waiting when domain is not found (ENOTFOUND)', async () => {
    globalThis.__VITEST_DNS_RESOLVE4__ = () =>
      Promise.reject(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }))
    const result = await checkDns('notexist.example')
    expect(result.status).toBe('waiting')
  })

  it('returns waiting when domain has no A records (ENODATA)', async () => {
    globalThis.__VITEST_DNS_RESOLVE4__ = () =>
      Promise.reject(Object.assign(new Error('ENODATA'), { code: 'ENODATA' }))
    const result = await checkDns('norecord.example')
    expect(result.status).toBe('waiting')
  })

  it('accepts any of the four GitHub Pages IPs', async () => {
    const githubIPs = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153']
    for (const ip of githubIPs) {
      globalThis.__VITEST_DNS_RESOLVE4__ = () => Promise.resolve([ip])
      const result = await checkDns('test.example')
      expect(result.status).toBe('active')
    }
  })
})

// ── checkRepo ─────────────────────────────────────────────────────────────────

describe('checkRepo', () => {
  it('returns repoExists: false when GitHub 404s', async () => {
    const err = Object.assign(new Error('Not Found'), { status: 404 })
    mockOctokit.repos.get.mockRejectedValue(err)

    const result = await checkRepo()
    expect(result.ok).toBe(true)
    expect(result.repoExists).toBe(false)
    expect(result.hasData).toBe(false)
  })

  it('returns repoExists: true, hasData: true when _data/site.json exists', async () => {
    mockOctokit.repos.get.mockResolvedValue({ data: { name: 'testuser.github.io' } })
    mockOctokit.repos.getContent.mockResolvedValue({ data: {} })

    const result = await checkRepo()
    expect(result.repoExists).toBe(true)
    expect(result.hasData).toBe(true)
  })

  it('returns repoExists: true, hasData: false when repo exists but no _data/', async () => {
    mockOctokit.repos.get.mockResolvedValue({ data: { name: 'testuser.github.io' } })
    mockOctokit.repos.getContent.mockRejectedValue(new Error('Not found'))

    const result = await checkRepo()
    expect(result.repoExists).toBe(true)
    expect(result.hasData).toBe(false)
  })

  it('includes correct repoName in response', async () => {
    const err = Object.assign(new Error('Not Found'), { status: 404 })
    mockOctokit.repos.get.mockRejectedValue(err)

    const result = await checkRepo()
    expect(result.repoName).toBe('testuser.github.io')
  })
})

// ── setupRepo ─────────────────────────────────────────────────────────────────

describe('setupRepo', () => {
  it('returns ok: true with correct repo name and URL', async () => {
    mockOctokit.repos.get.mockRejectedValue(new Error('404'))

    const result = await setupRepo()
    expect(result.ok).toBe(true)
    expect(result.repoName).toBe('testuser.github.io')
    expect(result.url).toBe('https://testuser.github.io')
  })

  it('skips createForAuthenticatedUser if repo already exists', async () => {
    mockOctokit.repos.get.mockResolvedValue({ data: {} })

    await setupRepo()
    expect(mockOctokit.repos.createForAuthenticatedUser).not.toHaveBeenCalled()
  })

  it('creates repo when it does not exist', async () => {
    mockOctokit.repos.get.mockRejectedValue(new Error('404'))

    await setupRepo()
    expect(mockOctokit.repos.createForAuthenticatedUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'testuser.github.io', private: false })
    )
  })

  it('writes default site.json to local data dir', async () => {
    mockOctokit.repos.get.mockRejectedValue(new Error('404'))
    await fs.unlink(PATHS.site).catch(() => {})

    await setupRepo()
    const raw = await fs.readFile(PATHS.site, 'utf-8')
    const site = JSON.parse(raw)
    expect(site.owner.login).toBe('testuser')
  })
})

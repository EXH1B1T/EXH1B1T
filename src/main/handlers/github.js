const { Octokit } = require('@octokit/rest')
const dns = require('dns').promises
const path = require('path')
const fs = require('fs').promises
const { store, PATHS, readJson, writeJson } = require('../storage')
const { DEFAULTS } = require('../../shared/types')

function getOctokit() {
  const token = store.get('token')
  if (!token) throw new Error('Not authenticated')
  return new Octokit({ auth: token, userAgent: 'EXH1B1T-App' })
}

function repoName(login) {
  return `${login}.github.io`
}

async function checkRepo() {
  const octokit = getOctokit()
  const user = store.get('user')
  const repo = repoName(user.login)

  try {
    const { data } = await octokit.repos.get({ owner: user.login, repo })
    // Check if _data/ exists (indicates an EXH1B1T-built site)
    let hasData = false
    try {
      await octokit.repos.getContent({ owner: user.login, repo, path: '_data/site.json' })
      hasData = true
    } catch {}
    return { ok: true, repoExists: true, hasData, repoName: repo }
  } catch (e) {
    if (e.status === 404) return { ok: true, repoExists: false, hasData: false, repoName: repo }
    return { ok: false, error: e.message }
  }
}

async function setupRepo() {
  const octokit = getOctokit()
  const user = store.get('user')
  const repo = repoName(user.login)

  // Create repo if missing
  try {
    await octokit.repos.get({ owner: user.login, repo })
  } catch {
    await octokit.repos.createForAuthenticatedUser({
      name: repo,
      description: 'My portfolio — built with EXH1B1T',
      private: false,
      auto_init: true,
    })
  }

  // Enable GitHub Pages on main branch
  try {
    await octokit.repos.createPagesSite({
      owner: user.login, repo,
      source: { branch: 'main', path: '/' },
    })
  } catch {}

  // Write initial site.json if not already present
  const defaultSite = { ...DEFAULTS.site, owner: { ...DEFAULTS.site.owner, login: user.login, name: user.name ?? '' } }
  await writeJson(PATHS.site, defaultSite)

  return { ok: true, repoName: repo, url: `https://${repo}` }
}

const GITHUB_PAGES_IPS = new Set([
  '185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153',
])

async function checkDns(domain) {
  if (!domain) return { ok: true, status: 'idle', message: '' }
  try {
    const addresses = await dns.resolve4(domain)
    if (addresses.some(ip => GITHUB_PAGES_IPS.has(ip))) {
      return { ok: true, status: 'active', message: 'DNS verified — pointing to GitHub Pages.' }
    }
    return { ok: true, status: 'wrong', message: `Domain resolves to ${addresses[0]}, not GitHub Pages.` }
  } catch (e) {
    if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') {
      return { ok: true, status: 'waiting', message: 'DNS not yet detected — may take up to 48 hours.' }
    }
    return { ok: true, status: 'waiting', message: 'Could not check DNS. Try again later.' }
  }
}

async function restoreFromRepo() {
  const octokit = getOctokit()
  const user = store.get('user')
  const repo = repoName(user.login)

  let filesRestored = 0
  try {
    const { data: tree } = await octokit.git.getTree({ owner: user.login, repo, tree_sha: 'main', recursive: 'true' })
    const dataFiles = tree.tree.filter(f => f.path?.startsWith('_data/') && f.type === 'blob')

    for (const file of dataFiles) {
      const { data } = await octokit.repos.getContent({ owner: user.login, repo, path: file.path })
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      const dest = path.join(PATHS.data, file.path)
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.writeFile(dest, content, 'utf-8')
      filesRestored++
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }

  return { ok: true, filesRestored }
}

// Push the built dist/ output to the GitHub repo main branch.
async function pushToGitHub(distDir, sendProgress) {
  const octokit = getOctokit()
  const user = store.get('user')
  const repo = repoName(user.login)

  sendProgress({ step: 'pushing', message: 'Pushing to GitHub...', percent: 88 })

  // Get current commit SHA
  const { data: ref } = await octokit.git.getRef({ owner: user.login, repo, ref: 'heads/main' })
  const baseSha = ref.object.sha

  const { data: baseCommit } = await octokit.git.getCommit({ owner: user.login, repo, commit_sha: baseSha })
  const baseTreeSha = baseCommit.tree.sha

  // Walk dist dir and create blobs
  const treeItems = []
  async function walk(dir, base = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const rel  = base ? `${base}/${e.name}` : e.name
      const full = path.join(dir, e.name)
      if (e.isDirectory()) { await walk(full, rel) }
      else {
        const content = await fs.readFile(full)
        const { data: blob } = await octokit.git.createBlob({
          owner: user.login, repo,
          content: content.toString('base64'),
          encoding: 'base64',
        })
        treeItems.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha })
      }
    }
  }
  await walk(distDir)

  const { data: newTree } = await octokit.git.createTree({ owner: user.login, repo, tree: treeItems, base_tree: baseTreeSha })
  const { data: newCommit } = await octokit.git.createCommit({
    owner: user.login, repo,
    message: `Update portfolio — ${new Date().toISOString().slice(0, 10)}`,
    tree: newTree.sha,
    parents: [baseSha],
  })
  await octokit.git.updateRef({ owner: user.login, repo, ref: 'heads/main', sha: newCommit.sha })
}

module.exports = { checkRepo, setupRepo, checkDns, restoreFromRepo, pushToGitHub }

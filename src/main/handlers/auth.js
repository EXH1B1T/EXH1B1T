const { shell } = require('electron')
const https = require('https')
const { store } = require('../storage')
const { GITHUB_CLIENT_ID } = require('../../shared/types')

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve({}) } })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    https.get({
      hostname: u.hostname, path: u.pathname + u.search,
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'EXHBT-App', 'Accept': 'application/json' },
    }, (res) => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve({}) } })
    }).on('error', reject)
  })
}

// Step 1 — get device + user code, open browser, return code immediately.
async function requestDeviceCode() {
  const codeRes = await post('https://github.com/login/device/code', {
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo user',
  }).catch(() => ({}))

  if (!codeRes.user_code) return { ok: false, error: 'Could not reach GitHub.' }

  shell.openExternal(codeRes.verification_uri)

  // Stash for polling
  store.set('_deviceCode', {
    device_code:      codeRes.device_code,
    interval:         codeRes.interval ?? 5,
    expires_at:       Date.now() + (codeRes.expires_in ?? 900) * 1000,
  })

  return { ok: true, user_code: codeRes.user_code, verification_uri: codeRes.verification_uri }
}

// Step 2 — poll until the user approves in the browser, return user profile.
async function pollToken() {
  const saved = store.get('_deviceCode')
  if (!saved) return { ok: false, error: 'No pending login. Please try again.' }

  const { device_code, interval, expires_at } = saved
  const intervalMs = interval * 1000

  const token = await new Promise((resolve) => {
    const poll = async () => {
      if (Date.now() > expires_at) { resolve(null); return }
      const res = await post('https://github.com/login/oauth/access_token', {
        client_id: GITHUB_CLIENT_ID,
        device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }).catch(() => ({}))

      if (res.access_token) { resolve(res.access_token); return }
      if (res.error === 'authorization_pending' || res.error === 'slow_down') {
        setTimeout(poll, res.error === 'slow_down' ? intervalMs + 5000 : intervalMs)
      } else {
        resolve(null)
      }
    }
    setTimeout(poll, intervalMs)
  })

  store.delete('_deviceCode')
  if (!token) return { ok: false, error: 'Login timed out. Please try again.' }

  const user = await get('https://api.github.com/user', token).catch(() => ({}))
  if (!user.login) return { ok: false, error: 'Could not fetch GitHub profile.' }

  store.set('token', token)
  store.set('user', user)
  return { ok: true, user }
}

function getUser() {
  return store.get('user') ?? null
}

function logout() {
  store.delete('token')
  store.delete('user')
  return { ok: true }
}

module.exports = { requestDeviceCode, pollToken, getUser, logout }

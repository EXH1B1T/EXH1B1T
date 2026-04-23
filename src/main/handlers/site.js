const { PATHS, readJson, writeJson } = require('../storage')
const { DEFAULTS } = require('../../shared/types')

async function getSite() {
  const data = await readJson(PATHS.site, null)
  return data ?? { ...DEFAULTS.site }
}

async function saveSite(data) {
  await writeJson(PATHS.site, data)
  return { ok: true }
}

module.exports = { getSite, saveSite }

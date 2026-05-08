#!/usr/bin/env node
/**
 * Generates app icons for EXH1B1T:
 *   build/icon.png        — 1024×1024 source (Linux)
 *   build/icon.icns       — macOS
 *   build/icon.ico        — Windows
 *
 * Run: node scripts/generate-icons.js
 * Requires: sharp (already a project dependency)
 */

const sharp  = require('sharp')
const fs     = require('fs').promises
const path   = require('path')
const { execSync } = require('child_process')
const os = require('os')

// ── Icon SVG design ──────────────────────────────────────────────────────────
// Two lime vertical bars representing the two "1"s in EXH1B1T
function iconSvg(size) {
  const s    = size
  const bar  = Math.round(s * 0.117)   // bar width  ~120 / 1024
  const h    = Math.round(s * 0.547)   // bar height ~560 / 1024
  const y    = Math.round(s * 0.227)   // top y      ~232 / 1024
  const x1   = Math.round(s * 0.277)   // left bar   ~284 / 1024
  const x2   = Math.round(s * 0.605)   // right bar  ~620 / 1024
  const r    = Math.max(2, Math.round(s * 0.015))  // corner radius

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#111111"/>
  <rect x="${x1}" y="${y}" width="${bar}" height="${h}" rx="${r}" fill="#d4f541"/>
  <rect x="${x2}" y="${y}" width="${bar}" height="${h}" rx="${r}" fill="#d4f541"/>
</svg>`
}

// ── Minimal ICO writer ───────────────────────────────────────────────────────
// ICO format: header (6) + N*directory (N*16) + image data (PNG blobs)
function buildIco(pngBuffers, sizes) {
  const N = pngBuffers.length
  const headerSize = 6
  const dirSize    = 16 * N
  let offset       = headerSize + dirSize

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(N, 4)  // count

  const dirs = []
  for (let i = 0; i < N; i++) {
    const d = Buffer.alloc(16)
    const sz = sizes[i]
    d.writeUInt8(sz >= 256 ? 0 : sz, 0)   // width  (0 = 256)
    d.writeUInt8(sz >= 256 ? 0 : sz, 1)   // height (0 = 256)
    d.writeUInt8(0, 2)                     // color count
    d.writeUInt8(0, 3)                     // reserved
    d.writeUInt16LE(1,  4)                 // planes
    d.writeUInt16LE(32, 6)                 // bit count
    d.writeUInt32LE(pngBuffers[i].length, 8)  // bytes in resource
    d.writeUInt32LE(offset, 12)               // image offset
    offset += pngBuffers[i].length
    dirs.push(d)
  }

  return Buffer.concat([header, ...dirs, ...pngBuffers])
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const buildDir   = path.join(__dirname, '..', 'build')
  const iconsetDir = path.join(buildDir, 'icon.iconset')

  await fs.mkdir(buildDir,   { recursive: true })
  await fs.mkdir(iconsetDir, { recursive: true })

  console.log('Generating icon PNGs…')

  // 1024×1024 source PNG
  const src1024 = await sharp(Buffer.from(iconSvg(1024)))
    .png()
    .toBuffer()
  await fs.writeFile(path.join(buildDir, 'icon.png'), src1024)
  console.log('  ✓ build/icon.png')

  // macOS iconset sizes
  const macSizes = [
    { name: 'icon_16x16.png',       size: 16  },
    { name: 'icon_16x16@2x.png',    size: 32  },
    { name: 'icon_32x32.png',       size: 32  },
    { name: 'icon_32x32@2x.png',    size: 64  },
    { name: 'icon_128x128.png',     size: 128 },
    { name: 'icon_128x128@2x.png',  size: 256 },
    { name: 'icon_256x256.png',     size: 256 },
    { name: 'icon_256x256@2x.png',  size: 512 },
    { name: 'icon_512x512.png',     size: 512 },
    { name: 'icon_512x512@2x.png',  size: 1024 },
  ]
  for (const { name, size } of macSizes) {
    const buf = await sharp(Buffer.from(iconSvg(size))).png().toBuffer()
    await fs.writeFile(path.join(iconsetDir, name), buf)
  }
  console.log('  ✓ build/icon.iconset/ (10 sizes)')

  // .icns via iconutil (macOS built-in)
  if (os.platform() === 'darwin') {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(buildDir, 'icon.icns')}"`)
    console.log('  ✓ build/icon.icns')
  } else {
    console.log('  ⚠ Skipping .icns (only generated on macOS)')
  }

  // Windows .ico (16, 24, 32, 48, 64, 128, 256)
  const icoSizes   = [16, 24, 32, 48, 64, 128, 256]
  const icoBufs    = await Promise.all(
    icoSizes.map(sz => sharp(Buffer.from(iconSvg(sz))).png().toBuffer())
  )
  const icoBuf = buildIco(icoBufs, icoSizes)
  await fs.writeFile(path.join(buildDir, 'icon.ico'), icoBuf)
  console.log('  ✓ build/icon.ico')

  // Clean up iconset (no longer needed after icns)
  await fs.rm(iconsetDir, { recursive: true, force: true }).catch(() => {})

  console.log('\nDone. Icons written to build/')
}

main().catch((e) => { console.error(e); process.exit(1) })

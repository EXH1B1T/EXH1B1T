# CLAUDE.md — EXH1B1T

> อ่านไฟล์นี้ก่อนทำงานทุกครั้ง — เป็น source of truth ของ project

---

## App คืออะไร

**EXH1B1T** — Electron desktop app สำหรับ non-tech user
สร้าง photo portfolio website ฟรี โดย host บน GitHub Pages

ผู้ใช้หลัก: photographer, designer, creative ที่ไม่รู้ coding
เป้าหมาย: ใช้งานง่าย, ฟรี 100%, ไม่ต้องรู้ git

---

## Architecture Decisions (confirmed — ห้ามเปลี่ยน)

### ทำไม Electron (ไม่ใช่ Web App)
- ไม่ต้องการ backend server เลย
- อ่าน local file system ได้โดยตรง (drag & drop รูป)
- รัน image processing (sharp) บนเครื่อง user
- distribute เป็น .dmg / .exe ได้

### ทำไม GitHub (ไม่ใช่ Netlify / Cloudflare)
- 1 account ให้ทุกอย่างในที่เดียว: repo + hosting + image storage
- ไม่มี backend ที่เราต้องดูแล
- user เป็นเจ้าของข้อมูลตัวเอง — ถ้า app เราปิด เว็บ user ยังอยู่
- Rate limit 5,000 req/ชั่วโมง เป็นของ user แต่ละคน ไม่ใช่ของเรา

### ทำไม Device Flow OAuth (ไม่ใช่ Web OAuth)
- ไม่ต้องมี redirect URI
- ไม่ต้องมี server รับ callback
- ไม่มี CLIENT_SECRET — CLIENT_ID expose ได้ใน app
- app คุยกับ GitHub API โดยตรง ไม่ผ่านมือเรา

### ทำไม GitHub Releases สำหรับรูปภาพ
- ไม่นับรวมกับ repo 1GB limit
- bandwidth ไม่จำกัด
- rate limit เป็นของ user ไม่ใช่เรา

### Auto Update — electron-updater + GitHub Releases
- ใช้ `electron-updater` (ส่วนหนึ่งของ `electron-builder`)
- update file host บน GitHub Releases ของ project repo — ฟรี ไม่มี server
- เพิ่มแค่ไม่กี่บรรทัดใน `index.js` ทำงานได้เลย
- **ข้อจำกัด:** macOS ต้องมี code signing ถึงจะ auto update ได้, Windows update ได้แต่มี SmartScreen warning ถ้าไม่มี signing

---

## Architecture สรุป

```
Electron App (Desktop)
├── Main Process (Node.js)   — file system, GitHub API, build engine
├── Renderer (React)         — UI, split-view editor + live preview
└── Preload (IPC bridge)     — window.api.xxx()

GitHub Repo: [username].github.io  (main branch)
├── _data/           — source of truth (site.json + albums/*.json)
├── built HTML       — output จาก Handlebars build
├── sitemap.xml      — auto-generated
├── robots.txt       — auto-generated
├── favicon.ico      — optional
└── CNAME            — optional, custom domain

GitHub Releases (exh1b1t repo)  — app updates
  v1.0.0/EXH1B1T-1.0.0.dmg
  v1.0.0/EXH1B1T-Setup-1.0.0.exe
  v1.0.0/latest-mac.yml
  v1.0.0/latest.yml

GitHub Releases (user's repo)  — รูปภาพ portfolio
tag: photos-[timestamp]
  [slug]-[filename].jpg
  [slug]-thumb-[filename].jpg
```

**1 user = 1 repo = 1 portfolio site** — ไม่มี multi-project

---

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop | Electron 33 |
| UI | React + CSS Modules |
| Template | Handlebars 4.x |
| Image processing | sharp |
| GitHub API | octokit |
| Local storage | electron-store |
| Build tool | Vite (renderer) |
| Auto update | electron-updater |

---

## Project Structure

```
src/
├── main/
│   ├── index.js          ← BrowserWindow setup
│   ├── preload.js        ← window.api IPC bridge
│   ├── ipc.js            ← register all handlers
│   ├── storage.js        ← PATHS + readJson/writeJson
│   ├── build.js          ← Handlebars engine
│   └── handlers/
│       ├── auth.js       ← GitHub Device Flow OAuth ✓
│       ├── site.js       ← site.json CRUD ✓
│       ├── albums.js     ← album CRUD + reorder ✓
│       ├── photos.js     ← photo add/remove/reorder ✓
│       ├── theme.js      ← theme install/validate ✓
│       ├── preview.js    ← local build + file:// URLs ✓
│       ├── publish.js    ← full publish pipeline ✓
│       └── github.js     ← repo setup + DNS + restore ✓
├── renderer/
│   ├── main.jsx          ← React entry + routing ✓
│   ├── styles/global.css ← design tokens ✓
│   ├── pages/
│   │   ├── Onboarding.jsx ← login + first-run ✓
│   │   ├── Editor.jsx     ← main split-view ✓
│   │   └── Settings.jsx   ← site/theme/domain/analytics ✓
│   └── components/
│       ├── AlbumList.jsx     ✓ (needs drag reorder)
│       ├── AlbumEditor.jsx   ✓ (needs caption/altText editor)
│       ├── PhotoGrid.jsx     ✓ (needs drag reorder)
│       ├── PhotoUpload.jsx   ✓
│       ├── PreviewPane.jsx   ✓
│       ├── PublishButton.jsx ✓
│       ├── ThemePicker.jsx   ✓
│       └── DnsStatus.jsx     ✓
└── shared/
    └── types.js          ← constants + defaults ✓

resources/
└── themes/
    └── default.html      ← TODO: สร้าง default theme ตาม spec
```

---

## window.api — IPC Interface

renderer เรียก main process ผ่าน:

```js
// Auth
window.api.auth.startOAuth()         → { ok, user_code, verification_uri, user }
window.api.auth.getUser()            → { login, name, avatar_url } | null
window.api.auth.logout()             → { ok }

// Site
window.api.site.get()                → SiteObject
window.api.site.save(data)           → { ok }

// Albums
window.api.albums.list()             → Album[]
window.api.albums.get(slug)          → AlbumObject
window.api.albums.create(data)       → { ok, album }
window.api.albums.update(slug, data) → { ok, album }
window.api.albums.delete(slug)       → { ok }
window.api.albums.reorder(slugs)     → { ok }

// Photos
window.api.photos.add(albumSlug, filePaths)           → { ok, added }
window.api.photos.remove(albumSlug, filename)          → { ok }
window.api.photos.update(albumSlug, filename, data)    → { ok }
window.api.photos.reorder(albumSlug, filenames)        → { ok }
window.api.photos.setCover(albumSlug, filename)        → { ok }

// Theme
window.api.theme.list()              → Theme[]
window.api.theme.getCurrent()        → string
window.api.theme.install(filePath)   → { ok, name } | { ok: false, errors }
window.api.theme.apply(name)         → { ok }
window.api.theme.delete(name)        → { ok }

// Preview
window.api.preview.build(context?)   → { ok }
window.api.preview.getUrl(page, albumSlug?) → file:// URL

// Publish
window.api.publish.start()           → { ok, url } | { ok: false, error }
window.api.publish.onProgress(cb)    → cb({ step, message, percent })
window.api.publish.offProgress()

// GitHub
window.api.github.checkRepo()        → { ok, repoExists, hasData, repoName }
window.api.github.setupRepo()        → { ok, repoName, url }
window.api.github.checkDns(domain)   → { ok, status, message }
window.api.github.restoreFromRepo()  → { ok, filesRestored }
```

---

## Data Schema

### SiteObject (site.json)
```json
{
  "title": "string",
  "description": "string",
  "lang": "th | en",
  "owner": { "name": "", "bio": "", "avatar": null },
  "social": { "instagram": null, "facebook": null, "email": null },
  "seo": { "googleAnalyticsId": null, "faviconUrl": null },
  "customDomain": null,
  "theme": { "name": "default", "options": {} }
}
```

### AlbumObject
```json
{
  "slug": "string",
  "title": "string",
  "description": null,
  "date": "YYYY-MM-DD",
  "coverPhoto": "filename.jpg",
  "order": 0,
  "tags": [],
  "photos": [
    {
      "filename": "string",
      "altText": null,
      "caption": null,
      "width": 0,
      "height": 0,
      "order": 0,
      "url": null
    }
  ]
}
```

---

## Design Tokens (global.css)

```css
--bg:          #0f0f0f
--bg-2:        #1a1a1a
--bg-3:        #242424
--border:      #2e2e2e
--border-2:    #3a3a3a
--text:        #e8e8e8
--text-2:      #888
--text-3:      #555
--accent:      #d4f541   /* lime */
--danger:      #ff4d4d
--success:     #4dff91
--sidebar-w:   240px
--titlebar-h:  38px
```

---

## Theme Spec (สรุป)

Theme = 1 ไฟล์ `.html` ที่มี:
- HTML comment metadata (`@portfolio-theme`, `compatibility: portfolio-spec@1.4`)
- `<template data-page="home|album|about">`
- `<style data-scope="global">`
- `<script data-scope="global">` (optional)
- inject keywords: `{{inject-style}}`, `{{inject-script}}`
- Handlebars helpers: `formatDate`, `albumUrl`, `imageUrl`, `thumbUrl`, `coverUrl`, `aspectRatio`, `photoCount`, `ifLang`, `ifOption`

---

## Publish Pipeline

```
1. Load data (site.json + albums/*.json)
2. Process images (sharp: resize 2400px max, JPEG q85, gen thumbnail 600px)
3. Upload photos → GitHub Releases (tag: photos-[timestamp])
4. Inject release URLs into album data
5. Build HTML (Handlebars, mode: publish)
6. Generate sitemap.xml + robots.txt + CNAME (ถ้ามี customDomain)
7. Copy _data/ to dist/
8. Push dist/ → GitHub repo (main branch)
```

Progress events: `loading → images → uploading → building → seo → pushing → done`

**หมายเหตุสำคัญ:**
- GitHub Pages propagate 1–5 นาทีหลัง push — UI ต้องแจ้ง user
- Incremental publish: track รูปที่เปลี่ยนด้วย hash เพื่อ upload เฉพาะที่เปลี่ยน
- First publish อาจนาน 5–10 นาทีถ้ามีรูปเยอะ — UX ต้องรองรับ

---

## Preview System

- Build mode: `preview` — ใช้ `file://` local paths แทน GitHub Releases URLs
- Rebuild strategy: แก้ site info/theme → rebuild all | แก้ album → rebuild album page only
- WebView แสดงผล `file://` URL จาก temp preview dir
- Google Analytics ไม่ inject ใน preview mode

---

## Onboarding Flow

```
Login with GitHub (Device Flow — ไม่ต้องมี server)
→ user กรอก code ใน browser
→ app poll จนได้ token
→ checkRepo:
  Case A: ไม่มี repo           → setupRepo() → สร้างใหม่ + เปิด Pages
  Case B: มี repo + _data/     → ถาม restore หรือเริ่มใหม่
  Case C: มี repo ไม่มี _data/ → ถาม overwrite หรือยกเลิก
```

---

---

## Auto Update

ใช้ `electron-updater` + GitHub Releases ของ project repo — ไม่มี server ไม่มีค่าใช้จ่าย

### วิธีทำงาน
```
app เปิด
→ autoUpdater.checkForUpdatesAndNotify()
→ เช็ค GitHub Releases ของ exh1b1t repo
→ พบ version ใหม่ → download ใน background
→ แจ้ง user → user กด restart → ติดตั้งทันที
```

### Config ที่ต้องเพิ่มใน package.json
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",
      "repo": "exh1b1t"
    }
  }
}
```

### Code ที่ต้องเพิ่มใน index.js
```javascript
const { autoUpdater } = require('electron-updater')

app.whenReady().then(async () => {
  await ensureAppDirs()
  setupIpcHandlers()
  createWindow()
  autoUpdater.checkForUpdatesAndNotify()  // ← เพิ่มบรรทัดนี้
})
```

### ข้อจำกัด
- **macOS** — ต้องมี code signing ถึงจะ auto update ได้ (Apple Developer $99/ปี)
- **Windows** — update ได้แต่มี SmartScreen warning ถ้าไม่มี EV certificate
- **Open source workaround** — README อธิบายให้ user bypass warning ได้, หรือรอ community contribute signing

---

## Known Issues & TODO

### High Priority
- [ ] `resources/themes/default.html` — default theme ตาม spec v1.4
- [ ] CSS Modules สำหรับทุก component (`.module.css`)
- [ ] Drag & drop reorder — AlbumList และ PhotoGrid
- [ ] Photo caption/altText inline editor ใน PhotoGrid
- [ ] `index.html` + Vite config สำหรับ renderer
- [ ] Incremental publish — track รูปที่เปลี่ยนด้วย hash

### Medium Priority
- [ ] Photo local path ใน preview mode (PhotoGrid แสดงรูปจาก file://)
- [ ] Error handling ใน UI — แปล error เป็นภาษาคน
- [ ] Empty states (ยังไม่มี album, ยังไม่มีรูป)
- [ ] GitHub Pages propagation delay — แจ้ง user หลัง publish สำเร็จ
- [ ] Auto update UI — แจ้ง user เมื่อมีอัพเดทใหม่ใน renderer

### Low Priority
- [ ] Theme options UI (color picker, select, toggle ใน Settings)
- [ ] Keyboard shortcuts
- [ ] App icon + installer
- [ ] Code signing — macOS: Apple Developer $99/ปี, Windows: EV cert
- [ ] GitHub Releases cleanup — ลบ release เก่าเมื่อ publish ใหม่
- [ ] Mobile preview toggle ใน PreviewPane
- [ ] In-app GitHub signup guide สำหรับ new users

---

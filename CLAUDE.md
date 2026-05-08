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
│   ├── index.js          ← BrowserWindow setup + local:// protocol + autoUpdater ✓
│   ├── preload.js        ← window.api IPC bridge ✓
│   ├── ipc.js            ← register all handlers ✓
│   ├── storage.js        ← PATHS + readJson/writeJson ✓
│   ├── build.js          ← Handlebars engine ✓
│   └── handlers/
│       ├── auth.js       ← GitHub Device Flow OAuth ✓
│       ├── site.js       ← site.json CRUD ✓
│       ├── albums.js     ← album CRUD + reorder ✓
│       ├── photos.js     ← photo add/remove/reorder ✓
│       ├── theme.js      ← theme install/validate ✓
│       ├── preview.js    ← local build + local:// URLs ✓
│       ├── publish.js    ← full publish pipeline ✓
│       └── github.js     ← repo setup + DNS + restore ✓
├── renderer/
│   ├── main.jsx          ← React entry + routing ✓
│   ├── styles/global.css ← design tokens ✓
│   ├── pages/
│   │   ├── Onboarding.jsx    ← login + first-run ✓
│   │   ├── Editor.jsx        ← main split-view (sidebar + editor + preview) ✓
│   │   └── Settings.jsx      ← site/theme/domain/analytics ✓
│   └── components/
│       ├── AlbumList.jsx         ✓ (needs drag reorder)
│       ├── AlbumEditor.jsx       ✓ (needs caption/altText editor)
│       ├── HomeEditor.jsx        ✓ — layout picker + headline/intro + album order
│       ├── AboutEditor.jsx       ✓ — portrait upload + bio + exhibitions
│       ├── NavEditor.jsx         ✓ — menu style + visibility toggles + custom links
│       ├── PhotoGrid.jsx         ✓ (needs drag reorder)
│       ├── PhotoUpload.jsx       ✓
│       ├── PreviewPane.jsx       ✓ — webview, desktop/mobile frame
│       ├── PublishButton.jsx     ✓
│       ├── ThemePicker.jsx       ✓
│       ├── DnsStatus.jsx         ✓
│       ├── UpdateBanner.jsx      ✓ — auto-update banner (downloading / ready states)
│       ├── Toggle.jsx            ✓ — iOS-style toggle switch
│       ├── Btn.jsx               ✓ — reusable button
│       ├── Field.jsx             ✓ — reusable form field
│       ├── Spinner.jsx           ✓ — loading spinner
│       ├── Icon.jsx              ✓
│       └── Logo.jsx              ✓
└── shared/
    └── types.js          ← constants + defaults ✓

resources/
└── themes/
    ├── lumen.html        ✓ — clean light editorial (Inter, CSS grid, accent colour)
    ├── noir.html         ✓ — dark cinematic (deep black, high contrast, full-bleed)
    ├── mono.html         ✓ — Swiss/Bauhaus (Inter, strict 3-col grid, 1px border)
    ├── film.html         ✓ — analog darkroom (Space Mono + Cormorant, sepia, contact-sheet)
    ├── zen.html          ✓ — Japanese minimal (Playfair Display italic, text-list home, masonry album)
    └── THEME_AUTHORING_GUIDE.md  ✓ — AI prompt / full spec for creating custom themes

build/
├── icon.icns             ✓ — macOS app icon (generated by scripts/generate-icons.js)
├── icon.ico              ✓ — Windows app icon
└── icon.png              ✓ — Linux / generic

scripts/
└── generate-icons.js     ✓ — generates build/icon.* from embedded SVG using sharp + iconutil
```

---

## window.api — IPC Interface

renderer เรียก main process ผ่าน:

```js
// Auth — Device Flow: requestDeviceCode ก่อน แล้ว poll จนได้ token
window.api.auth.requestDeviceCode()  → { ok, user_code, verification_uri, expires_in, interval }
window.api.auth.pollToken()          → { ok, user } | { ok: false, error: 'authorization_pending' | ... }
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
window.api.preview.getUrl(page, albumSlug?) → local:// URL

// Publish
window.api.publish.start()           → { ok, url } | { ok: false, error }
window.api.publish.onProgress(cb)    → cb({ step, message, percent })
window.api.publish.offProgress()

// GitHub
window.api.github.checkRepo()        → { ok, repoExists, hasData, repoName }
window.api.github.setupRepo()        → { ok, repoName, url }
window.api.github.checkDns(domain)   → { ok, status, message }
window.api.github.restoreFromRepo()  → { ok, filesRestored }

// Dialog
window.api.dialog.openImages()       → string[] | null  (absolute file paths)

// Utils — Electron 32+ ใช้ webUtils แทน file.path
window.api.utils.getPathForFile(file) → string  (absolute path จาก drag-dropped File object)

// Updater — events จาก main process
window.api.updater.onAvailable(cb)   → cb({ version, ... })
window.api.updater.onProgress(cb)    → cb({ percent, ... })
window.api.updater.onReady(cb)       → cb({ version, ... })
window.api.updater.install()         → void  (restart + install)
```

---

## Data Schema

### SiteObject (site.json)
```json
{
  "title": "string",           // SEO / browser tab only — may be empty
  "description": "string",
  "lang": "th | en",
  "home": {
    "layout": "grid | list",
    "headline": "string",      // shown on home page
    "subhead": "string",
    "intro": "string"
  },
  "nav": {
    "homeVisible": true,
    "aboutVisible": true,
    "links": [{ "label": "string", "url": "string" }]
  },
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
      "url": null,              // GitHub Releases URL (set after publish)
      "thumbUrl": null,          // thumbnail URL (set after publish)
      "localPath": null,         // absolute local path (set on photo add, used in preview)
      "thumbLocalPath": null,    // absolute local thumbnail path
      "contentHash": null,       // SHA-256 of original file (used for incremental upload)
      "uploadedHash": null       // hash at time of last upload (skip re-upload if equal)
    }
  ]
}
```

---

## Design Tokens (global.css)

```css
--bg:          #0f0f0f    /* background หลัก */
--bg-2:        #1a1a1a    /* panel, card */
--bg-3:        #242424    /* input, button */
--bg-4:        #2c2c2c    /* input focus */
--border:      #2e2e2e
--border-2:    #3a3a3a
--text:        #e8e8e8
--text-2:      #888       /* secondary */
--text-3:      #555       /* placeholder, hint */
--accent:      #d4f541    /* lime — primary action */
--accent-dim:  #a3c032    /* accent hover/pressed */
--danger:      #ff4d4d
--success:     #4dff91
--sidebar-w:   240px
--titlebar-h:  38px
--t-fast:      120ms ease
--font-sans:   Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
--font-mono:   "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace
```

---

## Theme Spec (สรุป)

Theme = 1 ไฟล์ `.html` ที่มี:
- HTML comment metadata (`@portfolio-theme`, `compatibility: portfolio-spec@1.4`)
- `<template data-page="home|album|about">` — แต่ละ template มี `{{inject-style}}` **ข้างใน** `<head>` ของ template นั้น
- `<style data-scope="global">`
- `<script data-scope="global">` (optional)
- inject keywords: `{{inject-style}}`, `{{inject-script}}` — ใช้ string replace ใน build.js **ไม่ใช่ Handlebars** (ต้องอยู่ข้างใน template block เท่านั้น — ถ้าอยู่นอก template จะถูกตัดทิ้ง)
- Handlebars helpers: `formatDate`, `albumUrl`, `imageUrl`, `thumbUrl`, `coverUrl`, `aspectRatio`, `photoCount`, `ifLang`, `ifOption`, `eq`, `add`

### 5 built-in themes

| Theme | Style | Font | BG | Special |
|---|---|---|---|---|
| `lumen` | Clean light editorial | Inter | #f5f5f3 | CSS grid, accent colour |
| `noir` | Dark cinematic | Cormorant + Inter | #0c0c0c | full-bleed drama, high contrast |
| `mono` | Swiss/Bauhaus | Inter | #ffffff | strict 3-col, 1px border grid |
| `film` | Analog darkroom | Space Mono + Cormorant | #1c1610 | sepia filter, contact-sheet, frame counter |
| `zen` | Japanese minimal | Playfair Display italic | #fafaf8 | text-list home (no images), masonry album |

### Critical rules for theme authors

1. **`{{inject-style}}` ต้องอยู่ใน `<head>` ของทุก `<template>` block** — ถ้าอยู่นอก template จะถูกตัดทิ้งและ CSS ไม่ถูก inject
2. **`site.nav` เป็น object ไม่ใช่ array** — ใช้ `{{site.nav.homeVisible}}` / `{{site.nav.links}}` ไม่ใช่ `{{#each site.nav}}`
3. **`site.owner.name` ไม่ใช่ `site.title`** — ใช้ `site.owner.name` สำหรับ logo/navbar; `site.title` เป็น SEO เท่านั้น
4. **`{{albumUrl this}}` รับได้ทั้ง slug string และ album object** — helper แยกแยะให้อัตโนมัติ
5. **`{{add @index 1}}`** — ต้องใช้ `add` helper สำหรับ 1-based index display (ลงทะเบียนแล้วใน build.js)

> ดูรายละเอียดเต็มและ AI prompt สำหรับสร้าง theme ใหม่ได้ที่ `resources/themes/THEME_AUTHORING_GUIDE.md`

---

## Preview System

- Build mode: `preview` — ใช้ `local://` URLs แทน GitHub Releases URLs
- `local://` custom protocol: registered เป็น privileged standard scheme ใน `index.js`
  - Chromium parses `local:///Users/foo` → hostname=`users`, pathname=`/foo`
  - Handler reconstructs: `/${hostname}${pathname}` = `/users/foo`
- WebView partition `persist:preview` — ต้อง register `local://` handler บน session นี้แยกต่างหาก
  - ทำใน `index.js` ผ่าน `session.fromPartition('persist:preview').protocol.handle('local', ...)`
  - และ `app.on('session-created', ...)` สำหรับ session ที่สร้างทีหลัง
- Webview sizing ใช้ **flex chain** ตลอด (ไม่ใช้ `position: absolute; inset: 0`) เพราะ Electron webview ต้องการ concrete height ผ่าน flex ถึงจะ render internal iframe ได้เต็ม
- Preview panel มี Desktop/Mobile toggle — mobile ใช้ 390px centered frame
- Rebuild strategy: แก้ site info/theme → rebuild all | แก้ album → rebuild album page only
- Google Analytics ไม่ inject ใน preview mode

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
- GitHub Pages propagate 1–5 นาทีหลัง push — PublishButton.jsx แสดง progress bar ที่นับถอยหลัง 2 นาทีและเปลี่ยนสถานะ DEPLOYING → LIVE
- Incremental publish: `contentHash` (SHA-256) เก็บตอน add photo, `uploadedHash` อัพเดทหลัง upload — skip รูปที่ `contentHash === uploadedHash` (TODO: implement ใน publish.js)
- First publish อาจนาน 5–10 นาทีถ้ามีรูปเยอะ — UX ต้องรองรับ

---

## Onboarding Flow

```
Login with GitHub (Device Flow — ไม่ต้องมี server)
→ requestDeviceCode() → แสดง user_code + verification_uri
→ user กรอก code ใน browser
→ pollToken() จนได้ token (หรือ expired)
→ checkRepo():
  Case A: ไม่มี repo           → setupRepo() → สร้างใหม่ + เปิด Pages
  Case B: มี repo + _data/     → ถาม restore หรือเริ่มใหม่
  Case C: มี repo ไม่มี _data/ → ถาม overwrite หรือยกเลิก
```

---

## Auto Update

ใช้ `electron-updater` + GitHub Releases ของ project repo — ไม่มี server ไม่มีค่าใช้จ่าย

- `autoUpdater.checkForUpdatesAndNotify()` เรียกใน `app.whenReady()` (production เท่านั้น)
- Events ส่งผ่าน IPC ไปยัง renderer → `UpdateBanner.jsx` แสดงผล
- `publish.owner` ใน package.json ตั้งเป็น `"EXH1B1T"` (GitHub org/user ที่ host releases)
- **macOS** — ต้องมี code signing (Apple Developer $99/ปี)
- **Windows** — SmartScreen warning ถ้าไม่มี EV cert

---

## App Icon

- SVG design: `<rect fill="#111111"/>` + two `<rect fill="#d4f541"/>` vertical bars (representing "1 1" in EXH1B1T)
- Script: `node scripts/generate-icons.js` — generates all sizes using sharp + macOS `iconutil`
  - macOS: 10-size iconset → `iconutil -c icns` → `build/icon.icns`
  - Windows: custom ICO binary writer (PNG blobs at 16/24/32/48/64/128/256px) → `build/icon.ico`
  - Linux/generic: `build/icon.png` (512×512)
- package.json: `"mac": { "icon": "build/icon.icns" }`, `"win": { "icon": "build/icon.ico" }`, `"linux": { "icon": "build/icon.png" }`

---

## Settings — Where Each Field Appears

| Field | Appears In Theme |
|---|---|
| `owner.name` | Nav bar logo (left), About page |
| `owner.bio` | About page |
| `owner.avatar` | About page |
| `home.headline` | Home page (hero text) |
| `home.subhead` | Home page (below headline) |
| `home.intro` | Home page (above album grid) |
| `social.*` | About page, footer |
| `title` | Browser tab `<title>` only — SEO |
| `description` | `<meta description>` only — SEO |
| `seo.googleAnalyticsId` | Inject in publish mode only |
| `theme.options` | Theme-specific (color, font overrides) |

Settings.jsx แสดง context badges (**Where** component) เพื่อบอก user ว่าแต่ละ field ไปปรากฏที่ไหนบนเว็บ

---

## Known Issues & TODO

### High Priority
- [ ] Drag & drop reorder — AlbumList และ PhotoGrid
- [ ] Photo caption/altText inline editor ใน PhotoGrid
- [ ] Incremental publish — implement `contentHash`/`uploadedHash` skip logic ใน publish.js

### Medium Priority
- [ ] Error handling ใน UI — แปล error เป็นภาษาคน
- [ ] GitHub Releases cleanup — ลบ release เก่าเมื่อ publish ใหม่
- [ ] Theme options UI (color picker, select, toggle สำหรับ `site.theme.options`)
- [ ] In-app GitHub signup guide สำหรับ new users

### Low Priority
- [ ] Keyboard shortcuts
- [ ] Code signing — macOS: Apple Developer $99/ปี, Windows: EV cert (excluded for now)
- [ ] Auto update UI banner ใน renderer (UpdateBanner.jsx มีแล้ว แต่ยังไม่ครบ UX)

### Completed ✓
- [x] `resources/themes/lumen.html` — clean light editorial theme
- [x] `resources/themes/noir.html` — dark cinematic theme
- [x] `resources/themes/mono.html` — Swiss/Bauhaus theme
- [x] `resources/themes/film.html` — analog darkroom theme
- [x] `resources/themes/zen.html` — Japanese minimal theme
- [x] `resources/themes/THEME_AUTHORING_GUIDE.md` — AI prompt + spec for custom themes
- [x] CSS Modules ครบทุก component
- [x] Drag & drop photo upload (`webUtils.getPathForFile` แทน deprecated `file.path`)
- [x] Auto update UI — `UpdateBanner.jsx`
- [x] Desktop/Mobile preview toggle
- [x] `local://` protocol for local photo preview in webview
- [x] HomeEditor, AboutEditor, NavEditor panels
- [x] `index.html` + Vite config (renderer dev server at localhost:5173)
- [x] HomeEditor first-run empty state (no albums) — "Start your portfolio" + 3-step guide
- [x] PublishButton propagation delay UI — 120s countdown bar, DEPLOYING → LIVE status
- [x] Editor.jsx default page = Home (`__home`) on startup
- [x] Settings.jsx context badges (Where component) — ทุก field บอก user ว่าไปแสดงที่ไหน
- [x] Settings sections renamed: Website → SEO & Browser Tab, Owner → Your Profile, Social → Social Links
- [x] App icon — `build/icon.icns` + `build/icon.ico` + `build/icon.png` + generation script
- [x] `package.json` publish.owner = "EXH1B1T", icon paths, files array, platform targets
- [x] `albumUrl` helper รับได้ทั้ง slug string และ album object
- [x] `add` Handlebars helper registered (สำหรับ `{{add @index 1}}`)

---

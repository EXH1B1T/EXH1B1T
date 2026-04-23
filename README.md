# EXH1B1T

**Your portfolio. Free forever.**

EXH1B1T is a free macOS / Windows desktop app that publishes a photo portfolio website to [GitHub Pages](https://pages.github.com) — no code, no monthly fees, no lock-in. Sign in with GitHub, drag in your photos, click Publish. That's it.

The site, the domain, the photos, and the repo all belong to you. If EXH1B1T disappears tomorrow, your site keeps running.

---

## Features

- **Truly free** — no subscription, no trial, no "free tier with limits". Runs on your machine, publishes to your GitHub account.
- **Zero code** — the app handles git, hosting setup, image optimisation, and SEO. You never see a terminal.
- **You own everything** — your GitHub repo, your domain, your photos. No platform lock-in.
- **Editorial design** — themes built for photography, not generic business websites.
- **Dark, minimal editor** — 3-column split view: sidebar, editor, live preview.
- **Image optimisation** — auto-resizes to 2400px max, generates thumbnails, uploads to GitHub Releases.
- **Custom domain** — point any domain at your GitHub Pages site with built-in DNS guide.
- **Auto-updates** — silent background updates via GitHub Releases.

---

## How it works

```
Sign in with GitHub (one-time device flow — no password stored)
  ↓
EXH1B1T creates a [username].github.io repo in your account
  ↓
Add albums, drag in photos, edit text
  ↓
Click Publish — app optimises images, uploads to GitHub Releases,
builds HTML, and pushes to GitHub Pages
  ↓
Your site is live at username.github.io
```

---

## Download

> Releases coming soon.

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [EXH1B1T-1.0.0-arm64.dmg](#) |
| macOS (Intel) | [EXH1B1T-1.0.0-x64.dmg](#) |
| Windows | [EXH1B1T-Setup-1.0.0.exe](#) |

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Git](https://git-scm.com)

### Setup

```bash
git clone https://github.com/EXH1B1T/EXH1B1T.git
cd EXH1B1T
npm install
```

### Run in dev mode

```bash
npm run dev
```

Starts Vite (renderer) and Electron concurrently. DevTools open automatically.

### Build

```bash
npm run build
```

Outputs a `.dmg` (macOS) or `.exe` installer (Windows) to `dist/`.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Desktop | Electron 33 |
| UI | React 18 + CSS Modules |
| Templates | Handlebars 4 |
| Image processing | sharp |
| GitHub API | @octokit/rest |
| Local storage | electron-store |
| Auto-update | electron-updater |
| Build tool | Vite 7 |

---

## Architecture

EXH1B1T has no backend. Everything runs on the user's machine and communicates directly with the GitHub API.

```
Electron (Main Process)
├── GitHub Device Flow OAuth  — no server, no redirect URI, no client secret
├── Image processing (sharp)  — resize, thumbnail, JPEG optimisation
├── Site builder (Handlebars) — generates HTML from templates + user data
└── GitHub API (Octokit)      — uploads photos to Releases, pushes HTML to Pages

Renderer (React)
├── Editor — sidebar + editor panel + live preview (webview)
└── Onboarding — GitHub login flow

Data lives in:
├── ~/.config/EXH1B1T/         — electron-store (token, user)
├── ~/.config/EXH1B1T/data/    — site.json, albums/*.json, photos/
└── github.com/[user].github.io — source of truth, user-owned
```

**Why GitHub?** One account gives you: a repo, free hosting (Pages), and unlimited asset storage (Releases). The rate limit (5,000 req/hr) belongs to the user, not us. If EXH1B1T shuts down, the repo and site remain untouched.

---

## Themes

Themes are single `.html` files installed via Settings → Theme. A theme contains:

- HTML comment metadata (`@portfolio-theme`, compatibility version)
- `<template data-page="home|album|about">` blocks
- `<style data-scope="global">` for styles
- Handlebars template syntax for data injection

To install a community theme: **Settings → Theme → Install Theme** and pick a `.html` file.

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first.

```bash
# Run in dev mode
npm run dev

# The renderer is in src/renderer/
# Main process is in src/main/
# Shared constants are in src/shared/types.js
```

A few things to keep in mind:
- No CSS framework — CSS Modules + CSS variables only
- Dark theme only — design tokens defined in `src/renderer/styles/global.css`
- IPC bridge is `window.api.*` — see `src/main/preload.js` for the full interface

---

## License

[MIT](LICENSE)

---

*Built for photographers who are tired of paying monthly for something they should own.*

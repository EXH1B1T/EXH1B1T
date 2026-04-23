# EXH1B1T — Landing Page Design Brief

**For:** Claude Design
**From:** Marketing
**Date:** 2026-04-24
**Deliverable requested:** Landing page design (desktop-first, responsive) promoting the EXH1B1T app and driving downloads.

---

## 1. TL;DR — what to design

A single marketing landing page at the app's public website (e.g. `exh1b1t.app`) whose only job is to get a photographer to click **Download for Mac / Windows**. The page should feel like it was built by photographers for photographers — image-first, generous whitespace, typography you'd trust on a printed monograph — but written with a warm, human voice (not a corporate "Enterprise SaaS" tone). The core promise: *a beautiful portfolio site you actually own, for free, forever — with zero code and zero subscriptions.*

---

## 2. Product in one paragraph

EXH1B1T is a free macOS / Windows desktop app that turns a folder of photos into a published portfolio website in minutes. Photographers sign in with GitHub, drag in their images, and the app builds a clean editorial site and publishes it to GitHub Pages under their own account. No servers, no monthly bills, no lock-in — the site, the domain, the photos, and the repo all belong to the user. If EXH1B1T disappears tomorrow, their site keeps running.

---

## 3. Audience

**Primary persona — "The Pro / Semi-Pro Photographer"**
- 25–45, shoots paid work: weddings, editorial, commercial, fine art, travel.
- Currently on Squarespace, Format, Adobe Portfolio, Wix, or a dated WordPress site.
- Pays $12–$40/month they resent paying.
- Cares deeply about how images are presented — typography, spacing, grid, image quality.
- Is not a developer. Has never touched `git`. Would panic at the word "terminal".
- Buys Adobe CC, Capture One, film stock, lenses — willing to invest in craft tools, but tired of subscription creep.

**Secondary persona — "The Creative Switcher"**
- Illustrator, designer, or multi-disciplinary creative who wants a minimal portfolio and is frustrated with template sites that all look the same.

**Not the audience (explicitly):**
- Developers looking for a Jekyll/Hugo/Astro alternative — they already solved this problem.
- Hobbyists who want social features. EXH1B1T is a portfolio, not a community.
- Agencies or teams. This is a single-user product, one site per user.

---

## 4. Positioning & messaging

### Positioning statement
> For professional photographers who are tired of paying monthly for a portfolio site, EXH1B1T is a free desktop app that publishes a beautiful, editorial portfolio to your own GitHub account — so you own the site, the domain, and the photos, forever. Unlike Squarespace, Format, or Adobe Portfolio, there's no subscription and no platform that can take your work offline.

### Messaging pillars (in priority order)

**1. Truly free. No subscription. No asterisks.**
Not a trial. Not "free tier with limits". Free because it runs on your machine and publishes to your GitHub account — there's no server we'd have to pay for. Emphasize the annual cost savings ("the cost of a lens over 3 years") without being crass.

**2. You own your site. For real.**
The repo is yours. The domain is yours. The photos are yours. If EXH1B1T shuts down, your site keeps running. If you want to leave, you can — we don't hold anything hostage. This is the *opposite* of platform risk.

**3. Designed like a real portfolio, not a template.**
The default theme is editorial and restrained — serif display type (Cormorant Garamond), clean sans for UI (Inter), masonry grid, proper lightbox. Built for photography, not for generic "creative business websites."

**4. Zero code. Drag, drop, publish.**
The app does the git, the hosting setup, the image optimization, the SEO — all of it. User never sees a command line. The only things they do are (a) log in once, (b) drag photos in, (c) click Publish.

### Tone of voice
- **Friendly and human** — writes like a peer, not a sales page. Contractions, short sentences, the occasional aside.
- **Quietly confident** — doesn't need to shout. The product speaks for itself; the copy gets out of the way.
- **Specific, not fluffy** — "publishes to your own GitHub account in 2 minutes" beats "streamlined publishing workflow."
- **Honest about trade-offs** — GitHub Pages takes a few minutes to propagate; say so. First publish of a big archive can take 10 minutes; say so. Honesty builds trust with pros.
- **Never patronizing** — the audience is smart and busy. Don't explain obvious things twice.

### Don'ts
- No "revolutionize," "game-changer," "unleash," "empower," "supercharge."
- No stock photos of people high-fiving. Actual photography only, ideally from real users eventually.
- No dark patterns (countdown timers, fake scarcity).
- No "Enterprise" or "Teams" talk — this is a single-photographer product and that's the strength.

---

## 5. Competitive context (for the designer's awareness, not to put on the page)

| Competitor | Price | What they do well | Where EXH1B1T wins |
|---|---|---|---|
| Squarespace | $16–$49/mo | Polished, lots of templates | Cost, ownership, less bloat |
| Format | $7–$25/mo | Photographer-focused | Cost, ownership |
| Adobe Portfolio | Bundled w/ CC ($20+/mo) | Free "if you already pay Adobe" | Works without Adobe; truly free |
| Cargo | $13/mo | Beautiful editorial templates | Cost, ownership |
| Pixieset | $8–$50/mo | Client galleries + portfolio | Focused, portfolio-only |
| Self-hosted (Jekyll, Astro) | Free | Full control | No code required |

**Do not bash competitors on the page.** State the EXH1B1T promise plainly and let the comparison speak for itself. A quiet "no monthly fee" next to a logo grid of paid alternatives is more powerful than a takedown.

---

## 6. Page structure (recommended sections, top to bottom)

The designer is welcome to consolidate, reorder, or reshape these. This is a map of what the page needs to communicate, not a prescribed layout.

### 6.1 Hero
- Headline (one line, confident): e.g. *"A portfolio site you actually own."*
- Subhead (one sentence, specific): e.g. *"Free desktop app for photographers. Drag in your photos, click publish, get a clean editorial site on your own domain. No code, no subscription, no catch."*
- Primary CTA: **Download for Mac** / **Download for Windows** (detect OS, show the matching one first; other is secondary link).
- Secondary CTA: "See a sample site" or "How it works" (anchor-scroll).
- Hero visual: *the app's editor view* with a real portfolio being built — split-view UI visible, a live preview of a gorgeous photo site on the right. This shows the whole product in one glance.
- Trust line under the buttons: "Free forever. Mac & Windows. No account needed to try."

### 6.2 The promise — three-up value props
Three short tiles, each with a small icon or visual, headline, and a line of supporting copy. Map 1:1 to the top three messaging pillars:
1. **Free. Not "free trial" — free.** *Runs on your machine, publishes to your GitHub. No servers, no subscription.*
2. **Your site, your files, your domain.** *Everything lives in your GitHub account. We can't take it away. You can walk away any time.*
3. **Built for photographs.** *Editorial typography, proper masonry, clean lightbox. Your images, not our branding.*

### 6.3 How it works — 3 steps
A visual walkthrough, numbered 1-2-3, each with a screenshot or short motion clip:
1. **Connect your GitHub.** One-click sign-in. No server, no passwords stored.
2. **Drag in your photos.** Organize into albums, write captions, pick a cover. The app handles resizing and optimization.
3. **Click publish.** The app pushes your site to GitHub Pages. You get a live URL in minutes — or point your custom domain.

Keep this short. The *how* is proof the promise is real, not a manual.

### 6.4 The site it builds — gallery / showcase
This is the emotional sell for a photographer. A scrolling showcase of 3–6 example sites built with EXH1B1T, each clickable to the live URL. Ideally real user sites once we launch; placeholder sites styled as real ones for the initial design. Emphasize:
- Typography (Cormorant Garamond headlines, Inter UI).
- Generous whitespace.
- Masonry grids that don't crop photos.
- Proper full-screen lightbox.
- Mobile view mock alongside desktop.

### 6.5 "But is it actually free?" — honest FAQ-style section
Address the skepticism head-on. Short, direct answers, written like a person, not a help center.
- *"Wait, how is this free?"* → *"Your site runs on GitHub Pages, which is free for personal sites. The app runs on your computer. We don't host anything, so there's nothing to charge you for."*
- *"Do I need a GitHub account?"* → *"Yes, and it's free. The app walks you through signup if you don't have one."*
- *"Can I use my own domain?"* → *"Yes. Point your domain at GitHub Pages; the app sets up DNS guidance for you."*
- *"What happens to my site if EXH1B1T shuts down?"* → *"Nothing. Your site keeps running on GitHub. Your photos, captions, and code are all in a repo you own."*
- *"How long does publishing take?"* → *"A few seconds to push, then 1–5 minutes for GitHub Pages to serve it. First-time big archives can take longer — we'll show a progress bar."*
- *"Can I edit the design?"* → *"Yes. Install a different theme, or drop in your own HTML theme if you know what you're doing."*

### 6.6 Comparison strip (optional, subtle)
A clean table: EXH1B1T vs. Squarespace vs. Format vs. Adobe Portfolio. Rows: *Price, You own the site, Custom domain, No code, Image optimization, Analytics.* Let the left column be all ✓ and mostly $0; let the reader do the math. No smug copy.

### 6.7 Social proof
At launch there won't be user testimonials yet. Options for the initial design:
- Leave a placeholder block (3 quote cards) clearly marked as "coming post-launch" in the design doc.
- Or substitute with a row of "as featured in" / community links if any exist.
- Or a screenshot gallery of real sites built with EXH1B1T (again, placeholders at first).
Designer should include the block in the layout so it's easy to populate later.

### 6.8 Final CTA
Quiet, confident close.
- Headline: *"Your portfolio. Your site. No rent."*
- Subhead: one line restating the free + ownership promise.
- Download buttons (Mac + Windows), side by side.
- Tiny footer link: *"Or see the source on GitHub →"* (appeals to pros who want to verify the trust claim).

### 6.9 Footer
Minimal. Logo, one-liner tagline, small links: *About · Themes · Privacy · GitHub · Contact.* No social media icons unless we actually maintain those accounts.

---

## 7. Design direction

### Mood
Editorial. Think the gallery wall of a contemporary photo museum, or the first spread of a good photography monograph. **Images are the loudest thing on the page.** The app UI screenshots are second. The text is a confident whisper, not a pitch.

### References (directional, not to copy)
- **Cargo.site** — typography-first, image-respectful layouts.
- **Are.na** — restrained UI, trust the content.
- **Linear's marketing site** — clean structure, confident single-line headlines, great product screenshots.
- **Framer's homepage** — good rhythm between product imagery and copy, but less "design-agency" than Framer itself.
- **Ghost.org** — good model for "honest about how it works" sections.
- **Editorial photo sites** — *National Geographic Storytelling, Magnum Photos* — for how images should be framed and spaced.

### Color & type
Follow the app's own design tokens so the site feels continuous with the product:
- **Background:** near-black (`#0f0f0f`) for hero / bold sections; off-white for body sections.
- **Panel / card backgrounds:** `#1a1a1a` on dark; soft neutral on light.
- **Primary accent:** lime `#d4f541` — use *sparingly* for the primary CTA and the occasional highlight. Do not saturate the page with it.
- **Text:** `#e8e8e8` on dark, very dark gray on light. Secondary text at lower contrast.
- **Headline type:** Cormorant Garamond (or the closest web-safe fallback), matching the default theme.
- **Body / UI type:** Inter.
- **Mono (for code-like accents, if any):** JetBrains Mono.

### Grid & spacing
- Wide, generous max-width for hero and showcase (1280–1440px).
- Vertical rhythm is confident — don't cram. Real portfolio sites breathe, and so should this one.
- Consistent 8px spacing scale.

### Imagery
- Treat every photo on the page like a hero image. No thumbnails from stock libraries.
- App screenshots should be crisp (2x retina assets), framed in a clean macOS-style window chrome, and show the app *doing its job on a real portfolio* — not empty states.
- If illustrations are used at all, keep them secondary to photography.

### Motion
- Subtle. Hover states, scroll reveals, the occasional UI demo that plays once. No parallax layering, no aggressive scroll-jacking.
- Loading state for the download CTA should feel tactile — photographers notice craft.

---

## 8. Responsive & platform

- **Desktop-first** (the audience browses for tools on a laptop), but must feel as polished on mobile.
- **Mobile hero:** stack cleanly, single CTA button (auto-detect OS), screenshot scaled and centered.
- **Showcase section:** horizontal scroll on mobile is fine; do not collapse the showcase to a dull vertical list.
- **Performance budget:** hero image LCP < 2.5s on 4G. Lazy-load showcase images. Photographers have good phones and fast eyes — a slow page contradicts the whole pitch.

---

## 9. Must-haves (non-negotiable)

1. Download CTAs above the fold on every breakpoint, with OS auto-detection.
2. At least one *real* screenshot of the app editor in the hero.
3. At least one *real* rendered portfolio site shown on the page (can be a demo site at launch).
4. An honest "how is this free?" explanation — visible without having to click a FAQ dropdown.
5. Compliance / footer links: Privacy, About, GitHub repo link.
6. Open Graph / Twitter card meta with a well-designed share image (probably the hero shot).
7. Lightweight analytics (privacy-respecting — Plausible, Fathom, or similar). No third-party ad trackers — would contradict the ownership pitch.

---

## 10. Out of scope for this design

- Pricing page (there's no pricing).
- Login / auth flows (those live in the app).
- Docs / help center (separate site).
- Blog (can be added later; leave a `/blog` route mentally reserved but no design needed now).

---

## 11. Success metrics

Success for the landing page:
- **Download conversion rate:** >8% of unique visitors click a platform-specific download button.
- **Time on page:** 60s+ median (indicates they read past the hero).
- **Scroll depth:** 50%+ of visitors reach the showcase section.
- **Bounce-back:** <30% bounce from hero alone.
- **Asset weight:** page weight under 1.5MB (excluding lazy-loaded showcase images).

---

## 12. Key facts about the app (for accuracy)

For the designer's reference — please reflect these faithfully in any copy or illustrations:

- **Platforms:** macOS and Windows desktop app (Electron).
- **Login:** GitHub Device Flow — user sees a code on-screen, opens a browser, authorizes. No server, no redirect URI.
- **Storage model:** site content lives in a `[username].github.io` repo on main branch; photos live in GitHub Releases on that same repo (so they don't count against the 1GB repo limit).
- **Hosting:** GitHub Pages (free for personal sites).
- **Custom domain:** supported via CNAME — the app guides users through DNS setup.
- **Default theme:** editorial / minimal, masonry grid, lightbox, Cormorant Garamond + Inter.
- **Image processing:** handled locally via `sharp` — resize to 2400px max, JPEG q85, auto-thumbnails at 600px.
- **Updates:** auto-update via `electron-updater` + GitHub Releases.
- **One user = one portfolio.** No multi-site per user in v1.

---

## 13. Deliverables requested from Claude Design

1. **Desktop wireframes** (low-fidelity) for the full page — sections 6.1–6.9.
2. **Desktop hi-fi mockup** — hero, promise tiles, how-it-works, showcase, FAQ, final CTA, footer.
3. **Mobile hi-fi mockup** — hero, how-it-works, showcase, final CTA.
4. **OG / social share image** — single hero visual sized for Open Graph and Twitter.
5. **Copy deck** — final headline and body copy per section, ready to hand to a dev.
6. **Design tokens doc** — colors, type, spacing, component specs, aligned to the app's own tokens (section 7).
7. **One-page handoff** — Figma file or equivalent, with annotations on interactions (hover states, OS detection, scroll reveals).

If time permits: an alt hero concept (different headline angle) so we can A/B test.

---

## 14. Open questions for Claude Design to flag back

Mark any of these you want Marketing to answer before you start:
- Do we have real portfolio sites to feature at launch, or should the showcase use designed placeholders?
- Is the domain `exh1b1t.app`, `exh1b1t.com`, or something else? (Affects footer + meta.)
- Any existing logo / wordmark, or does the design include logo exploration?
- Do we have any early access signups / Discord / newsletter we should point to?

---

*End of brief. Thanks — shout if anything here is unclear or contradicts something you know about the product.*

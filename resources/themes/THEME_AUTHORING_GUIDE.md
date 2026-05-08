# EXH1B1T Theme Authoring Guide
> Use this document as a system prompt when asking an AI to create a new theme.

---

## What is a Theme?

A theme is **a single `.html` file** placed in `resources/themes/`.  
It contains all CSS, all page templates, and optional JS — nothing else.  
The build engine extracts each `<template>` block, injects styles/scripts, runs Handlebars, and writes the final HTML pages.

---

## File Structure (required)

```
<!--
  @portfolio-theme   your-theme-name
  @description       One-line description of the theme.
  @preview-bg        #rrggbb   ← card background in theme picker
  @preview-surface   #rrggbb   ← card surface/accent color
  @preview-text      #rrggbb   ← card text color
  @preview-muted     #rrggbb   ← card muted/border color
  @preview-font      FontName  ← font name shown on card (display name only)
  compatibility: portfolio-spec@1.4
-->

<style data-scope="global">
  /* ALL CSS goes here — one block, shared by all pages */
</style>

<template data-page="home">
  <!DOCTYPE html>…</html>
  {{inject-style}}     ← MUST be inside this template, before </body> or in <head>
  {{inject-script}}    ← MUST be inside this template, before </body>
</template>

<template data-page="album">
  <!DOCTYPE html>…</html>
  {{inject-style}}
  {{inject-script}}
</template>

<template data-page="about">
  <!DOCTYPE html>…</html>
  {{inject-style}}
  {{inject-script}}
</template>

<script data-scope="global">
  /* Optional: shared JS injected into every page via {{inject-script}} */
  /* Use IntersectionObserver for scroll animations here */
</script>
```

### ⚠️ Critical rules

| Rule | Wrong | Correct |
|------|-------|---------|
| `{{inject-style}}` placement | Outside `</template>` at end of file | **Inside** every `<template>` block |
| `{{inject-script}}` placement | Outside `</template>` | **Inside** every `<template>` block |
| Must have | — | All three templates: `home`, `album`, `about` |
| Metadata comment | Missing | Required at top of file |

---

## Available Handlebars Helpers

These are the **only** registered helpers. Do not invent others.

### Data helpers

```handlebars
{{site.owner.name}}          → photographer's name  (use for nav logo, headings)
{{site.title}}               → site title           (use only in <title> tag — SEO only)
{{site.description}}         → meta description     (use only in <meta> tag — SEO only)
{{site.lang}}                → "en" | "th" | "ja"
{{site.owner.bio}}           → bio paragraph text
{{site.social.instagram}}    → instagram username (no @), empty string if not set
{{site.social.facebook}}     → facebook username
{{site.social.email}}        → email address
{{site.seo.googleAnalyticsId}}  → "G-XXXXXXXXXX" or empty
{{site.seo.faviconUrl}}      → URL string or empty
{{site.home.headline}}       → optional hero headline (set in Home editor)
{{site.home.subhead}}        → optional hero subheading
{{site.home.intro}}          → optional intro paragraph
{{site.home.layout}}         → "grid" | "list"  (user's chosen layout)
```

### Function helpers

```handlebars
{{albumUrl slug}}
  → "/albums/portrait"
  → Argument: the album's slug STRING (e.g. {{albumUrl slug}} or {{albumUrl this.slug}})
  → ⚠️ Do NOT pass the whole album object: {{albumUrl this}} will work but {{albumUrl slug}} is clearer

{{formatDate dateStr}}
  → "June 2024"
  → Argument: a date string like "2024-06" or "2024-06-15"

{{photoCount album}}
  → 12  (integer)
  → Argument: the album OBJECT (has .photos array)

{{coverUrl album}}
  → URL string for the cover photo, or empty string if no photos
  → Argument: the album OBJECT
  → Returns the designated cover photo URL, or falls back to the first photo
  → ⚠️ Always returns a URL when any photo exists — use {{#if album.coverPhoto}} to check if cover was explicitly set

{{imageUrl photo}}
  → Full-size image URL
  → Argument: a photo OBJECT from album.photos

{{thumbUrl photo}}
  → Thumbnail image URL (600px wide)
  → Argument: a photo OBJECT from album.photos

{{aspectRatio photo}}
  → "1920 / 1080"  (CSS aspect-ratio value)
  → Argument: a photo OBJECT

{{add numberA numberB}}
  → 3   (numberA + numberB)
  → Used for 1-based index: {{add @index 1}}

{{eq valueA valueB}}
  → true/false
  → Used in {{#if (eq ...)}} conditions
```

### Block helpers

```handlebars
{{#if (eq site.home.layout 'list')}} ... {{else}} ... {{/if}}

{{#unless (eq site.nav.homeVisible false)}} ... {{/unless}}

{{#ifLang "th"}} Thai content {{else}} Other {{/ifLang}}

{{#ifOption "key" "value"}} ... {{/ifOption}}
```

---

## Data Schema

### `site` object
```js
{
  title: "string",
  description: "string",
  lang: "en" | "th" | "ja",
  owner: { name: "string", bio: "string", avatar: "url or null" },
  social: { instagram: "username", facebook: "username", email: "address" },
  seo: { googleAnalyticsId: "G-XXX or null", faviconUrl: "url or null" },
  home: { headline: "string", subhead: "string", intro: "string", layout: "grid" | "list" },
  nav: {
    homeVisible: true,     // ← boolean, NOT an array
    aboutVisible: true,
    links: [{ label: "string", url: "string" }]
  },
  theme: { name: "string", options: {} }
}
```

### `albums` array (home page)
```js
[
  {
    slug: "portrait",
    title: "Portrait",
    description: "string or null",
    date: "2024-06",
    coverPhoto: "filename.jpg or null",
    order: 0,
    photos: [ /* photo objects */ ]
  }
]
```

### `album` object (album page)
```js
{
  slug: "portrait",
  title: "Portrait",
  description: "string or null",
  date: "2024-06",
  coverPhoto: "filename.jpg or null",
  photos: [
    {
      filename: "shot.jpg",
      altText:  "string or null",
      caption:  "string or null",
      width:    1920,
      height:   1080,
      order:    0,
      url:      "https://cdn/shot.jpg",       // full-size
      thumbUrl: "https://cdn/thumb-shot.jpg"  // 600px thumbnail
    }
  ]
}
```

---

## Navigation — Correct Pattern

`site.nav` is an **object**, not an array. Use this exact pattern in all 3 templates:

```handlebars
<nav>
  <a href="/">{{site.owner.name}}</a>
  <ul>
    {{#unless (eq site.nav.homeVisible false)}}<li><a href="/">Work</a></li>{{/unless}}
    {{#unless (eq site.nav.aboutVisible false)}}<li><a href="/about">About</a></li>{{/unless}}
    {{#if site.nav.links}}{{#each site.nav.links}}
    <li><a href="{{url}}">{{label}}</a></li>
    {{/each}}{{/if}}
    {{#if site.social.instagram}}
    <li><a href="https://instagram.com/{{site.social.instagram}}" target="_blank" rel="noreferrer">Instagram</a></li>
    {{/if}}
  </ul>
</nav>
```

**Logo**: always use `{{site.owner.name}}` — NOT `{{site.title}}` (title is SEO-only).

---

## Iterating Albums and Photos

```handlebars
<!-- Home page: loop over albums -->
{{#each albums}}
  <a href="{{albumUrl slug}}">        ← use `slug` (the property), not `this`
    <img src="{{coverUrl this}}">     ← use `this` (the album object)
    <span>{{title}}</span>            ← shorthand for {{this.title}}
    <span>{{formatDate date}}</span>
    <span>{{photoCount this}} photos</span>
  </a>
{{/each}}

<!-- Album page: loop over photos -->
{{#each album.photos}}
  <img src="{{thumbUrl this}}"        ← `this` = photo object ✓
       alt="{{altText}}"
       loading="lazy">
  <a href="{{imageUrl this}}">        ← full-size for lightbox ✓
  {{#if caption}}<p>{{caption}}</p>{{/if}}
{{/each}}
```

---

## Lightbox — Standard Pattern

Use this JS pattern for the album page lightbox (class name `lb--open` is required):

```html
<div class="lb" id="lb">
  <button id="lb-close">×</button>
  <button id="lb-prev">‹</button>
  <img id="lb-img" src="" alt="">
  <button id="lb-next">›</button>
</div>

<script>
(function(){
  var photos = [
    {{#each album.photos}}
    { full: "{{imageUrl this}}", alt: "{{altText}}" }{{#unless @last}},{{/unless}}
    {{/each}}
  ];
  var lb = document.getElementById('lb'), img = document.getElementById('lb-img');
  var cur = 0;
  function show(i) {
    cur = (i + photos.length) % photos.length;
    img.src = photos[cur].full;
    img.alt = photos[cur].alt || '';
    lb.classList.add('lb--open');      // ← 'lb--open' is required
  }
  document.querySelectorAll('.photo-item').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      show(+el.dataset.lbIndex);
    });
  });
  document.getElementById('lb-close').onclick = function() { lb.classList.remove('lb--open'); };
  document.getElementById('lb-prev').onclick  = function() { show(cur - 1); };
  document.getElementById('lb-next').onclick  = function() { show(cur + 1); };
  lb.addEventListener('click', function(e) { if (e.target === lb) lb.classList.remove('lb--open'); });
  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('lb--open')) return;
    if (e.key === 'ArrowLeft')  show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'Escape')     lb.classList.remove('lb--open');
  });
})();
</script>
```

---

## Scroll Animation — Standard Pattern

Put this in `<script data-scope="global">` (outside all templates):

```html
<script data-scope="global">
(function(){
  var els = document.querySelectorAll('.album-card, .photo-item');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function(e) { e.style.opacity = 1; });
    return;
  }
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (en.isIntersecting) { en.target.style.opacity = 1; io.unobserve(en.target); }
    });
  }, { threshold: 0.05 });
  els.forEach(function(e) {
    e.style.opacity = 0;
    e.style.transition = 'opacity 0.5s ease';
    io.observe(e);
  });
})();
</script>
```

---

## Page-specific Variables

| Template | Extra variables available |
|----------|--------------------------|
| `home`   | `site`, `albums` (array), `mode` |
| `album`  | `site`, `albums` (array), `album` (object), `mode` |
| `about`  | `site`, `albums` (array), `mode` |

`mode` is `"preview"` or `"publish"` — rarely needed.

---

## SEO / Head Tags Pattern

Each template should include a proper `<head>`:

```handlebars
<!-- home -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{site.title}}</title>
  <meta name="description" content="{{site.description}}">
  {{#if site.seo.googleAnalyticsId}}
  <script async src="https://www.googletagmanager.com/gtag/js?id={{site.seo.googleAnalyticsId}}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','{{site.seo.googleAnalyticsId}}');</script>
  {{/if}}
  {{#if site.seo.faviconUrl}}<link rel="icon" href="{{site.seo.faviconUrl}}">{{/if}}
  {{inject-style}}
</head>

<!-- album -->
<title>{{album.title}} — {{site.owner.name}}</title>

<!-- about -->
<title>About — {{site.owner.name}}</title>
```

---

## Common Mistakes Checklist

Before submitting a theme, verify:

- [ ] `{{inject-style}}` is inside **every** `<template>` block (home, album, about)
- [ ] `{{inject-script}}` is inside **every** `<template>` block
- [ ] Navigation uses `{{site.nav.homeVisible}}` pattern — NOT `{{#each site.nav}}`
- [ ] Logo uses `{{site.owner.name}}` — NOT `{{site.title}}`
- [ ] Album links use `{{albumUrl slug}}` — NOT `{{albumUrl this}}`
- [ ] `coverUrl`, `photoCount`, `aspectRatio` receive the **album object**
- [ ] `imageUrl`, `thumbUrl` receive the **photo object** (inside `{{#each album.photos}}`)
- [ ] Only registered helpers are used (see list above — no custom helpers)
- [ ] Metadata comment at top includes `@portfolio-theme`, `@preview-*` fields, and `compatibility: portfolio-spec@1.4`
- [ ] All three templates exist: `data-page="home"`, `data-page="album"`, `data-page="about"`
- [ ] Lightbox uses class `lb--open` to show/hide (required by the app)

---

## Minimal Working Template

Use this skeleton as your starting point:

```html
<!--
  @portfolio-theme   my-theme
  @description       Short description here.
  @preview-bg        #ffffff
  @preview-surface   #f0f0f0
  @preview-text      #111111
  @preview-muted     #e0e0e0
  @preview-font      Inter
  compatibility: portfolio-spec@1.4
-->

<style data-scope="global">
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  /* Add all your CSS here */
</style>

<template data-page="home">
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{site.title}}</title>
  {{inject-style}}
</head>
<body>

<nav>
  <a href="/">{{site.owner.name}}</a>
  <ul>
    {{#unless (eq site.nav.homeVisible false)}}<li><a href="/">Work</a></li>{{/unless}}
    {{#unless (eq site.nav.aboutVisible false)}}<li><a href="/about">About</a></li>{{/unless}}
    {{#if site.nav.links}}{{#each site.nav.links}}<li><a href="{{url}}">{{label}}</a></li>{{/each}}{{/if}}
  </ul>
</nav>

<main>
  {{#each albums}}
  <a href="{{albumUrl slug}}">
    {{#if (coverUrl this)}}<img src="{{coverUrl this}}" alt="{{title}}">{{/if}}
    <span>{{title}}</span>
    <span>{{formatDate date}}</span>
  </a>
  {{/each}}
</main>

<footer><span>© {{site.owner.name}}</span></footer>

{{inject-script}}
</body>
</html>
</template>

<template data-page="album">
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{album.title}} — {{site.owner.name}}</title>
  {{inject-style}}
</head>
<body>

<nav>
  <a href="/">{{site.owner.name}}</a>
  <ul>
    {{#unless (eq site.nav.homeVisible false)}}<li><a href="/">Work</a></li>{{/unless}}
    {{#unless (eq site.nav.aboutVisible false)}}<li><a href="/about">About</a></li>{{/unless}}
    {{#if site.nav.links}}{{#each site.nav.links}}<li><a href="{{url}}">{{label}}</a></li>{{/each}}{{/if}}
  </ul>
</nav>

<main>
  <h1>{{album.title}}</h1>
  <p>{{formatDate album.date}} · {{photoCount album}} photos</p>
  {{#if album.description}}<p>{{album.description}}</p>{{/if}}

  {{#each album.photos}}
  <a href="{{imageUrl this}}" data-lb-index="{{@index}}">
    <img src="{{thumbUrl this}}" alt="{{altText}}" loading="lazy">
  </a>
  {{/each}}
</main>

<!-- Lightbox -->
<div class="lb" id="lb">
  <button id="lb-close">×</button>
  <button id="lb-prev">‹</button>
  <img id="lb-img" src="" alt="">
  <button id="lb-next">›</button>
</div>

<script>
(function(){
  var photos=[{{#each album.photos}}{full:"{{imageUrl this}}",alt:"{{altText}}"}{{#unless @last}},{{/unless}}{{/each}}];
  var lb=document.getElementById('lb'),img=document.getElementById('lb-img'),cur=0;
  function show(i){cur=(i+photos.length)%photos.length;img.src=photos[cur].full;img.alt=photos[cur].alt||'';lb.classList.add('lb--open');}
  document.querySelectorAll('[data-lb-index]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();show(+el.dataset.lbIndex);});});
  document.getElementById('lb-close').onclick=function(){lb.classList.remove('lb--open');};
  document.getElementById('lb-prev').onclick=function(){show(cur-1);};
  document.getElementById('lb-next').onclick=function(){show(cur+1);};
  lb.addEventListener('click',function(e){if(e.target===lb)lb.classList.remove('lb--open');});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('lb--open'))return;if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='ArrowRight')show(cur+1);else if(e.key==='Escape')lb.classList.remove('lb--open');});
})();
</script>

{{inject-script}}
</body>
</html>
</template>

<template data-page="about">
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About — {{site.owner.name}}</title>
  {{inject-style}}
</head>
<body>

<nav>
  <a href="/">{{site.owner.name}}</a>
  <ul>
    {{#unless (eq site.nav.homeVisible false)}}<li><a href="/">Work</a></li>{{/unless}}
    {{#unless (eq site.nav.aboutVisible false)}}<li><a href="/about">About</a></li>{{/unless}}
    {{#if site.nav.links}}{{#each site.nav.links}}<li><a href="{{url}}">{{label}}</a></li>{{/each}}{{/if}}
  </ul>
</nav>

<main>
  {{#if site.owner.avatar}}<img src="{{site.owner.avatar}}" alt="{{site.owner.name}}">{{/if}}
  <h1>{{site.owner.name}}</h1>
  {{#if site.owner.bio}}<p>{{site.owner.bio}}</p>{{/if}}
  <div>
    {{#if site.social.instagram}}<a href="https://instagram.com/{{site.social.instagram}}" target="_blank" rel="noreferrer">Instagram</a>{{/if}}
    {{#if site.social.facebook}}<a href="https://facebook.com/{{site.social.facebook}}" target="_blank" rel="noreferrer">Facebook</a>{{/if}}
    {{#if site.social.email}}<a href="mailto:{{site.social.email}}">Email</a>{{/if}}
  </div>
</main>

{{inject-script}}
</body>
</html>
</template>

<script data-scope="global">
/* Shared JS — runs on every page */
</script>
```

---

## How to Use This Guide with AI

Paste the following into your AI prompt, then describe the visual style you want:

```
You are creating a theme file for EXH1B1T, a photography portfolio app.
Read the full spec in THEME_AUTHORING_GUIDE.md carefully before writing any code.
Follow every rule in the "Common Mistakes Checklist" section.

The theme file must be a single .html file.
Use the "Minimal Working Template" as your skeleton.
Do not invent new Handlebars helpers — only use the helpers listed in "Available Handlebars Helpers".

Visual style I want: [DESCRIBE YOUR STYLE HERE]
Theme name: [your-theme-name]
```

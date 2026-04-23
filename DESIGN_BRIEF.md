# Design Brief — EXH1B1T

## App คืออะไร

**EXH1B1T** — Electron desktop app สำหรับ photographer และ creative
ให้ non-tech user สร้าง photo portfolio website ได้ฟรี โดย host บน GitHub Pages
ไม่ต้องรู้ coding, ไม่ต้องรู้ git — ใช้งานง่ายเหมือน app ทั่วไป

**Target user:** Photographer, designer, illustrator อายุ 25–40
อยากมีเว็บ portfolio สวยๆ เป็นของตัวเอง แต่ไม่อยากจ่ายค่า hosting รายเดือน

---

## Brand Identity

### ชื่อและการแสดงผล
- **ชื่อ:** `EXH1B1T` — ตัวพิมพ์ใหญ่ทั้งหมดเสมอ ไม่มีข้อยกเว้น
- **อ่านว่า:** "เอ็กซ์-บิต" (exhibit)
- **Tagline:** "Your portfolio. Free forever." — ใช้ใน Onboarding screen เท่านั้น
- **Logo:** ใช้ text `EXH1B1T` เป็น logotype — ไม่มี icon แยก ตัวอักษรคือ identity

### Typography สำหรับ logotype
- Font: monospace หรือ condensed sans-serif — ให้ความรู้สึก precise, technical
- Letter-spacing: wide (0.15em–0.2em) — ทำให้ดู bold และ strong
- ห้ามใช้ serif หรือ rounded font สำหรับ logotype

---

## Visual References

App ที่มี aesthetic ใกล้เคียงกับที่ต้องการ (ดูเพื่อเข้าใจ feel ไม่ใช่ copy):

- **Linear** — dark UI, ข้อความเล็ก, spacing สม่ำเสมอ, ไม่มีอะไรฟุ่มเฟือย
- **Sketch app** — sidebar + canvas split, professional tool feel
- **Darkroom (iOS)** — dark photo editing app, ให้ความรู้สึก creative tool ที่ไม่ toyish
- **Arc Browser** — sidebar ที่ดู refined ไม่ดู heavy

**สิ่งที่ต้องการ:**
ความรู้สึกของ "tool สำหรับมืออาชีพ" ที่ใช้งานง่าย ไม่ใช่ "consumer app" ที่ colorful และ playful
รูปภาพของ user คือ hero — UI ต้องถอยออกไปให้รูปเป็นตัวนำ

**สิ่งที่ไม่ต้องการ:**
- Gradient หลายสี
- Rounded corners มากเกินไป
- Icon ที่มีสีหลายสี
- Animation ที่ดึงความสนใจ

---

## Platform & Constraints

- **Electron desktop app** — macOS primary, Windows secondary
- **macOS titlebar** — `hiddenInset` style, traffic lights ซ้ายบน
- **Min window size** — 960 × 600px
- **Dark theme only** — ผู้ใช้เป็น creative ที่ชอบ dark UI
- **ไม่มี framework CSS** — ใช้ CSS Modules + CSS variables เท่านั้น

---

## Design Tokens (ใช้ตามนี้เลย)

```css
--bg:        #0f0f0f   /* background หลัก */
--bg-2:      #1a1a1a   /* panel, card */
--bg-3:      #242424   /* input, button */
--border:    #2e2e2e
--border-2:  #3a3a3a
--text:      #e8e8e8
--text-2:    #888      /* secondary text */
--text-3:    #555      /* placeholder, hint */
--accent:    #d4f541   /* lime — primary action */
--danger:    #ff4d4d
--success:   #4dff91
```

---

## Screens ที่ต้องออกแบบ

### 1. Onboarding
Flow: Login → รอ code → ตรวจ repo → setup/restore → done

States:
- **Login screen** — logotype EXH1B1T, tagline, ปุ่ม "Login with GitHub", link "สมัคร GitHub ฟรี" เล็กๆ ด้านล่าง
- **Waiting for code** — แสดง code เด่นๆ เช่น `ABCD-1234`, spinner, hint text
- **Checking / Setup** — spinner + status message
- **Restore screen** — พบข้อมูลเดิม ถาม 2 ทางเลือก
- **Conflict screen** — repo ของคนอื่น ถาม overwrite หรือยกเลิก

### 2. Editor (Main Screen)
Layout: **3 column split**

```
┌─────────────┬──────────────────────┬─────────────────────┐
│   Sidebar   │    Editor Panel      │   Preview Pane      │
│   240px     │    flex: 1           │   ~420px            │
│             │                      │                      │
│  EXH1B1T  ⚙  │  [Album title input] │  [webview]          │
│             │                      │                      │
│             │  [date] [desc]       │                      │
│ • Home      │                      │                      │
│ • Album 1   │  [Upload drop zone]  │                      │
│ • Album 2   │                      │                      │
│   ...       │  [Photo Grid]        │                      │
│             │    □ □ □ □           │                      │
│ [+ Album]   │    □ □ □ □           │                      │
│             │                      │                      │
│ [avatar]    │                      │                      │
│ [username]  │                      │  [Home][About] tabs  │
│ [Publish ▶] │                      │                      │
└─────────────┴──────────────────────┴─────────────────────┘
```

**Sidebar:**
- Titlebar drag region บนสุด (38px) — `EXH1B1T` logotype ซ้าย + settings icon ขวา
- Album list แบบ scrollable — selected state ชัดเจน
- Footer: avatar + username + Publish button (accent color)

**Editor Panel:**
- Title input ขนาดใหญ่ที่สุด
- Date + description fields
- Drop zone สำหรับ upload รูป
- Photo grid — thumbnail cards, hover actions (set cover ★, delete ✕)
- Cover photo มี badge "Cover"

**Preview Pane:**
- Header แสดง tab Home / About
- Webview แสดงผลจริง
- มี resize handle ระหว่าง editor กับ preview

### 3. Settings
Layout: Full screen พร้อม back button + 4 tabs

**Tabs:** ข้อมูล Site | Theme | Domain | Analytics

**Tab: ข้อมูล Site**
- title, description, lang (dropdown)
- owner: name, bio
- social: instagram, facebook, email

**Tab: Theme**
- List of installed themes — card แต่ละอัน แสดงชื่อ, description, ปุ่ม "ใช้งาน"
- ปุ่ม "+ ติดตั้ง Theme" — เปิด file picker รับ .html ไฟล์
- Theme ที่กำลังใช้งาน — highlight ด้วย accent border

**Tab: Domain**
- แสดง URL ปัจจุบัน (username.github.io)
- Input สำหรับ custom domain
- DNS status indicator (●waiting / ●verifying / ✓active)
- DNS setup guide — IP addresses พร้อม Copy button

**Tab: Analytics**
- Google Analytics ID input (G-XXXXXXXXXX)
- Favicon URL input
- Brief explanation text

### 4. Publish Modal
Overlay modal แสดงระหว่าง publish

States:
- **Publishing** — progress bar + step list (loading → images → uploading → building → seo → pushing)
- **Success** — URL ของเว็บ พร้อม Open button + note "เว็บอาจใช้เวลา 1-5 นาทีในการ update"
- **Error** — error message แบบ human-readable (ไม่แสดง technical error) + close button

### 5. Update Notification
แจ้ง user เมื่อมี app version ใหม่ — **ไม่ใช่ modal** ใช้เป็น subtle banner แทน

```
┌─────────────────────────────────────────────────────────────┐
│  🆕  มีอัพเดทใหม่ v1.2.0   [ดูรายละเอียด]   [รีสตาร์ทเพื่ออัพเดท] │
└─────────────────────────────────────────────────────────────┘
```

**Placement:** Banner บาง (36px) แสดงใต้ titlebar ของ Editor screen เท่านั้น
ไม่ขัดการทำงาน user สามารถเพิกเฉยได้

States:
- **Downloading** — "กำลังโหลดอัพเดท..." + progress bar เล็กๆ
- **Ready** — "อัพเดทพร้อมแล้ว v1.x.x" + ปุ่ม "รีสตาร์ท" (accent) + ปุ่ม "ทีหลัง" (dismiss)
- **Dismissed** — banner หายไป ไม่โชว์อีกจนกว่าจะเปิด app ใหม่

---

## UX Notes

- **Photo grid hover** — show action buttons เฉพาะ hover ไม่รก UI ปกติ
- **Saving indicator** — "กำลังบันทึก..." subtle มาก ใช้ text-3 color
- **Album list item** — แสดงชื่อ + จำนวนรูป (เช่น `Wedding 2024  24`)
- **Empty states** — ถ้ายังไม่มีรูป แสดง drop zone ใหญ่ขึ้น
- **Publish button** — accent color (lime) ชัดเจน อยู่ล่าง sidebar เสมอ
- **First publish** — อาจใช้เวลานาน แสดง progress ชัดเจน ไม่ให้ user งงว่า hang
- **Onboarding** — non-tech user อาจไม่มี GitHub account ควรมี link "สมัคร GitHub ฟรี" ใน login screen
- **Update banner** — subtle มาก ไม่ block workflow ใช้ bg-2 background ไม่ใช้ accent เต็มๆ เพราะไม่ใช่ primary action, ปุ่ม "รีสตาร์ท" ใช้ accent เฉพาะ text ไม่ใช่ background

---

## Tone & Aesthetic

- **Dark, minimal, professional** — เหมาะกับ creative
- **ไม่ใช่ consumer app** — ไม่ playful ไม่ colorful
- **Accent lime (#d4f541)** — ใช้เฉพาะ primary action (Publish, active state, selected)
- **Typography** — อ่านง่าย, ขนาดเหมาะกับ desktop (13–14px body)
- **Borders** — บางมาก (1px), สี subtle
- **Animations** — น้อยมาก เฉพาะ transition ที่จำเป็น

---

## Component List และ Class Names ครบถ้วน

### pages/Onboarding.module.css
```
.container .titlebar .card .logo .title .subtitle
.desc .hint .code .spinner .waiting .checkmark
.btnPrimary .btnSecondary .btnDanger .btnGroup .error
```

### pages/Editor.module.css
```
.layout .sidebar .titlebar .appName .settingsBtn
.albumListWrap .editorPanel .previewPanel
.previewHeader .previewNav .active
.sidebarFooter .userRow .avatar .username
.saving
```

### pages/Settings.module.css
```
.container .header .backBtn .title .saving
.tabs .tab .activeTab .content .section
.sectionTitle .field .hint .link
.select .copyBtn .ipRow .dnsGuide
```

### components/AlbumList.module.css
```
.container .listHeader .addBtn
.list .item .selected .albumTitle .albumCount
```

### components/AlbumEditor.module.css
```
.container .header .titleInput .headerActions
.saving .deleteBtn .meta .field .loading
```

### components/PhotoGrid.module.css
```
.grid .card .img .overlay .actions
.coverBadge .actionBtn .deleteBtn .coverBtn
.empty
```

### components/PhotoUpload.module.css
```
.dropzone .dragOver .icon .label .hint
```

### components/PreviewPane.module.css
```
.container .webview .empty
```

### components/PublishButton.module.css
```
.publishBtn .overlay .modal .modalTitle
.progressBar .progressFill .steps .stepItem
.active .done .stepDot .message
.success .liveUrl .errorBox .closeBtn
```

### components/ThemePicker.module.css
```
.header .installBtn .list .card .activeBorder
.themeName .themeDesc .useBtn .activeLabel
```

### components/DnsStatus.module.css
```
.row .dot .label
```

### components/UpdateBanner.module.css
```
.banner .downloading .ready .dismissed
.message .version .progressBar .progressFill
.restartBtn .laterBtn
```

- **Electron desktop app** — macOS primary, Windows secondary
- **macOS titlebar** — `hiddenInset` style, traffic lights ซ้ายบน
- **Min window size** — 960 × 600px
- **Dark theme only** — ผู้ใช้เป็น creative ที่ชอบ dark UI
- **ไม่มี framework CSS** — ใช้ CSS Modules + CSS variables เท่านั้น

---

## Design Tokens (ใช้ตามนี้เลย)

```css
--bg:        #0f0f0f   /* background หลัก */
--bg-2:      #1a1a1a   /* panel, card */
--bg-3:      #242424   /* input, button */
--border:    #2e2e2e
--border-2:  #3a3a3a
--text:      #e8e8e8
--text-2:    #888      /* secondary text */
--text-3:    #555      /* placeholder, hint */
--accent:    #d4f541   /* lime — primary action */
--danger:    #ff4d4d
--success:   #4dff91
```

---

## Screens ที่ต้องออกแบบ

### 1. Onboarding
Flow: Login → รอ code → ตรวจ repo → setup/restore → done

States:
- **Login screen** — logo, ชื่อ app, คำอธิบาย 1 บรรทัด, ปุ่ม "Login with GitHub"
- **Waiting for code** — แสดง code เด่นๆ เช่น `ABCD-1234`, spinner, hint text
- **Checking / Setup** — spinner + status message
- **Restore screen** — พบข้อมูลเดิม ถาม 2 ทางเลือก
- **Conflict screen** — repo ของคนอื่น ถาม overwrite หรือยกเลิก

### 2. Editor (Main Screen)
Layout: **3 column split**

```
┌─────────────┬──────────────────────┬─────────────────────┐
│   Sidebar   │    Editor Panel      │   Preview Pane      │
│   240px     │    flex: 1           │   ~420px            │
│             │                      │                      │
│ [App Name]  │  [Album title input] │  [webview]          │
│ [Settings]  │                      │                      │
│             │  [date] [desc]       │                      │
│ • Home      │                      │                      │
│ • Album 1   │  [Upload drop zone]  │                      │
│ • Album 2   │                      │                      │
│   ...       │  [Photo Grid]        │                      │
│             │    □ □ □ □           │                      │
│ [+ Album]   │    □ □ □ □           │                      │
│             │                      │                      │
│ [avatar]    │                      │                      │
│ [username]  │                      │  [Home][About] tabs  │
│ [Publish]   │                      │                      │
└─────────────┴──────────────────────┴─────────────────────┘
```

**Sidebar:**
- Titlebar drag region บนสุด (38px) — แสดง app name + settings icon
- Album list แบบ scrollable — selected state ชัดเจน
- Footer: avatar + username + Publish button (accent color)

**Editor Panel:**
- Title input ขนาดใหญ่ที่สุด
- Date + description fields
- Drop zone สำหรับ upload รูป
- Photo grid — thumbnail cards, hover actions (set cover ★, delete ✕)
- Cover photo มี badge "Cover"

**Preview Pane:**
- Header แสดง tab Home / About
- Webview แสดงผลจริง
- มี resize handle ระหว่าง editor กับ preview

### 3. Settings
Layout: Full screen พร้อม back button + 4 tabs

**Tabs:** ข้อมูล Site | Theme | Domain | Analytics

**Tab: ข้อมูล Site**
- title, description, lang (dropdown)
- owner: name, bio
- social: instagram, facebook, email

**Tab: Theme**
- List of installed themes — card แต่ละอัน แสดงชื่อ, description, ปุ่ม "ใช้งาน"
- ปุ่ม "+ ติดตั้ง Theme" — เปิด file picker รับ .html ไฟล์
- Theme ที่กำลังใช้งาน — highlight ด้วย accent border

**Tab: Domain**
- แสดง URL ปัจจุบัน (username.github.io)
- Input สำหรับ custom domain
- DNS status indicator (●waiting / ●verifying / ✓active)
- DNS setup guide — IP addresses พร้อม Copy button

**Tab: Analytics**
- Google Analytics ID input (G-XXXXXXXXXX)
- Favicon URL input
- Brief explanation text

### 4. Publish Modal
Overlay modal แสดงระหว่าง publish

States:
- **Publishing** — progress bar + step list (loading → images → uploading → building → seo → pushing)
- **Success** — URL ของเว็บ พร้อม Open button + note "เว็บอาจใช้เวลา 1-5 นาทีในการ update"
- **Error** — error message แบบ human-readable (ไม่แสดง technical error) + close button

### 5. Update Notification
แจ้ง user เมื่อมี app version ใหม่ — **ไม่ใช่ modal** ใช้เป็น subtle banner แทน

```
┌─────────────────────────────────────────────────────────────┐
│  🆕  มีอัพเดทใหม่ v1.2.0   [ดูรายละเอียด]   [รีสตาร์ทเพื่ออัพเดท] │
└─────────────────────────────────────────────────────────────┘
```

**Placement:** Banner บาง (36px) แสดงใต้ titlebar ของ Editor screen เท่านั้น
ไม่ขัดการทำงาน user สามารถเพิกเฉยได้

States:
- **Downloading** — "กำลังโหลดอัพเดท..." + progress bar เล็กๆ
- **Ready** — "อัพเดทพร้อมแล้ว v1.x.x" + ปุ่ม "รีสตาร์ท" (accent) + ปุ่ม "ทีหลัง" (dismiss)
- **Dismissed** — banner หายไป ไม่โชว์อีกจนกว่าจะเปิด app ใหม่

---

## UX Notes

- **Photo grid hover** — show action buttons เฉพาะ hover ไม่รก UI ปกติ
- **Saving indicator** — "กำลังบันทึก..." subtle มาก ใช้ text-3 color
- **Album list item** — แสดงชื่อ + จำนวนรูป (เช่น `Wedding 2024  24`)
- **Empty states** — ถ้ายังไม่มีรูป แสดง drop zone ใหญ่ขึ้น
- **Publish button** — accent color (lime) ชัดเจน อยู่ล่าง sidebar เสมอ
- **First publish** — อาจใช้เวลานาน แสดง progress ชัดเจน ไม่ให้ user งงว่า hang
- **Onboarding** — non-tech user อาจไม่มี GitHub account ควรมี link "สมัคร GitHub ฟรี" ใน login screen
- **Update banner** — subtle มาก ไม่ block workflow ใช้ bg-2 background ไม่ใช้ accent เต็มๆ เพราะไม่ใช่ primary action, ปุ่ม "รีสตาร์ท" ใช้ accent เฉพาะ text ไม่ใช่ background

---

## Tone & Aesthetic

- **Dark, minimal, professional** — เหมาะกับ creative
- **ไม่ใช่ consumer app** — ไม่ playful ไม่ colorful
- **Accent lime (#d4f541)** — ใช้เฉพาะ primary action (Publish, active state, selected)
- **Typography** — อ่านง่าย, ขนาดเหมาะกับ desktop (13–14px body)
- **Borders** — บางมาก (1px), สี subtle
- **Animations** — น้อยมาก เฉพาะ transition ที่จำเป็น

---

## Component List ที่ต้องการ CSS

```
pages/
  Onboarding.module.css
  Editor.module.css
  Settings.module.css

components/
  AlbumList.module.css
  AlbumEditor.module.css
  PhotoGrid.module.css
  PreviewPane.module.css
  PublishButton.module.css
  ThemePicker.module.css
  DnsStatus.module.css
  UpdateBanner.module.css
```

## Output ที่ต้องการ

CSS Modules ทุกไฟล์ข้างต้น โดย:
- ใช้ class names ตามที่ระบุไว้ใน section "Component List และ Class Names" ทุกตัว
- CSS variables จาก Design Tokens เท่านั้น ห้าม hardcode สี
- ไม่มี media query สำหรับ mobile (app เป็น desktop only)
- transition บน interactive elements: `var(--t-fast)` = 120ms ease


import { useState, useRef, useEffect, useCallback } from 'react'
import s from './NavEditor.module.css'
import Toggle from './Toggle'
import Icon from './Icon'

const STYLES = [
  { key: 'sidebar', label: 'Sidebar', desc: 'Persistent nav on the left' },
  { key: 'hamburger', label: 'Hamburger', desc: 'Hidden menu, opens on tap' },
]

export default function NavEditor({ site, albums, onSave }) {
  const [saving, setSaving]       = useState(false)
  const [links, setLinks]         = useState([])
  const [albumItems, setAlbumItems] = useState([])
  const [dragIdx, setDragIdx]     = useState(null)
  const [overIdx, setOverIdx]     = useState(null)
  const saveTimer                 = useRef(null)

  useEffect(() => {
    setLinks(site?.nav?.links ?? [])
  }, [site?.nav?.links])

  useEffect(() => {
    setAlbumItems(albums ? [...albums].sort((a, b) => a.order - b.order) : [])
  }, [albums])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const patchNav = useCallback((update, immediate = false) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const next = { ...site, nav: { ...site?.nav, ...update } }
      await window.api?.site.save(next)
      onSave?.(next, immediate)
      setSaving(false)
    }, 600)
  }, [site, onSave])

  const nav = site?.nav ?? {}
  const hiddenAlbums = nav.hiddenAlbums ?? []

  // ── Album visibility ──────────────────────────────────────────────────────
  const toggleAlbum = (slug) => {
    const next = hiddenAlbums.includes(slug)
      ? hiddenAlbums.filter((s) => s !== slug)
      : [...hiddenAlbums, slug]
    patchNav({ hiddenAlbums: next }, true)
  }

  // ── Album drag reorder ────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }
  const handleDrop = async (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return }
    const next = [...albumItems]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setAlbumItems(next)
    setDragIdx(null)
    setOverIdx(null)
    await window.api?.albums.reorder(next.map((a) => a.slug))
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  // ── Custom links ──────────────────────────────────────────────────────────
  const saveLinks = useCallback((list) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const next = { ...site, nav: { ...site?.nav, links: list } }
      await window.api?.site.save(next)
      onSave?.(next)
      setSaving(false)
    }, 600)
  }, [site, onSave])

  const handleAddLink = () => {
    const next = [...links, { label: '', url: '' }]
    setLinks(next)
    saveLinks(next)
  }

  const handleUpdateLink = (idx, field, value) => {
    const next = links.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    setLinks(next)
    saveLinks(next)
  }

  const handleDeleteLink = (idx) => {
    const next = links.filter((_, i) => i !== idx)
    setLinks(next)
    saveLinks(next)
  }

  if (!site) return null

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.title}>Navigation</div>
        <span className={s.savingBadge} style={{ opacity: saving ? 1 : 0 }}>Saving…</span>
      </div>

      <div className={s.scroll}>
        {/* Menu style */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Menu Style</div>
          <div className={s.styleCards}>
            {STYLES.map(({ key, label, desc }) => {
              const sel = (nav.style ?? 'sidebar') === key
              return (
                <button
                  key={key}
                  className={`${s.styleCard} ${sel ? s.cardSel : ''}`}
                  onClick={() => patchNav({ style: key }, true)}
                >
                  <div className={s.cardIcon}>
                    {key === 'sidebar' ? <SidebarPreview /> : <HamburgerPreview />}
                  </div>
                  <div className={s.cardLabel}>{label}</div>
                  <div className={s.cardDesc}>{desc}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Menu items */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Menu Items</div>

          {/* Fixed: Home */}
          <div className={s.fixedRow}>
            <span className={s.fixedIcon}><Icon name="image" size={13} color="var(--text-3)" /></span>
            <span className={s.rowLabel}>Home</span>
            <Toggle
              checked={nav.homeVisible !== false}
              onChange={(v) => patchNav({ homeVisible: v }, true)}
            />
          </div>

          {/* Fixed: About */}
          <div className={s.fixedRow}>
            <span className={s.fixedIcon}><Icon name="camera" size={13} color="var(--text-3)" /></span>
            <span className={s.rowLabel}>About</span>
            <Toggle
              checked={nav.aboutVisible !== false}
              onChange={(v) => patchNav({ aboutVisible: v }, true)}
            />
          </div>

          {/* Draggable albums */}
          {albumItems.length > 0 && (
            <div className={s.divider} />
          )}
          {albumItems.map((album, idx) => (
            <div
              key={album.slug}
              className={`${s.albumRow} ${dragIdx === idx ? s.dragging : ''} ${overIdx === idx && dragIdx !== idx ? s.over : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <span className={s.grip}><Icon name="grip" size={12} color="var(--text-3)" /></span>
              <span className={s.rowLabel}>{album.title}</span>
              <Toggle
                checked={!hiddenAlbums.includes(album.slug)}
                onChange={() => toggleAlbum(album.slug)}
              />
            </div>
          ))}

          {/* Custom links */}
          {links.length > 0 && <div className={s.divider} />}
          {links.map((link, idx) => (
            <div key={idx} className={s.linkRow}>
              <input
                className={s.linkLabel}
                value={link.label}
                placeholder="Label"
                onChange={(e) => handleUpdateLink(idx, 'label', e.target.value)}
              />
              <input
                className={s.linkUrl}
                value={link.url}
                placeholder="https://…"
                onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
              />
              <button
                className={s.deleteBtn}
                onClick={() => handleDeleteLink(idx)}
                title="Remove link"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          ))}

          <button className={s.addLinkBtn} onClick={handleAddLink}>
            <Icon name="plus" size={12} />
            Add custom link
          </button>
        </section>
      </div>
    </div>
  )
}

function SidebarPreview() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
      <rect x="0.5" y="0.5" width="51" height="39" rx="3.5" stroke="var(--border-2)" />
      <rect x="0" y="0" width="16" height="40" rx="3" fill="var(--border)" />
      {[8, 16, 24].map((y) => (
        <rect key={y} x="3" y={y} width="10" height="2" rx="1" fill="var(--text-3)" />
      ))}
      {[10, 18, 26].map((y) => (
        <rect key={y} x="20" y={y} width="28" height="2" rx="1" fill="var(--border-2)" />
      ))}
    </svg>
  )
}

function HamburgerPreview() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
      <rect x="0.5" y="0.5" width="51" height="39" rx="3.5" stroke="var(--border-2)" />
      {[5, 9, 13].map((y) => (
        <rect key={y} x="4" y={y} width="8" height="1.5" rx="1" fill="var(--text-3)" />
      ))}
      {[10, 18, 26].map((y) => (
        <rect key={y} x="8" y={y} width="36" height="2" rx="1" fill="var(--border-2)" />
      ))}
    </svg>
  )
}

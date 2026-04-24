import { useState, useRef, useEffect, useCallback } from 'react'
import s from './HomeEditor.module.css'
import Field from './Field'
import Icon from './Icon'

const LAYOUTS = [
  { key: 'grid', label: 'Grid', desc: 'Albums displayed in a photo grid' },
  { key: 'list', label: 'List', desc: 'Albums displayed as full-width rows' },
]

export default function HomeEditor({ site, albums, onSave }) {
  const [saving, setSaving]     = useState(false)
  const [items, setItems]       = useState([])
  const [dragIdx, setDragIdx]   = useState(null)
  const [overIdx, setOverIdx]   = useState(null)
  const saveTimer               = useRef(null)

  useEffect(() => {
    setItems(albums ? [...albums].sort((a, b) => a.order - b.order) : [])
  }, [albums])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const patch = useCallback((update) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const next = { ...site, home: { ...site?.home, ...update } }
      await window.api?.site.save(next)
      onSave?.(next)
      setSaving(false)
    }, 600)
  }, [site, onSave])

  // ── Album order drag ──────────────────────────────────────────────────────
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
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setItems(next)
    setDragIdx(null)
    setOverIdx(null)
    await window.api?.albums.reorder(next.map((a) => a.slug))
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  if (!site) return null

  const home = site.home ?? {}

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.title}>Home</div>
        <span className={s.savingBadge} style={{ opacity: saving ? 1 : 0 }}>Saving…</span>
      </div>

      <div className={s.scroll}>
        {/* Layout */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Layout</div>
          <div className={s.layoutCards}>
            {LAYOUTS.map(({ key, label, desc }) => {
              const sel = (home.layout ?? 'grid') === key
              return (
                <button
                  key={key}
                  className={`${s.layoutCard} ${sel ? s.cardSel : ''}`}
                  onClick={() => patch({ layout: key })}
                >
                  <div className={s.cardIcon}>
                    {key === 'grid'
                      ? <GridPreview />
                      : <ListPreview />}
                  </div>
                  <div className={s.cardLabel}>{label}</div>
                  <div className={s.cardDesc}>{desc}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Text content */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Text</div>
          <div className={s.fields}>
            <Field label="Headline">
              <input
                defaultValue={home.headline ?? ''}
                placeholder="Your name or tagline"
                onChange={(e) => patch({ headline: e.target.value })}
              />
            </Field>
            <Field label="Subhead">
              <input
                defaultValue={home.subhead ?? ''}
                placeholder="Photographer · City"
                onChange={(e) => patch({ subhead: e.target.value })}
              />
            </Field>
            <Field label="Intro">
              <textarea
                rows={3}
                defaultValue={home.intro ?? ''}
                placeholder="A short intro paragraph shown above the albums…"
                onChange={(e) => patch({ intro: e.target.value })}
              />
            </Field>
          </div>
        </section>

        {/* Album order */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Album Order</div>
          <div className={s.sectionHint}>Drag to reorder albums on the home page</div>
          {items.length === 0 && (
            <div className={s.empty}>No albums yet</div>
          )}
          <div className={s.albumList}>
            {items.map((album, idx) => (
              <div
                key={album.slug}
                className={`${s.albumRow} ${dragIdx === idx ? s.dragging : ''} ${overIdx === idx && dragIdx !== idx ? s.over : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
              >
                <span className={s.grip}>
                  <Icon name="grip" size={12} color="var(--text-3)" />
                </span>
                <span className={s.albumCover}>
                  {(() => {
                    const cp = album.photos?.find(p => p.filename === album.coverPhoto)
                    const src = cp?.localPath ? `local://${cp.localPath}` : (cp?.url ?? '')
                    return src
                      ? <img src={src} alt="" />
                      : <Icon name="image" size={12} color="var(--text-3)" />
                  })()}
                </span>
                <span className={s.albumName}>{album.title}</span>
                <span className={s.albumDate}>{album.date?.slice(0, 7) ?? ''}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function GridPreview() {
  const cells = Array.from({ length: 9 })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, width: 48, height: 48 }}>
      {cells.map((_, i) => (
        <div key={i} style={{ background: 'var(--border-2)', borderRadius: 2 }} />
      ))}
    </div>
  )
}

function ListPreview() {
  const rows = Array.from({ length: 3 })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 48, height: 48, justifyContent: 'center' }}>
      {rows.map((_, i) => (
        <div key={i} style={{ background: 'var(--border-2)', borderRadius: 2, height: 12 }} />
      ))}
    </div>
  )
}

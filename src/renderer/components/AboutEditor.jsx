import { useState, useRef, useEffect, useCallback } from 'react'
import s from './AboutEditor.module.css'
import Field from './Field'
import Icon from './Icon'

export default function AboutEditor({ site, onSave }) {
  const [saving, setSaving]         = useState(false)
  const [exhibitions, setExhibitions] = useState([])
  const saveTimer                   = useRef(null)

  useEffect(() => {
    setExhibitions(site?.about?.exhibitions ?? [])
  }, [site?.about?.exhibitions])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const patchSite = useCallback((update) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const next = { ...site, ...update }
      await window.api?.site.save(next)
      onSave?.(next)
      setSaving(false)
    }, 600)
  }, [site, onSave])

  const patchOwner = useCallback((update) => {
    patchSite({ owner: { ...site?.owner, ...update } })
  }, [site, patchSite])

  const patchAbout = useCallback((update) => {
    patchSite({ about: { ...site?.about, exhibitions, ...update } })
  }, [site, exhibitions, patchSite])

  // ── Portrait pick ──────────────────────────────────────────────────────────
  const handlePortraitPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // webUtils.getPathForFile replaces deprecated file.path (Electron 32+)
    const path = window.api?.utils.getPathForFile(file) ?? ''
    if (path) patchAbout({ portrait: path })
  }

  // ── Exhibitions ────────────────────────────────────────────────────────────
  const saveExhibitions = useCallback((list) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const next = { ...site, about: { ...site?.about, exhibitions: list } }
      await window.api?.site.save(next)
      onSave?.(next)
      setSaving(false)
    }, 600)
  }, [site, onSave])

  const handleAddExhibition = () => {
    const next = [...exhibitions, { title: '', venue: '', year: '' }]
    setExhibitions(next)
    saveExhibitions(next)
  }

  const handleUpdateExhibition = (idx, field, value) => {
    const next = exhibitions.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex)
    setExhibitions(next)
    saveExhibitions(next)
  }

  const handleDeleteExhibition = (idx) => {
    const next = exhibitions.filter((_, i) => i !== idx)
    setExhibitions(next)
    saveExhibitions(next)
  }

  if (!site) return null

  const owner   = site.owner   ?? {}
  const about   = site.about   ?? {}
  const portrait = about.portrait

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.title}>About</div>
        <span className={s.savingBadge} style={{ opacity: saving ? 1 : 0 }}>Saving…</span>
      </div>

      <div className={s.scroll}>
        {/* Portrait */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Portrait Photo</div>
          <label className={s.portraitArea}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortraitPick} />
            {portrait ? (
              <img
                src={portrait.startsWith('/') ? `local://${portrait}` : portrait}
                className={s.portraitImg}
                alt="Portrait"
              />
            ) : (
              <div className={s.portraitEmpty}>
                <Icon name="camera" size={22} color="var(--text-3)" />
                <span>Click to choose a portrait photo</span>
              </div>
            )}
            <div className={s.portraitOverlay}>
              <Icon name="upload" size={16} color="white" />
              <span>Change photo</span>
            </div>
          </label>
        </section>

        {/* Bio */}
        <section className={s.section}>
          <div className={s.sectionTitle}>Bio</div>
          <div className={s.fields}>
            <Field label="Name">
              <input
                defaultValue={owner.name ?? ''}
                placeholder="Your full name"
                onChange={(e) => patchOwner({ name: e.target.value })}
              />
            </Field>
            <Field label="Bio" hint="Shown as your About page intro paragraph">
              <textarea
                rows={4}
                defaultValue={owner.bio ?? ''}
                placeholder="Write a short bio about yourself…"
                onChange={(e) => patchOwner({ bio: e.target.value })}
              />
            </Field>
            <Field label="Contact Email">
              <input
                type="email"
                defaultValue={site.social?.email ?? ''}
                placeholder="hello@example.com"
                onChange={(e) => patchSite({ social: { ...site.social, email: e.target.value } })}
              />
            </Field>
          </div>
        </section>

        {/* Exhibitions & Press */}
        <section className={s.section}>
          <div className={s.sectionHeader}>
            <div>
              <div className={s.sectionTitle} style={{ marginBottom: 2 }}>Exhibitions &amp; Press</div>
              <div className={s.sectionHint}>Awards, shows, features — anything you'd like to list</div>
            </div>
            <button className={s.addBtn} onClick={handleAddExhibition}>
              <Icon name="plus" size={13} />
              Add
            </button>
          </div>

          {exhibitions.length === 0 && (
            <div className={s.empty}>
              <Icon name="star" size={16} color="var(--text-3)" />
              <span>No entries yet — add an exhibition or press feature</span>
            </div>
          )}

          <div className={s.exhibitionList}>
            {exhibitions.map((ex, idx) => (
              <div key={idx} className={s.exhibitionCard}>
                <div className={s.cardRow}>
                  <input
                    className={s.exTitle}
                    value={ex.title}
                    placeholder="Exhibition or press title"
                    onChange={(e) => handleUpdateExhibition(idx, 'title', e.target.value)}
                  />
                  <button
                    className={s.deleteBtn}
                    onClick={() => handleDeleteExhibition(idx)}
                    title="Remove"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
                <div className={s.cardRow}>
                  <input
                    className={s.exVenue}
                    value={ex.venue}
                    placeholder="Venue / Publication"
                    onChange={(e) => handleUpdateExhibition(idx, 'venue', e.target.value)}
                  />
                  <input
                    className={s.exYear}
                    value={ex.year}
                    placeholder="Year"
                    maxLength={4}
                    onChange={(e) => handleUpdateExhibition(idx, 'year', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import s from './AlbumEditor.module.css'
import PhotoGrid from './PhotoGrid'
import PhotoUpload from './PhotoUpload'
import Icon from './Icon'

export default function AlbumEditor({ album, onSaved }) {
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef(null)

  const pokeSave = useCallback(async (patch) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await window.api?.albums.update(album.slug, patch)
      setSaving(false)
      onSaved?.()
    }, 600)
  }, [album?.slug, onSaved])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  if (!album) {
    return (
      <div className={s.container}>
        <div className={s.loading}>Select an album from the sidebar</div>
      </div>
    )
  }

  const handleSetCover = async (filename) => {
    await window.api?.photos.setCover(album.slug, filename)
    onSaved?.()
  }

  const handleDeletePhoto = async (filename) => {
    await window.api?.photos.remove(album.slug, filename)
    onSaved?.()
  }

  const handleUploaded = () => onSaved?.()

  return (
    <div className={s.container}>
      {/* Header */}
      <div className={s.header}>
        <input
          key={album.slug}
          className={s.titleInput}
          defaultValue={album.title}
          placeholder="Album title"
          onChange={(e) => pokeSave({ title: e.target.value })}
        />
        <div className={s.headerActions}>
          <span className={saving ? s.saving : ''} style={{ fontSize: 11, color: saving ? 'var(--text-2)' : 'var(--text-3)' }}>
            {saving ? 'Saving...' : 'Saved'}
          </span>
          <button className={s.deleteBtn} title="More options">
            <Icon name="dots" size={14} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className={s.meta}>
        <input
          key={album.slug + ':date'}
          defaultValue={album.date ?? ''}
          placeholder="Date"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          onChange={(e) => pokeSave({ date: e.target.value })}
        />
        <input
          key={album.slug + ':desc'}
          defaultValue={album.description ?? ''}
          placeholder="Short description (optional)"
          onChange={(e) => pokeSave({ description: e.target.value })}
        />
      </div>

      {/* Scrollable photo area */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
        {!album.photos?.length ? (
          <PhotoUpload albumSlug={album.slug} onUploaded={handleUploaded} variant="big" />
        ) : (
          <>
            <PhotoUpload albumSlug={album.slug} onUploaded={handleUploaded} variant="small" />
            <PhotoGrid
              photos={album.photos}
              coverFilename={album.coverPhoto}
              onSetCover={handleSetCover}
              onDelete={handleDeletePhoto}
            />
          </>
        )}
      </div>
    </div>
  )
}

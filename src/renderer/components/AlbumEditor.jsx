import { useState, useEffect, useRef, useCallback } from 'react'
import s from './AlbumEditor.module.css'
import PhotoGrid from './PhotoGrid'
import PhotoUpload from './PhotoUpload'
import Icon from './Icon'
import { showToast } from './Toast'

export default function AlbumEditor({ album, onSaved, onDelete }) {
  const [saving, setSaving]       = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const saveTimer = useRef(null)
  const menuRef   = useRef(null)

  const pokeSave = useCallback(async (patch) => {
    setSaving(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await window.api?.albums.update(album.slug, patch)
        onSaved?.()
      } catch {
        showToast('Failed to save album. Please try again.', 'error')
      } finally {
        setSaving(false)
      }
    }, 600)
  }, [album?.slug, onSaved])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleDeleteAlbum = async () => {
    setDeleting(true)
    try {
      await window.api?.albums.delete(album.slug)
      onDelete?.()
    } catch {
      showToast('Failed to delete album. Please try again.', 'error')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (!album) {
    return (
      <div className={s.container}>
        <div className={s.loading}>Select an album from the sidebar</div>
      </div>
    )
  }

  const handleSetCover = async (filename) => {
    await window.api?.photos.setCover(album.slug, filename).catch(() => {
      showToast('Failed to set cover photo.', 'error')
    })
    onSaved?.()
  }

  const handleDeletePhoto = async (filename) => {
    await window.api?.photos.remove(album.slug, filename).catch(() => {
      showToast('Failed to delete photo.', 'error')
    })
    onSaved?.()
  }

  const handleUpdatePhoto = async (filename, data) => {
    await window.api?.photos.update(album.slug, filename, data)
  }

  const handleReorderPhotos = async (filenames) => {
    await window.api?.photos.reorder(album.slug, filenames)
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
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className={s.deleteBtn}
              title="More options"
              onClick={() => { setMenuOpen((v) => !v); setConfirming(false) }}
            >
              <Icon name="dots" size={14} />
            </button>
            {menuOpen && (
              <div className={s.menu}>
                <button
                  className={s.menuItem}
                  onClick={() => { setMenuOpen(false); setConfirming(true) }}
                >
                  <Icon name="trash" size={13} color="var(--danger)" />
                  Delete album
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline delete confirmation */}
      {confirming && (
        <div className={s.confirmBar}>
          <span>Delete <strong>{album.title}</strong> and all its photos?</span>
          <div className={s.confirmActions}>
            <button className={s.cancelBtn} onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </button>
            <button className={s.confirmDeleteBtn} onClick={handleDeleteAlbum} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

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
              albumSlug={album.slug}
              onSetCover={handleSetCover}
              onDelete={handleDeletePhoto}
              onPhotoUpdate={handleUpdatePhoto}
              onReorder={handleReorderPhotos}
            />
          </>
        )}
      </div>
    </div>
  )
}

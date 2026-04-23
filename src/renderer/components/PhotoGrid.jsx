import { useState, useCallback, useRef } from 'react'
import s from './PhotoGrid.module.css'
import Icon from './Icon'

export default function PhotoGrid({ photos, coverFilename, albumSlug, onSetCover, onDelete, onPhotoUpdate, onReorder }) {
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [overIdx, setOverIdx]         = useState(null)
  const [editPhoto, setEditPhoto]     = useState(null)
  const saveTimer = useRef(null)

  const handleDragStart = (i) => setDraggingIdx(i)
  const handleDragOver  = (i, e) => { e.preventDefault(); if (i !== overIdx) setOverIdx(i) }
  const handleDrop      = (i) => {
    if (draggingIdx === null || draggingIdx === i) return
    const next = [...photos]
    const [moved] = next.splice(draggingIdx, 1)
    next.splice(i, 0, moved)
    onReorder?.(next.map(p => p.filename))
    setDraggingIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDraggingIdx(null); setOverIdx(null) }

  const openEdit = (photo) => {
    setEditPhoto({ filename: photo.filename, caption: photo.caption ?? '', altText: photo.altText ?? '' })
  }

  const patchEdit = useCallback((field, value) => {
    setEditPhoto(prev => {
      const next = { ...prev, [field]: value }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onPhotoUpdate?.(next.filename, { caption: next.caption, altText: next.altText })
      }, 500)
      return next
    })
  }, [onPhotoUpdate])

  if (!photos?.length) {
    return <div className={s.empty}>No photos yet — drop some above</div>
  }

  return (
    <>
      <div className={s.grid}>
        {photos.map((photo, i) => {
          const isCover    = photo.filename === coverFilename
          const isDragging = i === draggingIdx
          const isOver     = i === overIdx && draggingIdx !== null && draggingIdx !== i
          return (
            <div
              key={photo.filename}
              className={`${s.card} ${isDragging ? s.dragging : ''} ${isOver ? s.over : ''}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(i, e)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              <img
                src={photo.localPath ? `local://${photo.localPath}` : (photo.url ?? '')}
                alt={photo.altText ?? ''}
                className={s.img}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.style.background =
                    'linear-gradient(135deg, var(--bg-3), var(--bg-2))'
                }}
              />

              {isCover && (
                <div className={s.coverBadge}>
                  <Icon name="starFill" size={9} color="var(--accent)" /> COVER
                </div>
              )}

              <div className={s.dragHandle}>
                <Icon name="grip" size={13} color="var(--text-3)" />
              </div>

              <div className={s.overlay}>
                <div className={s.actions}>
                  <button
                    className={s.coverBtn}
                    title="Set as cover"
                    onClick={() => onSetCover(photo.filename)}
                    style={isCover ? { color: 'var(--accent)' } : undefined}
                  >
                    <Icon name={isCover ? 'starFill' : 'star'} size={12}
                      color={isCover ? 'var(--accent)' : 'var(--text)'} />
                  </button>
                  <button
                    className={s.editBtn}
                    title="Edit caption / alt text"
                    onClick={() => openEdit(photo)}
                  >
                    <Icon name="pencil" size={12} />
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    className={s.deleteBtn}
                    title="Delete"
                    onClick={() => onDelete(photo.filename)}
                  >
                    <Icon name="trash" size={12} color="var(--danger)" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editPhoto && (
        <div className={s.editOverlay} onClick={() => setEditPhoto(null)}>
          <div className={s.editPanel} onClick={(e) => e.stopPropagation()}>
            <div className={s.editHeader}>
              <span>Photo Details</span>
              <button className={s.editClose} onClick={() => setEditPhoto(null)}>
                <Icon name="close" size={12} />
              </button>
            </div>
            <label className={s.editField}>
              <span>Caption</span>
              <input
                value={editPhoto.caption}
                placeholder="Add a caption..."
                onChange={(e) => patchEdit('caption', e.target.value)}
              />
            </label>
            <label className={s.editField}>
              <span>Alt text</span>
              <input
                value={editPhoto.altText}
                placeholder="Describe the image for accessibility..."
                onChange={(e) => patchEdit('altText', e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </>
  )
}

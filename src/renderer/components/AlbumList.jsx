import { useState } from 'react'
import s from './AlbumList.module.css'
import Icon from './Icon'

export default function AlbumList({ albums, selectedSlug, onSelect, onAdd, onReorder }) {
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [overIdx, setOverIdx]         = useState(null)

  const handleDragStart = (i) => setDraggingIdx(i)
  const handleDragOver  = (i, e) => { e.preventDefault(); if (i !== overIdx) setOverIdx(i) }
  const handleDrop      = (i) => {
    if (draggingIdx === null || draggingIdx === i) return
    const next = [...albums]
    const [moved] = next.splice(draggingIdx, 1)
    next.splice(i, 0, moved)
    onReorder?.(next.map(a => a.slug))
    setDraggingIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDraggingIdx(null); setOverIdx(null) }

  return (
    <div className={s.container}>
      <div className={s.listHeader}>
        <span>Albums</span>
        <button className={s.addBtn} onClick={onAdd} title="New album">
          <Icon name="plus" size={13} />
        </button>
      </div>

      <div className={s.list}>
        {albums.map((album, i) => {
          const selected   = album.slug === selectedSlug
          const isDragging = i === draggingIdx
          const isOver     = i === overIdx && draggingIdx !== null && draggingIdx !== i
          return (
            <button
              key={album.slug}
              className={`${s.item} ${selected ? s.selected : ''} ${isDragging ? s.dragging : ''} ${isOver ? s.over : ''}`}
              draggable
              onClick={() => onSelect(album.slug)}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(i, e)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              <span className={s.grip}>
                <Icon name="grip" size={12} color="var(--text-3)" />
              </span>
              <span className={s.albumTitle}>
                {album.title}
                {album.isHome && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 9.5,
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                  }}>
                    HOME
                  </span>
                )}
              </span>
              <span className={s.albumCount}>{album.photos?.length ?? 0}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

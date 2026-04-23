import { useState } from 'react'
import s from './PhotoUpload.module.css'
import Icon from './Icon'

export default function PhotoUpload({ albumSlug, onUploaded, variant = 'big' }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploadPaths = async (paths) => {
    if (!paths.length) return
    setUploading(true)
    const result = await window.api?.photos.add(albumSlug, paths)
    setUploading(false)
    if (result?.ok) onUploaded?.(result.added)
  }

  // Drag-drop: Electron exposes file.path even with contextIsolation
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const paths = Array.from(e.dataTransfer.files).map((f) => f.path).filter(Boolean)
    uploadPaths(paths)
  }

  // Click: use native dialog from main process (file.path unavailable in renderer)
  const handleClick = async () => {
    const paths = await window.api?.dialog.openImages()
    if (paths?.length) uploadPaths(paths)
  }

  if (variant === 'small') {
    return (
      <div
        className={`${s.dropzone} ${dragOver ? s.dragOver : ''}`}
        style={{ padding: '14px', borderRadius: 6, marginBottom: 16, flexDirection: 'row', gap: 10 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Icon name="upload" size={13} />
        <span className={s.hint} style={{ margin: 0, textAlign: 'left' }}>
          {uploading ? 'Processing…' : 'Drop more photos or click to upload'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`${s.dropzone} ${dragOver ? s.dragOver : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className={s.icon}>
        <Icon name="image" size={20} color="var(--text-2)" />
      </div>
      <div className={s.label}>{uploading ? 'Processing…' : 'Drop photos here'}</div>
      {!uploading && (
        <div className={s.hint}>
          or <span>click to choose from your computer</span> — JPG, PNG, HEIC
        </div>
      )}
    </div>
  )
}

import s from './PhotoGrid.module.css'
import Icon from './Icon'

export default function PhotoGrid({ photos, coverFilename, onSetCover, onDelete }) {
  if (!photos?.length) return null

  return (
    <div className={s.grid}>
      {photos.map((photo) => {
        const isCover = photo.filename === coverFilename
        return (
          <div key={photo.filename} className={s.card}>
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
  )
}

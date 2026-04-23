import s from './AlbumList.module.css'
import Icon from './Icon'

export default function AlbumList({ albums, selectedSlug, onSelect, onAdd }) {
  return (
    <div className={s.container}>
      <div className={s.listHeader}>
        <span>Albums</span>
        <button className={s.addBtn} onClick={onAdd} title="New album">
          <Icon name="plus" size={13} />
        </button>
      </div>

      <div className={s.list}>
        {albums.map((album) => {
          const selected = album.slug === selectedSlug
          return (
            <button
              key={album.slug}
              className={`${s.item} ${selected ? s.selected : ''}`}
              onClick={() => onSelect(album.slug)}
            >
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

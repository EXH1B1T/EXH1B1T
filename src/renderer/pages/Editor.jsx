import { useState, useEffect, useCallback } from 'react'
import s from './Editor.module.css'
import Logo from '../components/Logo'
import Icon from '../components/Icon'
import AlbumList from '../components/AlbumList'
import AlbumEditor from '../components/AlbumEditor'
import PreviewPane from '../components/PreviewPane'
import PublishButton from '../components/PublishButton'
import UpdateBanner from '../components/UpdateBanner'

export default function Editor({ onSettings }) {
  const [albums, setAlbums]       = useState([])
  const [selectedSlug, setSlug]   = useState(null)
  const [user, setUser]           = useState(null)
  const [site, setSite]           = useState(null)
  const [previewW, setPreviewW]   = useState(460)
  const [dragging, setDragging]   = useState(false)
  const [previewTab, setPreviewTab] = useState('home')

  useEffect(() => {
    Promise.all([
      window.api?.albums.list(),
      window.api?.auth.getUser(),
      window.api?.site.get(),
    ]).then(([al, u, si]) => {
      const list = al ?? []
      setAlbums(list)
      setSlug(list[0]?.slug ?? null)
      setUser(u)
      setSite(si)
    })
  }, [])

  const reloadAlbums = useCallback(async () => {
    const list = await window.api?.albums.list()
    setAlbums(list ?? [])
  }, [])

  const handleAddAlbum = async () => {
    const result = await window.api?.albums.create({
      title: 'New Album',
      date: new Date().toISOString().slice(0, 7),
    })
    if (result?.ok) {
      await reloadAlbums()
      setSlug(result.album.slug)
    }
  }

  // Resize handle drag
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const main = document.getElementById('exh1b1t-main')
      if (!main) return
      const rect = main.getBoundingClientRect()
      setPreviewW(Math.max(320, Math.min(680, rect.right - e.clientX)))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const selectedAlbum = albums.find((a) => a.slug === selectedSlug) ?? null
  const currentUrl = user ? `${user.login}.github.io` : ''

  return (
    <div className={s.layout} style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
      {/* ── Sidebar ── */}
      <div className={s.sidebar}>
        <div className={s.titlebar}>
          <div className={s.appName}><Logo size={14} /></div>
        </div>

        {/* Pages section */}
        <div style={{ padding: '10px 8px 4px' }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, padding: '0 8px 4px' }}>Pages</div>
          {[{ slug: '__home', title: 'Home' }, { slug: '__about', title: 'About' }].map((p) => {
            const sel = p.slug === selectedSlug
            return (
              <button key={p.slug} onClick={() => setSlug(p.slug)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', padding: '7px 10px',
                  borderRadius: 5, marginBottom: 1, textAlign: 'left',
                  background: sel ? 'var(--bg-3)' : 'transparent',
                  color: sel ? 'var(--text)' : 'var(--text-2)',
                  borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent',
                  paddingLeft: sel ? 8 : 10,
                  border: 'none', cursor: 'pointer',
                  transition: 'background var(--t-fast)',
                }}>
                <span style={{ fontSize: 12.5 }}>{p.title}</span>
              </button>
            )
          })}
        </div>

        {/* Albums */}
        <AlbumList
          albums={albums}
          selectedSlug={selectedSlug}
          onSelect={setSlug}
          onAdd={handleAddAlbum}
        />

        {/* Footer */}
        <div className={s.sidebarFooter}>
          <div className={s.userRow}>
            <div className={s.avatar}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" />
                : <span>{user?.login?.[0]?.toUpperCase() ?? '?'}</span>}
            </div>
            <div className={s.username}>
              <strong>{user?.name ?? user?.login ?? '—'}</strong>
              <span>{currentUrl}</span>
            </div>
            <button className={s.settingsBtn} onClick={onSettings} title="Settings">
              <Icon name="gear" size={13} />
            </button>
          </div>
          <PublishButton siteUrl={`https://${currentUrl}`} />
        </div>
      </div>

      {/* ── Main: editor + preview ── */}
      <div id="exh1b1t-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <UpdateBanner />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Editor panel */}
          <div className={s.editorPanel}>
            <AlbumEditor album={selectedAlbum} onSaved={reloadAlbums} />
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={(e) => { e.preventDefault(); setDragging(true) }}
            style={{
              width: 4, cursor: 'col-resize', background: 'transparent',
              borderLeft: '1px solid var(--border)', flexShrink: 0, zIndex: 2,
            }}
          />

          {/* Preview panel */}
          <div className={s.previewPanel} style={{ width: previewW }}>
            <div className={s.previewHeader}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUrl}
              </div>
              <div className={s.previewNav}>
                {['home', 'about'].map((t) => (
                  <button key={t} onClick={() => setPreviewTab(t)}
                    className={previewTab === t ? s.active : ''}>
                    <Icon name={t === 'home' ? 'image' : 'desktop'} size={12} />
                  </button>
                ))}
              </div>
            </div>
            <PreviewPane
              page={previewTab}
              albumSlug={selectedSlug?.startsWith('__') ? null : selectedSlug}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

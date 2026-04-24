import { useState, useEffect, useCallback, useRef } from 'react'
import s from './Editor.module.css'
import Logo from '../components/Logo'
import Icon from '../components/Icon'
import AlbumList from '../components/AlbumList'
import AlbumEditor from '../components/AlbumEditor'
import HomeEditor from '../components/HomeEditor'
import AboutEditor from '../components/AboutEditor'
import NavEditor from '../components/NavEditor'
import PreviewPane from '../components/PreviewPane'
import PublishButton from '../components/PublishButton'
import UpdateBanner from '../components/UpdateBanner'

const PAGES = [
  { slug: '__home', title: 'Home' },
  { slug: '__about', title: 'About' },
]

export default function Editor({ onSettings }) {
  const [albums, setAlbums]         = useState([])
  const [selectedSlug, setSlug]     = useState(null)
  const [user, setUser]             = useState(null)
  const [site, setSite]             = useState(null)
  const [previewW, setPreviewW]     = useState(() => Math.round(window.innerWidth * 0.40))
  const [dragging, setDragging]     = useState(false)
  const mainRef                     = useRef(null)
  const [previewDevice, setDevice]  = useState('desktop')

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

  const reloadSite = useCallback(async () => {
    const si = await window.api?.site.get()
    setSite(si)
  }, [])

  const handleSaveSite = useCallback((next) => {
    setSite(next)
  }, [])

  const handleReorderAlbums = async (slugs) => {
    await window.api?.albums.reorder(slugs)
    await reloadAlbums()
  }

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

  // Resize handle — use pointer capture so pointerup is always received,
  // even when the cursor leaves the window mid-drag.
  const handleResizePointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const handleResizePointerMove = (e) => {
    if (!dragging) return
    const main = mainRef.current
    if (!main) return
    const rect = main.getBoundingClientRect()
    const maxW = rect.width - 300
    setPreviewW(Math.max(280, Math.min(maxW, rect.right - e.clientX)))
  }
  const handleResizePointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  const selectedAlbum = albums.find((a) => a.slug === selectedSlug) ?? null
  const currentUrl = user ? `${user.login}.github.io` : ''

  // Derive preview page from selection
  const previewPage = selectedSlug === '__about' ? 'about' : 'home'
  const previewAlbumSlug = selectedSlug?.startsWith('__') ? null : selectedSlug

  return (
    <div className={s.layout} style={{ display: 'flex', flexDirection: 'row', flex: 1, userSelect: dragging ? 'none' : undefined }}>
      {/* ── Sidebar ── */}
      <div className={s.sidebar}>
        {/* Empty drag region — macOS traffic lights sit here */}
        <div className={s.titlebar} />

        {/* Logo below traffic lights */}
        <div className={s.logoBar}>
          <Logo size={16} />
        </div>

        {/* Pages section */}
        <div style={{ padding: '10px 8px 4px' }}>
          <div className={s.sidebarSection}>Pages</div>
          {PAGES.map((p) => (
            <SidebarItem key={p.slug} label={p.title} selected={selectedSlug === p.slug} onClick={() => setSlug(p.slug)} />
          ))}
        </div>

        {/* Navigation section */}
        <div style={{ padding: '10px 8px 4px' }}>
          <div className={s.sidebarSection}>Navigation</div>
          <SidebarItem label="Menu" selected={selectedSlug === '__nav'} onClick={() => setSlug('__nav')} />
        </div>

        {/* Albums */}
        <AlbumList
          albums={albums}
          selectedSlug={selectedSlug}
          onSelect={setSlug}
          onAdd={handleAddAlbum}
          onReorder={handleReorderAlbums}
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
      <div ref={mainRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <UpdateBanner />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Editor panel */}
          <div className={s.editorPanel}>
            {selectedSlug === '__home' && (
              <HomeEditor site={site} albums={albums} onSave={handleSaveSite} />
            )}
            {selectedSlug === '__about' && (
              <AboutEditor site={site} onSave={handleSaveSite} />
            )}
            {selectedSlug === '__nav' && (
              <NavEditor site={site} albums={albums} onSave={handleSaveSite} />
            )}
            {selectedSlug !== '__home' && selectedSlug !== '__about' && selectedSlug !== '__nav' && (
              <AlbumEditor album={selectedAlbum} onSaved={reloadAlbums} />
            )}
          </div>

          {/* Resize handle */}
          <div
            className={s.resizeHandle}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            style={{ cursor: dragging ? 'col-resize' : undefined }}
          />

          {/* Preview panel */}
          <div className={s.previewPanel} style={{ width: previewW }}>
            <div className={s.previewHeader}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUrl}
              </div>
              <div className={s.previewNav}>
                {[{ key: 'desktop', icon: 'desktop' }, { key: 'mobile', icon: 'mobile' }].map(({ key, icon }) => (
                  <button key={key} onClick={() => setDevice(key)}
                    className={previewDevice === key ? s.active : ''}
                    title={key === 'desktop' ? 'Desktop preview' : 'Mobile preview'}>
                    <Icon name={icon} size={12} />
                  </button>
                ))}
              </div>
            </div>
            <PreviewPane
              page={previewPage}
              albumSlug={previewAlbumSlug}
              device={previewDevice}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarItem({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', padding: '7px 10px',
        borderRadius: 5, marginBottom: 1, textAlign: 'left',
        background: selected ? 'var(--bg-3)' : 'transparent',
        color: selected ? 'var(--text)' : 'var(--text-2)',
        borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
        paddingLeft: selected ? 8 : 10,
        cursor: 'pointer',
        transition: 'background var(--t-fast)',
      }}
    >
      <span style={{ fontSize: 12.5 }}>{label}</span>
    </button>
  )
}

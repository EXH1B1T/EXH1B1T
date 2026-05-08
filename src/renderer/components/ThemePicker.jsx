import { useState, useEffect } from 'react'
import s from './ThemePicker.module.css'
import Icon from './Icon'
import Btn from './Btn'

// ── Mini wireframe preview ────────────────────────────────────────────────────
function ThemePreview({ theme }) {
  const bg      = theme.previewBg      ?? '#1a1a1a'
  const surface = theme.previewSurface ?? '#242424'
  const text    = theme.previewText    ?? '#e8e8e8'
  const muted   = theme.previewMuted   ?? '#333330'
  const font    = theme.previewFont    ?? ''

  // Layout: sidebar (65px) | 3×2 photo grid
  // viewBox 280×140, photos at col=0,1,2 × row=0,1
  const cols = [0, 1, 2]
  const rows = [0, 1]
  const photoX   = (col) => 73 + col * 67
  const photoY   = (row) => 8  + row * 64

  return (
    <svg
      width="100%" height="140"
      viewBox="0 0 280 140"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Background */}
      <rect width="280" height="140" fill={bg} />

      {/* Sidebar */}
      <rect x="0" y="0" width="65" height="140" fill={surface} />
      <rect x="64" y="0" width="1" height="140" fill={text} opacity="0.06" />

      {/* Logo mark */}
      <circle cx="16" cy="16" r="3.5" fill={text} opacity="0.85" />

      {/* Photographer name (serif) */}
      <text x="26" y="19.5" fontSize="6" fill={text} fontFamily="Georgia, serif"
            opacity="0.85" letterSpacing="0.2">Jane Doe</text>

      {/* Nav item lines */}
      <rect x="12" y="34" width="32" height="1.5" rx="0.75" fill={text} opacity="0.2" />
      <rect x="12" y="40" width="22" height="1.5" rx="0.75" fill={text} opacity="0.2" />
      <rect x="12" y="46" width="28" height="1.5" rx="0.75" fill={text} opacity="0.2" />

      {/* Font label */}
      {font && (
        <text x="12" y="131" fontSize="5" fill={text} fontFamily="Georgia, serif"
              opacity="0.3" letterSpacing="0.8">{font}</text>
      )}

      {/* Photo grid 3 × 2 */}
      {cols.map(col =>
        rows.map(row => (
          <rect
            key={`${col}-${row}`}
            x={photoX(col)} y={photoY(row)}
            width={63} height={60}
            rx={1.5}
            fill={muted}
          />
        ))
      )}
    </svg>
  )
}

export default function ThemePicker() {
  const [themes, setThemes] = useState([])
  const [active, setActive] = useState('')

  useEffect(() => {
    window.api?.theme.list().then(setThemes)
    window.api?.theme.getCurrent().then(setActive)
  }, [])

  const handleInstall = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html'
    input.onchange = async () => {
      const file = input.files[0]
      if (!file) return
      const result = await window.api?.theme.install(file.path)
      if (result?.ok) {
        const updated = await window.api.theme.list()
        setThemes(updated)
      }
    }
    input.click()
  }

  const handleUse = async (name) => {
    await window.api?.theme.apply(name)
    setActive(name)
  }

  return (
    <>
      <div className={s.header}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: -0.3 }}>Theme</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            Pick a look for your site, or install a new theme from an .html file
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost">
            <Icon name="external" size={13} color="var(--text-2)" /> How to build a theme
          </Btn>
          <button className={s.installBtn} onClick={handleInstall}>
            <Icon name="plus" size={13} /> Install Theme
          </button>
        </div>
      </div>

      <div className={s.list}>
        {themes.map((theme) => {
          const isActive = theme.name === active
          return (
            <div key={theme.name} className={`${s.card} ${isActive ? s.activeBorder : ''}`}>
              <div style={{
                height: 140,
                borderBottom: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <ThemePreview theme={theme} />
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    padding: '3px 8px', background: 'var(--accent)', color: '#0a0a0a',
                    fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                    borderRadius: 3, fontWeight: 700,
                  }}>IN USE</div>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div className={s.themeName}>{theme.name}</div>
                <div className={s.themeDesc}>{theme.description ?? ''}</div>
                {isActive
                  ? <div className={s.activeLabel}>In use</div>
                  : <button className={s.useBtn} onClick={() => handleUse(theme.name)}>Use</button>
                }
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

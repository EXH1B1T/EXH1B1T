import { useState, useEffect } from 'react'
import s from './ThemePicker.module.css'
import Icon from './Icon'
import Btn from './Btn'

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
                background: theme.previewColor ?? 'var(--bg-3)',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
              }}>
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

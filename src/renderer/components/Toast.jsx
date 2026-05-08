import { useState, useEffect, useCallback } from 'react'
import s from './Toast.module.css'
import Icon from './Icon'

// ── Public helper — any module can call this ──────────────────────────────────
export function showToast(message, type = 'error') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }))
}

// ── Toast container — mount once at app root ──────────────────────────────────
let nextId = 0

export default function Toast() {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = ({ detail }) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, message: detail.message, type: detail.type ?? 'error' }])
      setTimeout(() => remove(id), 4200)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [remove])

  if (!toasts.length) return null

  return (
    <div className={s.stack} role="log" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${s.toast} ${s[t.type] ?? s.error}`}>
          <Icon
            name={t.type === 'success' ? 'check' : t.type === 'info' ? 'info' : 'close'}
            size={13}
            color={t.type === 'success' ? 'var(--success)' : t.type === 'info' ? 'var(--text-2)' : 'var(--danger)'}
          />
          <span className={s.msg}>{t.message}</span>
          <button className={s.close} onClick={() => remove(t.id)} aria-label="Dismiss">
            <Icon name="close" size={10} color="var(--text-3)" />
          </button>
        </div>
      ))}
    </div>
  )
}

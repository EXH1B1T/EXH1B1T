import { useState } from 'react'

const VARIANTS = {
  primary:    { background: 'var(--accent)',  color: '#0a0a0a', borderColor: 'var(--accent)' },
  secondary:  { background: 'var(--bg-3)',    color: 'var(--text)', borderColor: 'var(--border-2)' },
  ghost:      { background: 'transparent',    color: 'var(--text)', borderColor: 'transparent' },
  danger:     { background: 'transparent',    color: 'var(--danger)', borderColor: 'var(--border-2)' },
  accentText: { background: 'transparent',    color: 'var(--accent)', borderColor: 'var(--border-2)' },
}

const HOVER = {
  primary:    { background: '#defc4a' },
  secondary:  { background: 'var(--bg-4)' },
  ghost:      { background: 'var(--bg-3)' },
  danger:     { background: 'rgba(255,77,77,.08)' },
  accentText: { background: 'rgba(212,245,65,.08)' },
}

const PADDING = { sm: '6px 10px', md: '8px 14px', lg: '11px 18px' }
const FONT_SIZE = { sm: 12, md: 13, lg: 14 }

export default function Btn({
  children, variant = 'secondary', onClick, style,
  disabled = false, full = false, size = 'md',
}) {
  const [hov, setHov] = useState(false)

  const base = {
    fontFamily: 'inherit',
    fontSize: FONT_SIZE[size],
    fontWeight: 500,
    letterSpacing: 0.1,
    padding: PADDING[size],
    borderRadius: 5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    width: full ? '100%' : 'auto',
    border: '1px solid transparent',
    transition: 'background var(--t-fast), border-color var(--t-fast), color var(--t-fast)',
    opacity: disabled ? 0.5 : 1,
    ...VARIANTS[variant],
    ...(hov && !disabled ? HOVER[variant] : {}),
    ...style,
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={base}
    >
      {children}
    </button>
  )
}

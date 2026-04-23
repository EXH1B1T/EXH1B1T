// Labeled input wrapper used across Settings and album meta fields.
export default function Field({ label, hint, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <span style={{
          fontSize: 11,
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}>
          {label}
        </span>
      )}
      {children}
      {hint && (
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
          {hint}
        </span>
      )}
    </label>
  )
}

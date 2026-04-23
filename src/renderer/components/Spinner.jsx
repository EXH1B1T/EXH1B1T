export default function Spinner({ size = 14 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: '1.5px solid var(--border)',
      borderTopColor: 'var(--text-2)',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// Logotype: EXH1B1T — the two "1"s are highlighted in accent lime.
export default function Logo({ size = 14, spacing = '0.20em', style = {} }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      letterSpacing: spacing,
      fontSize: size,
      color: 'var(--text)',
      ...style,
    }}>
      {'EXH1B1T'.split('').map((ch, i) => (
        <span key={i} style={ch === '1' ? { color: 'var(--accent)' } : undefined}>{ch}</span>
      ))}
    </span>
  )
}

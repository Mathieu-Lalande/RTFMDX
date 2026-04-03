const VARIANTS = {
  default: { color: '#8892a4', bg: 'rgba(136, 146, 164, 0.1)', border: 'rgba(136, 146, 164, 0.2)' },
  primary: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)', border: 'rgba(129, 140, 248, 0.25)' },
  success: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  danger: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' },
  new: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  beta: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  deprecated: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)' },
}

export function Badge({ variant = 'default', children }) {
  const v = VARIANTS[variant] || VARIANTS.default
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: v.color,
      background: v.bg,
      border: `1px solid ${v.border}`,
      fontFamily: 'var(--font-sans)',
      verticalAlign: 'middle',
      margin: '0 3px'
    }}>
      {children}
    </span>
  )
}

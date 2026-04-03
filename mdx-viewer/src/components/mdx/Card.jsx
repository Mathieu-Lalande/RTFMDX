export function Card({ title, icon, children, href }) {
  const inner = (
    <div style={{
      padding: '1.25rem',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      transition: 'border-color 0.2s, background 0.2s',
      cursor: href ? 'pointer' : 'default'
    }}
    onMouseEnter={e => {
      if (href) {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.background = 'var(--bg-tertiary)'
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.background = 'var(--bg-secondary)'
    }}
    >
      {(icon || title) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          {icon && <span style={{ fontSize: '1.2em' }}>{icon}</span>}
          {title && (
            <span style={{
              fontWeight: '600',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}>{title}</span>
          )}
        </div>
      )}
      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )

  if (href) {
    return <a href={href} style={{ textDecoration: 'none', display: 'block', margin: '0.5rem 0' }}>{inner}</a>
  }
  return <div style={{ margin: '0.5rem 0' }}>{inner}</div>
}

export function CardGrid({ cols = 2, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '0.75rem',
      margin: '1.5rem 0'
    }}>
      {children}
    </div>
  )
}

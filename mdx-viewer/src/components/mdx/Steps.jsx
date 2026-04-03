import { Children, isValidElement } from 'react'

export function Steps({ children }) {
  const items = Children.toArray(children).filter(c =>
    isValidElement(c) || (typeof c === 'string' && c.trim())
  )

  // Si children est une liste ul/ol, on extrait ses li
  const listEl = items.find(c => isValidElement(c) && (c.type === 'ul' || c.type === 'ol'))
  const steps = listEl
    ? Children.toArray(listEl.props.children).filter(c => isValidElement(c) && c.type === 'li')
    : items

  return (
    <div style={{ margin: '1.5rem 0', paddingLeft: '0.5rem' }}>
      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: i < steps.length - 1 ? '1.25rem' : 0,
            position: 'relative'
          }}
        >
          {/* Ligne de connexion */}
          {i < steps.length - 1 && (
            <div style={{
              position: 'absolute',
              left: '15px',
              top: '32px',
              bottom: '-1.25rem',
              width: '1px',
              background: 'var(--border)'
            }} />
          )}

          {/* Numéro */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            color: 'var(--accent-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '13px',
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            zIndex: 1
          }}>
            {i + 1}
          </div>

          {/* Contenu */}
          <div style={{
            flex: 1,
            paddingTop: '5px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: 1.7
          }}>
            {isValidElement(step) && step.type === 'li' ? step.props.children : step}
          </div>
        </div>
      ))}
    </div>
  )
}

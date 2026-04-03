import { useState, Children, isValidElement } from 'react'

export function Tab({ label, children }) {
  return <div>{children}</div>
}

export function Tabs({ children }) {
  const tabs = Children.toArray(children).filter(
    c => isValidElement(c) && c.props.label
  )
  const [active, setActive] = useState(0)

  if (!tabs.length) return null

  return (
    <div style={{ margin: '1.5rem 0' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1rem',
        gap: '4px'
      }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: '7px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${i === active ? 'var(--accent)' : 'transparent'}`,
              color: i === active ? 'var(--accent-hover)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: i === active ? '600' : '400',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
              marginBottom: '-1px'
            }}
          >
            {tab.props.label}
          </button>
        ))}
      </div>

      {/* Contenu actif */}
      <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
        {tabs[active]?.props.children}
      </div>
    </div>
  )
}

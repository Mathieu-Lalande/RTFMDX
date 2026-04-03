import { useVault } from '../context/VaultContext.jsx'

export default function TabBar() {
  const { tabs, activeTabPath, setActiveTab, closeTab } = useVault()
  if (!tabs.length) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto', flexShrink: 0,
      scrollbarWidth: 'none',
    }}>
      {tabs.map(tab => {
        const isActive = tab.path === activeTabPath
        const label = tab.name.replace(/\.(mxt|md)$/, '')
        return (
          <div
            key={tab.path}
            onClick={() => setActiveTab(tab.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '0 12px', height: '34px', flexShrink: 0,
              cursor: 'pointer', fontSize: '12px', fontWeight: isActive ? '500' : '400',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--bg-primary)' : 'transparent',
              borderRight: '1px solid var(--border)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              position: 'relative', whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Point dirty */}
            {tab.isDirty && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            )}
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            {/* Bouton fermer */}
            <span
              onClick={e => { e.stopPropagation(); closeTab(tab.path) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '16px', height: '16px', borderRadius: '3px',
                color: 'var(--text-muted)', flexShrink: 0,
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
              </svg>
            </span>
          </div>
        )
      })}
    </div>
  )
}

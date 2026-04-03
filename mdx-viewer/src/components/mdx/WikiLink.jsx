import { useState, useEffect } from 'react'
import { useVault } from '../../context/VaultContext.jsx'

export function WikiLink({ href, children }) {
  const { openFileByName } = useVault()
  const [exists, setExists] = useState(null) // null=checking, true, false

  useEffect(() => {
    window.electron.resolveWikiLink(href).then(resolved => setExists(!!resolved))
  }, [href])

  return (
    <span
      onClick={() => openFileByName(href)}
      title={exists === false ? `Fichier introuvable : ${href}` : href}
      style={{
        color: exists === false ? 'var(--yellow)' : 'var(--accent-hover)',
        cursor: 'pointer',
        textDecoration: 'none',
        borderBottom: `1px solid ${exists === false ? 'rgba(245,158,11,0.4)' : 'rgba(129,140,248,0.4)'}`,
        transition: 'all 0.15s',
        fontWeight: '500',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderBottomColor = exists === false ? 'var(--yellow)' : 'var(--accent-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderBottomColor = exists === false ? 'rgba(245,158,11,0.4)' : 'rgba(129,140,248,0.4)' }}
    >
      {children}
    </span>
  )
}

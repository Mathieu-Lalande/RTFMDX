import { useState } from 'react'
import { useVault } from '../../context/VaultContext.jsx'
import FileTree from './FileTree.jsx'

function IconBtn({ children, title, onClick, active }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: active ? 'var(--accent-soft)' : 'transparent',
      border: 'none', color: active ? 'var(--accent-hover)' : 'var(--text-muted)',
      cursor: 'pointer', padding: '4px 6px', borderRadius: '5px',
      display: 'flex', alignItems: 'center', transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}}
    >{children}</button>
  )
}

export default function Sidebar({ activeFilePath, width, onResizeStart }) {
  const { vaultPath, vaultName, openVault } = useVault()
  const [search, setSearch] = useState('')
  // creating: { dir: '__root__' | path, type: 'file' | 'folder' } | null
  const [creating, setCreating] = useState(null)

  return (
    <div style={{
      width, minWidth: 160, maxWidth: 480, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-secondary)',
      overflow: 'hidden', flex: 1, position: 'relative',
    }}>
      {/* En-tête */}
      <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: vaultPath ? '6px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {vaultName || 'Aucun vault'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {vaultPath && (
              <>
                <IconBtn title="Nouveau fichier (N)" onClick={() => setCreating({ dir: '__root__', type: 'file' })}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                </IconBtn>
                <IconBtn title="Nouveau dossier" onClick={() => setCreating({ dir: '__root__', type: 'folder' })}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                </IconBtn>
              </>
            )}
            <IconBtn title="Ouvrir un vault" onClick={openVault}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </IconBtn>
          </div>
        </div>

        {vaultPath && (
          <div style={{ position: 'relative' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filtrer..." style={{
                width: '100%', padding: '5px 8px 5px 26px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: '5px', color: 'var(--text-primary)', fontSize: '11px',
                outline: 'none', fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
        )}
      </div>

      {/* Arbre */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!vaultPath ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', textAlign: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '12px' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.6, marginBottom: '12px' }}>
              Ouvrez un dossier comme vault pour gérer vos fichiers MDX.
            </p>
            <button onClick={openVault} style={{
              padding: '7px 14px', background: 'var(--accent-soft)',
              border: '1px solid var(--accent)', borderRadius: '6px',
              color: 'var(--accent-hover)', fontSize: '12px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}>Ouvrir un vault</button>
          </div>
        ) : (
          <FileTree activeFilePath={activeFilePath} creating={creating} setCreating={setCreating} />
        )}
      </div>

      {/* Handle resize */}
      <div onMouseDown={onResizeStart} style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px',
        cursor: 'col-resize', zIndex: 10,
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      />
    </div>
  )
}

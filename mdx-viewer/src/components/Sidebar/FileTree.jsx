import { useState, useRef, useEffect } from 'react'
import { useVault } from '../../context/VaultContext.jsx'

// ─── Inline input pour créer/renommer ──────────────────────────────────────
function InlineInput({ defaultValue = '', placeholder = 'Nom...', onConfirm, onCancel }) {
  const [val, setVal] = useState(defaultValue)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <input
      ref={ref}
      value={val}
      placeholder={placeholder}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        e.stopPropagation()
        if (e.key === 'Enter' && val.trim()) onConfirm(val.trim())
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => { if (val.trim()) onConfirm(val.trim()); else onCancel() }}
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--bg-primary)', border: '1px solid var(--accent)',
        borderRadius: '4px', color: 'var(--text-primary)', fontSize: '12px',
        padding: '2px 6px', outline: 'none', width: '100%',
        fontFamily: 'var(--font-sans)',
      }}
    />
  )
}

// ─── Menu contextuel ────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  // Ajuste position si déborde
  const style = {
    position: 'fixed', top: Math.min(y, window.innerHeight - 200), left: Math.min(x, window.innerWidth - 180),
    zIndex: 9999, background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '4px', minWidth: '170px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  }

  return (
    <div ref={ref} style={style}>
      {items.map((item, i) =>
        item === '---' ? (
          <div key={i} style={{ height: '1px', background: 'var(--border)', margin: '3px 0' }} />
        ) : (
          <button key={i} onClick={() => { item.action(); onClose() }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '6px 10px', background: 'transparent', border: 'none',
              borderRadius: '5px', color: item.danger ? '#f87171' : 'var(--text-primary)',
              fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  )
}

// ─── Icônes ─────────────────────────────────────────────────────────────────
const IcoFile = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoFolder = ({ color = 'currentColor' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoFilePlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
)
const IcoFolderPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
)
const IcoPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IcoCopy = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IcoStar = ({ filled }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? '#fbbf24' : 'none'} stroke={filled ? '#fbbf24' : 'currentColor'} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const IcoSplit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
  </svg>
)

// ─── Item dossier ────────────────────────────────────────────────────────────
function DirItem({ node, depth, activeFilePath, creating, setCreating }) {
  const { createFile, createFolder, renameFile, deleteFolder, moveFile } = useVault()
  const [open, setOpen] = useState(depth < 1)
  const [renaming, setRenaming] = useState(false)
  const [menu, setMenu] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const containerRef = useRef(null)
  const indent = depth * 14

  const isCreatingHere = creating?.dir === node.path

  const handleContextMenu = (e) => {
    e.preventDefault(); e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY, items: [
      { label: 'Nouveau fichier',  icon: <IcoFilePlus />,   action: () => { setOpen(true); setCreating({ dir: node.path, type: 'file' }) } },
      { label: 'Nouveau dossier', icon: <IcoFolderPlus />, action: () => { setOpen(true); setCreating({ dir: node.path, type: 'folder' }) } },
      '---',
      { label: 'Renommer',  icon: <IcoPencil />, action: () => setRenaming(true) },
      '---',
      { label: 'Supprimer', icon: <IcoTrash />,  danger: true, action: () => deleteFolder(node.path) },
    ]})
  }

  // Handlers sur le conteneur (pas juste le header) pour capturer les drags sur les enfants
  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes('text/x-file-path')) {
      e.preventDefault()
      e.stopPropagation() // empêche le dossier parent de voler le drop
      setDragOver(true)
    }
  }
  const handleDragLeave = (e) => {
    // Ne désactiver que quand on quitte vraiment le conteneur (pas juste un enfant)
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setDragOver(false)
    }
  }
  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragOver(false)
    const oldPath = e.dataTransfer.getData('text/x-file-path')
    if (!oldPath || oldPath === node.path) return
    // Empêcher de déplacer un dossier dans lui-même ou un de ses descendants
    if (node.path === oldPath || node.path.startsWith(oldPath + '\\') || node.path.startsWith(oldPath + '/')) return
    setOpen(true)
    await moveFile({ oldPath, newDir: node.path })
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        draggable
        onDragStart={e => {
          e.dataTransfer.setData('text/x-file-path', node.path)
          e.dataTransfer.effectAllowed = 'move'
          e.stopPropagation()
        }}
        onContextMenu={handleContextMenu}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: `3px 6px 3px ${6 + indent}px`, cursor: 'pointer',
          borderRadius: '5px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500',
          userSelect: 'none',
          background: dragOver ? 'var(--accent-soft)' : 'transparent',
          outline: dragOver ? '1px solid var(--accent)' : 'none',
        }}
        onMouseEnter={e => { if (!dragOver) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!dragOver) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ opacity: 0.5, fontSize: '9px', flexShrink: 0, width: '8px' }}>{open ? '▾' : '▸'}</span>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><IcoFolder color="var(--yellow)" /></span>
        {renaming
          ? <InlineInput defaultValue={node.name}
              onConfirm={n => { renameFile({ oldPath: node.path, newName: n }); setRenaming(false) }}
              onCancel={() => setRenaming(false)} />
          : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        }
      </div>

      {open && (
        <div>
          {/* Input inline de création */}
          {isCreatingHere && (
            <div style={{ padding: `3px 6px 3px ${6 + (depth + 1) * 14}px`, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{creating.type === 'folder' ? <IcoFolder /> : <IcoFile />}</span>
              <InlineInput
                placeholder={creating.type === 'folder' ? 'Nom du dossier...' : 'nom-fichier.mxt'}
                onConfirm={async (name) => {
                  if (creating.type === 'folder') await createFolder({ dir: node.path, name })
                  else await createFile({ dir: node.path, name })
                  setCreating(null)
                }}
                onCancel={() => setCreating(null)}
              />
            </div>
          )}
          {node.children?.map(child => (
            <TreeItem key={child.path} node={child} depth={depth + 1} activeFilePath={activeFilePath} creating={creating} setCreating={setCreating} />
          ))}
        </div>
      )}
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  )
}

// ─── Item fichier ────────────────────────────────────────────────────────────
function FileItem({ node, depth, activeFilePath }) {
  const { openFileByPath, renameFile, deleteFile, duplicateFile, favorites, toggleFavorite, openSecondaryPanel } = useVault()
  const [renaming, setRenaming] = useState(false)
  const [menu, setMenu] = useState(null)
  const isActive = node.path === activeFilePath
  const isFav = favorites.includes(node.path)
  const indent = depth * 14
  const label = node.name.replace(/\.(mxt|md)$/, '')

  const handleContextMenu = (e) => {
    e.preventDefault(); e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY, items: [
      { label: isFav ? 'Désépingler' : 'Épingler en favoris', icon: <IcoStar filled={isFav} />, action: () => toggleFavorite(node.path) },
      { label: 'Ouvrir en panneau droit', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>, action: () => openSecondaryPanel(node.path) },
      '---',
      { label: 'Renommer',  icon: <IcoPencil />, action: () => setRenaming(true) },
      { label: 'Dupliquer', icon: <IcoCopy />,   action: () => duplicateFile(node.path) },
      '---',
      { label: 'Supprimer', icon: <IcoTrash />,  danger: true, action: () => deleteFile(node.path) },
    ]})
  }

  return (
    <div>
      <div
        draggable
        onDragStart={e => {
          e.dataTransfer.setData('text/x-file-path', node.path)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onContextMenu={handleContextMenu}
        onClick={() => openFileByPath(node.path)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: `3px 6px 3px ${6 + indent}px`, cursor: 'pointer', borderRadius: '5px',
          background: isActive ? 'var(--accent-soft)' : 'transparent',
          color: isActive ? 'var(--accent-hover)' : 'var(--text-secondary)',
          fontSize: '12px',
          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
          userSelect: 'none',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}><IcoFile /></span>
        {renaming
          ? <InlineInput defaultValue={node.name}
              onConfirm={n => { renameFile({ oldPath: node.path, newName: n }); setRenaming(false) }}
              onCancel={() => setRenaming(false)} />
          : <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        }
        {isFav && !renaming && <span style={{ flexShrink: 0, fontSize: '9px', color: '#fbbf24', marginLeft: '2px' }}>★</span>}
      </div>
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  )
}

// ─── Section favoris ─────────────────────────────────────────────────────────
function FavoritesSection({ activeFilePath }) {
  const { favorites, vaultFiles, openFileByPath, toggleFavorite, openSecondaryPanel } = useVault()
  const [menu, setMenu] = useState(null)

  if (!favorites.length) return null

  const favFiles = favorites.map(path => {
    const found = vaultFiles.find(f => f.path === path)
    return found || { path, name: path.split(/[\\/]/).pop() }
  })

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ padding: '8px 10px 4px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Favoris
      </div>
      {favFiles.map(f => {
        const isActive = f.path === activeFilePath
        const label = f.name.replace(/\.(mxt|md)$/, '')
        return (
          <div
            key={f.path}
            onClick={() => openFileByPath(f.path)}
            onContextMenu={e => {
              e.preventDefault()
              e.stopPropagation()
              setMenu({
                x: e.clientX, y: e.clientY,
                items: [
                  { label: 'Désépingler', icon: <IcoStar />, action: () => toggleFavorite(f.path) },
                  '---',
                  { label: 'Ouvrir en panneau droit', icon: <IcoSplit />, action: () => openSecondaryPanel(f.path) },
                ],
              })
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 6px', cursor: 'pointer', borderRadius: '5px',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              color: isActive ? 'var(--accent-hover)' : 'var(--text-secondary)',
              fontSize: '12px', userSelect: 'none',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: '10px', color: '#fbbf24', flexShrink: 0 }}>★</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
          </div>
        )
      })}
      <div style={{ height: '1px', background: 'var(--border)', margin: '6px 4px 2px' }} />
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  )
}

function TreeItem({ node, depth, activeFilePath, creating, setCreating }) {
  if (node.type === 'dir') return <DirItem node={node} depth={depth} activeFilePath={activeFilePath} creating={creating} setCreating={setCreating} />
  return <FileItem node={node} depth={depth} activeFilePath={activeFilePath} />
}

// ─── Helpers filtrage ─────────────────────────────────────────────────────────
function flattenFiles(nodes) {
  return nodes.flatMap(n => n.type === 'dir' ? flattenFiles(n.children || []) : [n])
}

// ─── FileTree racine ─────────────────────────────────────────────────────────
export default function FileTree({ activeFilePath, creating, setCreating, search }) {
  const { tree, createFile, createFolder } = useVault()

  // Mode recherche : liste plate filtrée
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    const matches = flattenFiles(tree).filter(f => f.name.toLowerCase().includes(q))
    return (
      <div style={{ padding: '4px' }}>
        {matches.length === 0 ? (
          <div style={{ padding: '20px 12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
            Aucun fichier trouvé
          </div>
        ) : matches.map(node => (
          <FileItem key={node.path} node={node} depth={0} activeFilePath={activeFilePath} />
        ))}
      </div>
    )
  }

  if (!tree.length && !creating) return (
    <div style={{ padding: '20px 12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', lineHeight: 1.7 }}>
      Vault vide.<br/><span style={{ opacity: 0.6 }}>Clic droit ou bouton + pour créer.</span>
    </div>
  )

  return (
    <div style={{ padding: '4px' }}>
      <FavoritesSection activeFilePath={activeFilePath} />
      {creating?.dir === '__root__' && (
        <div style={{ padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{creating.type === 'folder' ? <IcoFolder /> : <IcoFile />}</span>
          <InlineInput
            placeholder={creating.type === 'folder' ? 'Nom du dossier...' : 'nom-fichier.mxt'}
            onConfirm={async (name) => {
              if (creating.type === 'folder') await createFolder({ name })
              else await createFile({ name })
              setCreating(null)
            }}
            onCancel={() => setCreating(null)}
          />
        </div>
      )}
      {tree.map(node => (
        <TreeItem key={node.path} node={node} depth={0} activeFilePath={activeFilePath} creating={creating} setCreating={setCreating} />
      ))}
    </div>
  )
}

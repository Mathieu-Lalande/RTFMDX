import { useState } from 'react'
import Icons from './Icons.jsx'

// ─── Construction de l'arbre depuis la liste plate de fichiers ───────────────
function buildTree(files) {
  const root = { children: {}, files: [] }
  for (const file of files) {
    const parts = (file.relativePath || file.name).replace(/\\/g, '/').split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!node.children[part]) node.children[part] = { name: part, children: {}, files: [] }
      node = node.children[part]
    }
    node.files.push(file)
  }
  return root
}

// ─── Icônes ──────────────────────────────────────────────────────────────────
const IcoFile = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoFolder = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={open ? 'rgba(245,158,11,0.15)' : 'none'} stroke="#f59e0b" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

// ─── Item fichier ─────────────────────────────────────────────────────────────
function FileItem({ file, onSelectFile, loading, depth }) {
  const indent = depth * 16
  return (
    <button
      onClick={() => onSelectFile(file)}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: '100%', textAlign: 'left',
        padding: `7px 10px 7px ${10 + indent}px`,
        background: 'transparent', border: 'none', borderRadius: '6px',
        color: 'var(--text-secondary)',
        cursor: loading ? 'default' : 'pointer', fontSize: '12px',
        fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        if (!loading) {
          e.currentTarget.style.background = 'var(--accent)'
          e.currentTarget.style.color = 'white'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      <span style={{ width: '8px', flexShrink: 0 }} />
      <IcoFile />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file.name}
      </span>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px', flexShrink: 0,
        background: file.name.endsWith('.mxt') ? 'rgba(100,200,255,0.15)' : 'rgba(147,112,219,0.15)',
        color: file.name.endsWith('.mxt') ? 'rgba(100,200,255,0.8)' : 'rgba(147,112,219,0.8)',
      }}>
        {file.name.endsWith('.mxt') ? 'mxt' : 'md'}
      </span>
    </button>
  )
}

// ─── Item dossier ─────────────────────────────────────────────────────────────
function FolderItem({ node, onSelectFile, loading, depth }) {
  const [open, setOpen] = useState(depth === 0)
  const indent = depth * 16
  const subFolders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))
  const hasContent = subFolders.length > 0 || node.files.length > 0

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', textAlign: 'left',
          padding: `7px 10px 7px ${10 + indent}px`,
          background: 'transparent', border: 'none', borderRadius: '6px',
          color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '12px', fontWeight: '500',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ opacity: 0.5, fontSize: '9px', width: '8px', flexShrink: 0 }}>
          {open ? '▾' : '▸'}
        </span>
        <IcoFolder open={open} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {hasContent && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
            {node.files.length > 0 ? node.files.length : ''}
          </span>
        )}
      </button>

      {open && (
        <div>
          {subFolders.map(child => (
            <FolderItem key={child.name} node={child} onSelectFile={onSelectFile} loading={loading} depth={depth + 1} />
          ))}
          {node.files.map(file => (
            <FileItem key={file.path} file={file} onSelectFile={onSelectFile} loading={loading} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Racine de l'arbre ────────────────────────────────────────────────────────
function TreeRoot({ tree, onSelectFile, loading }) {
  const folders = Object.values(tree.children).sort((a, b) => a.name.localeCompare(b.name))
  const files = tree.files

  if (folders.length === 0 && files.length === 0) {
    return (
      <div style={{
        padding: '20px', textAlign: 'center',
        background: 'rgba(107,114,128,0.1)', borderRadius: '6px',
        color: 'var(--text-muted)', fontSize: '13px',
      }}>
        Aucun fichier Markdown trouvé
      </div>
    )
  }

  return (
    <div>
      {folders.map(child => (
        <FolderItem key={child.name} node={child} onSelectFile={onSelectFile} loading={loading} depth={0} />
      ))}
      {files.map(file => (
        <FileItem key={file.path} file={file} onSelectFile={onSelectFile} loading={loading} depth={0} />
      ))}
    </div>
  )
}

// ─── GitConnect modal ─────────────────────────────────────────────────────────
export default function GitConnect({ onRepositoryOpened, onClose }) {
  const [repoDir, setRepoDir] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tree, setTree] = useState(null)
  const [fileCount, setFileCount] = useState(0)
  const [step, setStep] = useState('browse')
  const [isGitRepo, setIsGitRepo] = useState(false)

  const handleBrowseDirectory = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await window.electron.browseDirectory?.()
      if (!result?.ok) { setLoading(false); return }

      const dirPath = result.dirPath
      const repoCheck = await window.electron.gitDetectRepo(dirPath)
      setIsGitRepo(repoCheck?.isRepo ?? false)

      const filesResult = await window.electron.gitGetMarkdownFiles(dirPath)
      const files = filesResult?.files || []
      setTree(buildTree(files))
      setFileCount(files.length)
      setRepoDir(dirPath)
      setStep('select')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFile = async (file) => {
    setLoading(true)
    setError('')
    try {
      const result = await window.electron.gitReadMd(file.path)
      if (result.ok) {
        onRepositoryOpened({ file, content: result.content, repoDir })
        onClose()
      } else {
        setError(result.error || 'Impossible de lire le fichier')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '500px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px',
          boxShadow: '0 32px 128px rgba(0,0,0,0.8)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.git}
            Ouvrir un répertoire
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', padding: '0' }}>
            {Icons.close}
          </button>
        </div>

        {/* Étape 1 : sélection du dossier */}
        {step === 'browse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              Sélectionnez un dossier contenant des fichiers{' '}
              <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.md</code>
              {' '}ou{' '}
              <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.mxt</code>.
            </p>
            <button
              onClick={handleBrowseDirectory}
              disabled={loading}
              style={{
                padding: '12px 16px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '6px', cursor: loading ? 'default' : 'pointer',
                fontSize: '14px', fontWeight: '500',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-sans)',
              }}
            >
              {loading ? Icons.loading : Icons.browse}
              {loading ? 'Chargement...' : 'Parcourir…'}
            </button>
            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                {Icons.error}
                <div>{error}</div>
              </div>
            )}
          </div>
        )}

        {/* Étape 2 : arbre de fichiers */}
        {step === 'select' && tree && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', flex: 1 }}>
            {/* Chemin + badge git */}
            <div style={{ flexShrink: 0 }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {repoDir}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isGitRepo && (
                  <span style={{ fontSize: '10px', padding: '2px 7px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                    Git
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {fileCount} fichier{fileCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Arbre scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)', padding: '6px' }}>
              <TreeRoot tree={tree} onSelectFile={handleSelectFile} loading={loading} />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', flexShrink: 0 }}>
                {error}
              </div>
            )}

            <button
              onClick={() => { setStep('browse'); setError(''); setTree(null); setRepoDir('') }}
              style={{
                padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500', fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                flexShrink: 0,
              }}
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

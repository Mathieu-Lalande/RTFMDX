import { useState } from 'react'
import Icons from './Icons.jsx'

export default function GitConnect({ onRepositoryOpened, onClose }) {
  const [repoDir, setRepoDir] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState([])
  const [step, setStep] = useState('browse') // browse | select
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
      setFiles(filesResult?.files || [])
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
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.git}
            Ouvrir un répertoire
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', padding: '0' }}>
            {Icons.close}
          </button>
        </div>

        {step === 'browse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              Sélectionnez un dossier contenant des fichiers <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.md</code> ou <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.mxt</code>.
            </p>

            <button
              onClick={handleBrowseDirectory}
              disabled={loading}
              style={{
                padding: '12px 16px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '6px', cursor: loading ? 'default' : 'pointer',
                fontSize: '14px', fontWeight: '500',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.7 : 1,
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

        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {repoDir}
              </p>
              {isGitRepo && (
                <span style={{ fontSize: '10px', padding: '2px 7px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  Git
                </span>
              )}
            </div>

            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {files.length} fichier{files.length !== 1 ? 's' : ''} trouvé{files.length !== 1 ? 's' : ''}
            </p>

            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {files.map(file => (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  disabled={loading}
                  style={{
                    textAlign: 'left', padding: '10px 12px',
                    background: 'var(--bg-hover)', border: '1px solid var(--border)',
                    borderRadius: '6px', color: 'var(--text-primary)',
                    cursor: loading ? 'default' : 'pointer', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                >
                  {Icons.file}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {file.name}
                      <span style={{ fontSize: '10px', padding: '1px 6px', background: file.name.endsWith('.mxt') ? 'rgba(100,200,255,0.2)' : 'rgba(147,112,219,0.2)', borderRadius: '3px', color: file.name.endsWith('.mxt') ? 'rgba(100,200,255,0.8)' : 'rgba(147,112,219,0.8)' }}>
                        {file.name.endsWith('.mxt') ? 'mxt' : 'md'}
                      </span>
                    </div>
                    {file.relativePath && file.relativePath !== file.name && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.relativePath}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {files.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(107,114,128,0.1)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Aucun fichier Markdown trouvé
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '6px', color: '#ef4444', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <button
              onClick={() => { setStep('browse'); setError(''); setFiles([]); setRepoDir('') }}
              style={{ padding: '10px 16px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

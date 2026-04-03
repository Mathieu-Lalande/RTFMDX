import { useState } from 'react'
import Icons from './Icons.jsx'

/**
 * Composant pour ouvrir un repo local
 * VS Code Git gère la synchronisation
 */
export default function GitConnect({ onRepositoryOpened, onClose }) {
  const [repoDir, setRepoDir] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState([])
  const [step, setStep] = useState('browse') // browse | select

  const handleBrowseDirectory = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await window.electron.openVault?.()
      if (result?.ok) {
        const dirPath = result.vaultPath
        // Vérifier si c'est un repo git
        const repoCheck = await window.electron.gitDetectRepo(dirPath)
        if (repoCheck?.isRepo) {
          // Charger les fichiers .md
          const filesResult = await window.electron.gitGetMarkdownFiles(dirPath)
          setFiles(filesResult?.files || [])
          setRepoDir(dirPath)
          setStep('select')
        } else {
          setError('Attention : Ce répertoire n\'est pas un repo Git. Continuez quand même ?')
          setRepoDir(dirPath)
          // Charger les fichiers quand même
          const filesResult = await window.electron.gitGetMarkdownFiles(dirPath)
          setFiles(filesResult?.files || [])
          setStep('select')
        }
      }
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
        // Sauvegarder le repo path
        window.electron.saveConfig({ gitRepoPath: repoDir }).catch(() => {})

        onRepositoryOpened({
          file,
          content: result.content,
          repoDir,
        })
        onClose()
      } else {
        setError(result.error || 'Impossible de lire le fichier')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 32px 128px rgba(0,0,0,0.8)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.git}
            Ouvrir un Répertoire
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0',
            }}
          >
            {Icons.close}
          </button>
        </div>

        {step === 'browse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              Sélectionnez un répertoire contenant des fichiers Markdown.<br/>
              <span style={{ opacity: 0.7 }}>VS Code Git gérera la synchronisation automatiquement.</span>
            </p>

            <div style={{
              padding: '8px 10px',
              background: 'rgba(107,114,128,0.1)',
              border: '1px solid rgba(107,114,128,0.3)',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
            }}>
              <strong>Note :</strong> Vous pouvez éditer les fichiers <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.md</code> (markdown basique) et les fichiers <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.mdx</code> (avec composants).
            </div>

            <button
              onClick={handleBrowseDirectory}
              disabled={loading}
              style={{
                padding: '12px 16px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? Icons.loading : Icons.browse}
              {loading ? 'Chargement...' : 'Parcourir...'}
            </button>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.5)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                {Icons.error}
                <div>{error}</div>
              </div>
            )}
          </div>
        )}

        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ marginBottom: '4px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                Chemin
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {repoDir}
              </p>
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', margin: '12px 0 8px 0', textTransform: 'uppercase' }}>
                {files.length} Fichier{files.length !== 1 ? 's' : ''} Mark down trouvé{files.length !== 1 ? 's' : ''}
              </p>

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {files.map(file => (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file)}
                    disabled={loading}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      cursor: loading ? 'default' : 'pointer',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: 1,
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        e.target.style.background = 'var(--accent)'
                        e.target.style.color = 'white'
                      }
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'var(--bg-hover)'
                      e.target.style.color = 'var(--text-primary)'
                    }}
                  >
                    {Icons.file}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {file.name}
                        {file.name.endsWith('.md') && !file.name.endsWith('.mdx') && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(147,112,219,0.2)', borderRadius: '3px', color: 'rgba(147,112,219,0.8)' }}>
                            markdown
                          </span>
                        )}
                        {file.name.endsWith('.mdx') && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(100,200,255,0.2)', borderRadius: '3px', color: 'rgba(100,200,255,0.8)' }}>
                            mdx
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {file.relativePath}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {files.length === 0 && (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  background: 'rgba(107,114,128,0.1)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}>
                  Aucun fichier Markdown trouvé
                </div>
              )}
            </div>

            <button
              onClick={() => { setStep('browse'); setError(''); setFiles([]); setRepoDir(''); }}
              style={{
                padding: '10px 16px',
                background: 'var(--bg-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
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

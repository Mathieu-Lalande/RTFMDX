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
  const [step, setStep] = useState('browse') // browse | select | vault
  const [vaultChoice, setVaultChoice] = useState(null) // null | 'repo' | 'custom'
  const [customVaultPath, setCustomVaultPath] = useState('')

  const handleBrowseDirectory = async () => {
    setLoading(true)
    setError('')
    try {
      // Browse sans toucher au vault
      const result = await window.electron.browseDirectory?.()
      if (result?.ok) {
        const dirPath = result.dirPath
        const repoCheck = await window.electron.gitDetectRepo(dirPath)
        if (repoCheck?.isRepo) {
          const filesResult = await window.electron.gitGetMarkdownFiles(dirPath)
          setFiles(filesResult?.files || [])
          setRepoDir(dirPath)
          setStep('select')
        } else {
          setError('Attention : Ce répertoire n\'est pas un repo Git. Continuez quand même ?')
          setRepoDir(dirPath)
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
        window.electron.saveConfig({ gitRepoPath: repoDir }).catch(err => console.error('[config] Échec sauvegarde repo git:', err))
        onRepositoryOpened({ file, content: result.content, repoDir })
        // Aller à l'étape vault
        setStep('vault')
        setLoading(false)
      } else {
        setError(result.error || 'Impossible de lire le fichier')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleUseRepoAsVault = async () => {
    setLoading(true)
    try {
      await window.electron.setVault?.(repoDir)
      setVaultChoice('repo')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      onClose()
    }
  }

  const handleChooseCustomVault = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await window.electron.openVault?.()
      if (result?.ok) {
        setCustomVaultPath(result.vaultPath)
        setVaultChoice('custom')
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSkipVault = () => {
    onClose()
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
              <strong>Note :</strong> Vous pouvez éditer les fichiers <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.md</code> (markdown) et <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px' }}>.mxt</code> (markdown + composants).
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
                {files.length} Fichier{files.length !== 1 ? 's' : ''} Markdown trouvé{files.length !== 1 ? 's' : ''}
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
                        {file.name.endsWith('.md') && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(147,112,219,0.2)', borderRadius: '3px', color: 'rgba(147,112,219,0.8)' }}>
                            md
                          </span>
                        )}
                        {file.name.endsWith('.mxt') && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(100,200,255,0.2)', borderRadius: '3px', color: 'rgba(100,200,255,0.8)' }}>
                            mxt
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

        {step === 'vault' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 4px 0', lineHeight: '1.5' }}>
              Où souhaitez-vous définir votre vault ?
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.4', opacity: 0.7 }}>
              Le vault est le dossier affiché dans la barre latérale pour gérer vos fichiers.
            </p>

            {/* Option 1 : utiliser le repo git comme vault */}
            <button
              onClick={handleUseRepoAsVault}
              disabled={loading}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: loading ? 'default' : 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            >
              <div style={{ marginTop: '1px', color: 'var(--accent)' }}>{Icons.git}</div>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Utiliser le répertoire Git</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{repoDir}</div>
              </div>
            </button>

            {/* Option 2 : choisir un autre dossier */}
            <button
              onClick={handleChooseCustomVault}
              disabled={loading}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: loading ? 'default' : 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            >
              <div style={{ marginTop: '1px', color: 'var(--accent)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Choisir un autre emplacement…</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Ouvrir ou créer un dossier vault n'importe où sur l'ordinateur
                </div>
              </div>
            </button>

            {/* Option 3 : passer */}
            <button
              onClick={handleSkipVault}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '4px',
              }}
            >
              Continuer sans vault
            </button>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.5)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '12px',
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

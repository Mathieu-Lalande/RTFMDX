import { useState, useEffect } from 'react'

/**
 * Indicateur de statut Git
 * Affiche les changements non pushés et permet de commit/push
 */
export default function GitStatus({ repoPath, activeFilePath }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [error, setError] = useState('')

  // Récupère le statut git
  const fetchStatus = async () => {
    if (!repoPath) return
    try {
      const result = await window.electron.gitStatus()
      if (result.success) {
        setStatus(result)
      }
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [repoPath])

  const handleCommitPush = async () => {
    if (!commitMessage.trim()) {
      setError('Veuillez entrer un message de commit')
      return
    }

    setLoading(true)
    setError('')

    try {
      const filesToCommit = activeFilePath ? [activeFilePath] : undefined
      const result = await window.electron.gitCommitPush(commitMessage, filesToCommit)
      if (result.success) {
        setCommitMessage('')
        setShowCommitDialog(false)
        setStatus(result.info)
      } else {
        setError(result.error || 'Erreur lors du commit/push')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!repoPath || !status) return null

  const hasChanges = status.status && status.status.trim().length > 0
  const changesCount = status.status ? status.status.trim().split('\n').length : 0

  return (
    <>
      {/* Indicateur dans la barre de statut */}
      {hasChanges && (
        <div
          onClick={() => setShowCommitDialog(true)}
          style={{
            padding: '4px 10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
          }}
          title={`${changesCount} changement(s) non pushé(s)`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="7" x2="12" y2="17" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
          {changesCount} changement{changesCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Dialog commit/push */}
      {showCommitDialog && (
        <div
          onClick={() => { setShowCommitDialog(false); setError(''); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
              Commit et Push
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Message de commit
              </label>
              <textarea
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                placeholder="Décrivez vos changements..."
                disabled={loading}
                style={{
                  width: '100%',
                  resize: 'none',
                  height: '60px',
                  padding: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '8px 10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.5)',
                borderRadius: '4px',
                color: '#ef4444',
                fontSize: '11px',
                marginBottom: '12px',
              }}>
                {error}
              </div>
            )}

            {status.status && (
              <div style={{ marginBottom: '12px', fontSize: '11px' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Changements à committer :
                </div>
                <div style={{
                  maxHeight: '100px',
                  overflowY: 'auto',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}>
                  {status.status.trim().split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setShowCommitDialog(false); setError(''); }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCommitPush}
                disabled={loading || !commitMessage.trim()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: loading ? 'var(--text-muted)' : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'default' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: loading || !commitMessage.trim() ? 0.5 : 1,
                }}
              >
                {loading ? 'Syncronisation...' : 'Commit & Push'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

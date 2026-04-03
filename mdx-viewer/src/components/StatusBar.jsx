
export default function StatusBar({ filePath, wordCount, charCount, saveStatus, mode, tabCount, zoom, autoSaveDelay, isReadOnly }) {
  return (
    <div style={{
      height: '26px',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '16px',
      flexShrink: 0,
      fontSize: '11px',
      color: 'var(--text-muted)',
      userSelect: 'none'
    }}>
      {/* Chemin */}
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '400px',
        flex: 1
      }}>
        {filePath || 'Non sauvegardé'}
      </span>

      <div style={{ display: 'flex', gap: '16px', flexShrink: 0, alignItems: 'center' }}>
        {isReadOnly && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--yellow)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Lecture seule
          </span>
        )}
        {autoSaveDelay > 0 && (
          <span style={{ color: 'var(--green)', opacity: 0.7 }}>Auto-save activé</span>
        )}
        {zoom !== undefined && zoom !== 1.0 && (
          <span>{Math.round(zoom * 100)}%</span>
        )}
        <span>{wordCount} mots</span>
        <span>{charCount} caractères</span>
        <span>MDX</span>
        {mode && <span>— {{ read: 'Lecture', split: 'Split', edit: 'Édition' }[mode]}</span>}
        {tabCount > 0 && <span>{tabCount} onglet{tabCount > 1 ? 's' : ''}</span>}
        {saveStatus === 'saved' && (
          <span style={{ color: 'var(--green)' }}>Sauvegardé</span>
        )}
        {saveStatus === 'error' && (
          <span style={{ color: 'var(--red)' }}>Erreur de sauvegarde</span>
        )}
      </div>
    </div>
  )
}

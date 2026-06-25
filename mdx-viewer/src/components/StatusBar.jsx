
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
      color: 'var(--text-secondary)',
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
            🔒 Lecture seule
          </span>
        )}
        {autoSaveDelay > 0 && (
          <span style={{ color: 'var(--green)' }}>Auto-save activé</span>
        )}
        {zoom !== undefined && zoom !== 1.0 && (
          <span>{Math.round(zoom * 100)}%</span>
        )}
        <span>{wordCount} mots</span>
        <span>{charCount} caractères</span>
        <span>{filePath?.endsWith('.md') ? 'MD' : 'MXT'}</span>
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

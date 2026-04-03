
export default function StatusBar({ filePath, wordCount, charCount, saveStatus, mode }) {
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

      <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
        <span>{wordCount} mots</span>
        <span>{charCount} caractères</span>
        <span>MDX</span>
        {mode && <span style={{ color: 'var(--text-muted)' }}>— {{ read: 'Lecture', split: 'Split', edit: 'Édition' }[mode]}</span>}
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

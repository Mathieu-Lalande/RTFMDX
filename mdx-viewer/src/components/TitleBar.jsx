import { useState, useEffect } from 'react'

const MODE_CONFIG = [
  {
    key: 'read',
    label: 'Lecture',
    title: 'Mode lecture (Ctrl+E)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    )
  },
  {
    key: 'split',
    label: 'Split',
    title: 'Mode split (Ctrl+E)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
    )
  },
  {
    key: 'edit',
    label: 'Édition',
    title: 'Mode édition (Ctrl+E)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    )
  }
]

export default function TitleBar({ fileName, isDirty, onSave, onOpen, saveStatus, mode, onModeChange }) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electron.windowIsMaximized().then(setIsMaximized)
  }, [])

  const handleMaximize = async () => {
    await window.electron.windowMaximize()
    const m = await window.electron.windowIsMaximized()
    setIsMaximized(m)
  }

  return (
    <div style={{
      height: '42px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      WebkitAppRegion: 'drag',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', flexShrink: 0 }}>
        <div style={{
          width: '20px', height: '20px',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
          borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: '700', color: 'white'
        }}>M</div>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500' }}>MDX</span>
      </div>

      {/* Actions fichier */}
      <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
        <TitleButton onClick={onOpen} title="Ouvrir (Ctrl+O)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Ouvrir</span>
        </TitleButton>
        <TitleButton onClick={onSave} title="Sauvegarder (Ctrl+S)" accent={isDirty}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>{saveStatus === 'saving' ? 'Sauvegarde…' : saveStatus === 'saved' ? 'Sauvegardé ✓' : 'Sauvegarder'}</span>
        </TitleButton>
      </div>

      {/* Nom du fichier — centré */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>{fileName}</span>
        {isDirty && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
      </div>

      {/* Toggle de mode */}
      <div style={{
        display: 'flex',
        WebkitAppRegion: 'no-drag',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '7px',
        padding: '3px',
        gap: '2px',
        marginRight: '12px',
        flexShrink: 0
      }}>
        {MODE_CONFIG.map(({ key, label, title, icon }) => (
          <ModeButton
            key={key}
            active={mode === key}
            onClick={() => onModeChange(key)}
            title={title}
            icon={icon}
            label={label}
          />
        ))}
      </div>

      {/* Boutons fenêtre Windows */}
      <div style={{ display: 'flex', WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
        <WindowBtn onClick={() => window.electron.windowMinimize()} title="Réduire">
          <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="1.5" fill="currentColor"/></svg>
        </WindowBtn>
        <WindowBtn onClick={handleMaximize} title={isMaximized ? 'Restaurer' : 'Agrandir'}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="0" width="8" height="8"/>
              <rect x="0" y="2" width="8" height="8" fill="var(--bg-secondary)"/>
              <rect x="0" y="2" width="8" height="8"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="0" y="0" width="10" height="10"/>
            </svg>
          )}
        </WindowBtn>
        <WindowBtn onClick={() => window.electron.windowClose()} title="Fermer" isClose>
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <line x1="0" y1="0" x2="10" y2="10"/>
            <line x1="10" y1="0" x2="0" y2="10"/>
          </svg>
        </WindowBtn>
      </div>
    </div>
  )
}

function ModeButton({ active, onClick, title, icon, label }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px',
        borderRadius: '5px',
        border: 'none',
        background: active ? 'var(--accent)' : hovered ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'white' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '12px', fontWeight: active ? '600' : '400',
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function TitleButton({ children, onClick, title, accent }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px',
        background: accent ? 'var(--accent-soft)' : 'transparent',
        border: '1px solid', borderColor: accent ? 'var(--accent)' : 'transparent',
        borderRadius: '5px',
        color: accent ? 'var(--accent-hover)' : 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '12px', fontWeight: '500',
        fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
        WebkitAppRegion: 'no-drag'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = accent ? 'var(--accent-soft)' : 'var(--bg-hover)'
        e.currentTarget.style.color = accent ? 'var(--accent-hover)' : 'var(--text-primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = accent ? 'var(--accent-soft)' : 'transparent'
        e.currentTarget.style.color = accent ? 'var(--accent-hover)' : 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}

function WindowBtn({ children, onClick, title, isClose }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '46px', height: '42px',
        background: hovered ? (isClose ? '#c42b1c' : 'var(--bg-hover)') : 'transparent',
        border: 'none',
        color: hovered && isClose ? 'white' : 'var(--text-secondary)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s', WebkitAppRegion: 'no-drag'
      }}
    >
      {children}
    </button>
  )
}

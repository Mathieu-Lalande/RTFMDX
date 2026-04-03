import { useState, useEffect, useRef } from 'react'

export default function FindBar({ open, onClose }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)
  const listenerAdded = useRef(false)

  // Register found-in-page listener once
  useEffect(() => {
    if (listenerAdded.current) return
    listenerAdded.current = true
    window.electron.onFoundInPage(r => setResult(r))
  }, [])

  // Focus & reset on open, stop on close
  useEffect(() => {
    if (open) {
      setText('')
      setResult(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      window.electron.stopFindInPage()
      setResult(null)
    }
  }, [open])

  // Trigger search whenever text changes
  useEffect(() => {
    if (!open) return
    if (text.trim()) {
      window.electron.findInPage(text, true, false)
    } else {
      window.electron.stopFindInPage()
      setResult(null)
    }
  }, [text, open])

  const goNext = () => { if (text) window.electron.findInPage(text, true, true) }
  const goPrev = () => { if (text) window.electron.findInPage(text, false, true) }

  const handleKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? goPrev() : goNext() }
  }

  if (!open) return null

  const count = result?.matches ?? 0
  const current = result?.activeMatchOrdinal ?? 0

  return (
    <div style={{
      position: 'fixed', top: '50px', right: '14px', zIndex: 5000,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '6px 8px',
      display: 'flex', alignItems: 'center', gap: '6px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      minWidth: '260px',
    }}>
      {/* Search icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>

      {/* Input */}
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Rechercher dans la page…"
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--text-primary)', fontSize: '13px',
          fontFamily: 'var(--font-sans)',
        }}
      />

      {/* Match count */}
      {text && (
        <span style={{ fontSize: '11px', color: count === 0 ? 'var(--red)' : 'var(--text-muted)', flexShrink: 0, minWidth: '40px', textAlign: 'right' }}>
          {count === 0 ? 'Aucun' : `${current}/${count}`}
        </span>
      )}

      {/* Prev */}
      <NavButton onClick={goPrev} title="Précédent (Shift+Entrée)" disabled={!text || count === 0}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </NavButton>

      {/* Next */}
      <NavButton onClick={goNext} title="Suivant (Entrée)" disabled={!text || count === 0}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </NavButton>

      {/* Close */}
      <NavButton onClick={onClose} title="Fermer (Échap)">
        <svg width="11" height="11" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </NavButton>
    </div>
  )
}

function NavButton({ children, onClick, title, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        opacity: disabled ? 0.4 : 1,
        padding: '3px 5px', borderRadius: '4px',
        display: 'flex', alignItems: 'center',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = disabled ? 'var(--text-muted)' : 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}

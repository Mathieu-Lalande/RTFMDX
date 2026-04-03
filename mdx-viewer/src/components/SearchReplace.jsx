import { useState, useEffect, useRef, useCallback } from 'react'

export default function SearchReplace({ value, onChange, onClose }) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)
  const searchRef = useRef(null)

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [])

  // Find all match positions (case-insensitive)
  const matches = useCallback(() => {
    if (!search) return []
    const result = []
    const lower = value.toLowerCase()
    const lowerSearch = search.toLowerCase()
    let idx = 0
    while ((idx = lower.indexOf(lowerSearch, idx)) !== -1) {
      result.push(idx)
      idx += lowerSearch.length
    }
    return result
  }, [value, search])

  const allMatches = matches()
  const count = allMatches.length
  const safeIndex = count > 0 ? ((matchIndex % count) + count) % count : 0

  const goNext = () => {
    if (!count) return
    setMatchIndex(i => (i + 1) % count)
  }

  const goPrev = () => {
    if (!count) return
    setMatchIndex(i => ((i - 1) + count) % count)
  }

  const doReplace = () => {
    if (!count || !search) return
    const pos = allMatches[safeIndex]
    const newVal = value.slice(0, pos) + replace + value.slice(pos + search.length)
    onChange(newVal)
    // Keep same index (next match shifts)
  }

  const doReplaceAll = () => {
    if (!search) return
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    onChange(value.replace(regex, replace))
    setMatchIndex(0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    if (e.key === 'Enter') { e.preventDefault(); goNext() }
    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); goPrev() }
  }

  return (
    <div style={{
      position: 'absolute', top: '38px', right: '16px', zIndex: 500,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '10px 12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', gap: '8px',
      minWidth: '340px',
    }}>
      {/* Row 1: search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          ref={searchRef}
          value={search}
          onChange={e => { setSearch(e.target.value); setMatchIndex(0) }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher..."
          style={{
            flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: '5px', color: 'var(--text-primary)', fontSize: '12px',
            padding: '5px 8px', outline: 'none', fontFamily: 'var(--font-sans)',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, minWidth: '70px' }}>
          {search ? (count === 0 ? 'Aucun' : `${safeIndex + 1} / ${count}`) : ''}
        </span>
        <SrBtn onClick={goPrev} title="Précédent (Shift+Enter)" disabled={!count}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </SrBtn>
        <SrBtn onClick={goNext} title="Suivant (Enter)" disabled={!count}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </SrBtn>
        <SrBtn onClick={onClose} title="Fermer (Esc)">
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
          </svg>
        </SrBtn>
      </div>

      {/* Row 2: replace */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          value={replace}
          onChange={e => setReplace(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Remplacer par..."
          style={{
            flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: '5px', color: 'var(--text-primary)', fontSize: '12px',
            padding: '5px 8px', outline: 'none', fontFamily: 'var(--font-sans)',
          }}
        />
        <SrBtn onClick={doReplace} disabled={!count} title="Remplacer cette occurrence">
          <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Remplacer</span>
        </SrBtn>
        <SrBtn onClick={doReplaceAll} disabled={!count} title="Tout remplacer">
          <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Tout</span>
        </SrBtn>
      </div>
    </div>
  )
}

function SrBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'transparent', border: '1px solid var(--border)',
        borderRadius: '4px', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'default' : 'pointer', padding: '4px 7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontFamily: 'var(--font-sans)',
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = disabled ? 'var(--text-muted)' : 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}

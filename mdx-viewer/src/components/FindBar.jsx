import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const HIGHLIGHT_CLASS = '__find_highlight'
const ACTIVE_CLASS = '__find_active'

export default forwardRef(function FindBar({ open, onClose, contentRef }, ref) {
  const [text, setText] = useState('')
  const [matches, setMatches] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const matchesRef = useRef([])

  // Expose selectAll method to parent
  useImperativeHandle(ref, () => ({
    selectAll: () => {
      inputRef.current?.select()
    }
  }), [])

  // Clean up highlights
  const clearHighlights = () => {
    const container = contentRef?.current
    if (!container) return
    container.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => {
      const parent = el.parentNode
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      parent.normalize()
    })
    matchesRef.current = []
    setMatches([])
    setActiveIndex(-1)
  }

  // Find all occurrences in DOM
  const findMatches = (query) => {
    clearHighlights()
    if (!query.trim()) return

    const container = contentRef?.current
    if (!container) return

    const found = []
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )

    // Collect all replacements BEFORE modifying DOM
    const replacements = []
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const testRegex = new RegExp(escapedQuery, 'i')
    const matchRegex = new RegExp(escapedQuery, 'gi')

    let node
    while ((node = walker.nextNode())) {
      const text = node.nodeValue
      if (!testRegex.test(text)) continue

      const matches = []
      let match
      while ((match = matchRegex.exec(text)) !== null) {
        matches.push({ index: match.index, length: match[0].length })
      }

      if (matches.length > 0) {
        replacements.push({ node, matches })
      }
    }

    // Now apply all replacements
    replacements.forEach(({ node, matches }) => {
      const fragment = document.createDocumentFragment()
      let lastIndex = 0

      matches.forEach(({ index, length }) => {
        // Add text before match
        if (index > lastIndex) {
          fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex, index)))
        }

        // Create highlight span
        const span = document.createElement('span')
        span.className = HIGHLIGHT_CLASS
        span.style.backgroundColor = 'rgba(255, 193, 7, 0.4)'
        span.style.cursor = 'default'
        span.appendChild(document.createTextNode(node.nodeValue.slice(index, index + length)))
        found.push(span)
        fragment.appendChild(span)

        lastIndex = index + length
      })

      // Add remaining text
      if (lastIndex < node.nodeValue.length) {
        fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex)))
      }

      node.parentNode.replaceChild(fragment, node)
    })

    matchesRef.current = found
    setMatches(found)
    if (found.length > 0) setActiveIndex(0)
  }

  // Update active highlight
  const setActive = (idx) => {
    matchesRef.current.forEach((el, i) => {
      el.classList.remove(ACTIVE_CLASS)
      el.style.backgroundColor = i === idx ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 193, 7, 0.4)'
    })
    if (idx >= 0 && idx < matchesRef.current.length) {
      matchesRef.current[idx].classList.add(ACTIVE_CLASS)
      matchesRef.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setActiveIndex(idx)
  }

  // Focus & reset on open, cleanup on close
  useEffect(() => {
    if (open) {
      setText('')
      clearHighlights()
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      clearHighlights()
    }
  }, [open])

  // Trigger search whenever text changes
  useEffect(() => {
    if (!open) return
    findMatches(text)
    if (matchesRef.current.length > 0) setActive(0)
  }, [text, open])

  const goNext = () => {
    if (matches.length === 0) return
    const nextIdx = (activeIndex + 1) % matches.length
    setActive(nextIdx)
  }

  const goPrev = () => {
    if (matches.length === 0) return
    const prevIdx = activeIndex - 1 < 0 ? matches.length - 1 : activeIndex - 1
    setActive(prevIdx)
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? goPrev() : goNext() }
    if (e.key === 'ArrowDown') { e.preventDefault(); goNext() }
    if (e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
  }

  if (!open) return null

  const count = matches.length
  const current = activeIndex >= 0 ? activeIndex + 1 : 0

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
})

function NavButton({ children, onClick, title, disabled }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
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

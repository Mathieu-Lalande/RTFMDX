import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'

/**
 * FindBar — recherche dans le source texte (comptage/navigation fiable)
 * + highlight DOM d'UN seul match à la fois dans le contenu visible.
 */
export default forwardRef(function FindBar({ open, onClose, source, previewRef, editorViewRef }, ref) {
  const [text, setText] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const inputRef = useRef(null)
  const activeSpanRef = useRef(null) // le seul span de highlight actif

  useImperativeHandle(ref, () => ({ selectAll: () => inputRef.current?.select() }), [])

  // ── Comptage dans le source texte (jamais de stale ref) ─────────────────────
  const matches = useMemo(() => {
    if (!text.trim() || !source) return []
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    try { return [...source.matchAll(new RegExp(escaped, 'gi'))] }
    catch { return [] }
  }, [text, source])

  useEffect(() => { setCurrentIdx(0) }, [text])

  useEffect(() => {
    if (open) { setText(''); setCurrentIdx(0); setTimeout(() => inputRef.current?.focus(), 50) }
    else { removeHighlight() }
  }, [open])

  // ── Un seul span DOM à la fois pour le highlight visuel ─────────────────────
  const removeHighlight = useCallback(() => {
    const span = activeSpanRef.current
    if (!span?.isConnected) { activeSpanRef.current = null; return }
    const parent = span.parentNode
    if (!parent) { activeSpanRef.current = null; return }
    while (span.firstChild) parent.insertBefore(span.firstChild, span)
    parent.removeChild(span)
    parent.normalize()
    activeSpanRef.current = null
  }, [])

  const highlightMatch = useCallback((idx) => {
    removeHighlight()
    const srcMatch = matches[idx]

    // ── Highlight dans l'éditeur CodeMirror (sélection + scroll) ──────────────
    const view = editorViewRef?.current
    if (view && srcMatch) {
      try {
        view.dispatch({
          selection: { anchor: srcMatch.index, head: srcMatch.index + srcMatch[0].length },
          scrollIntoView: true,
        })
      } catch { /* ignore */ }
    }

    // ── Highlight DOM dans l'aperçu (un seul <mark> à la fois) ───────────────
    const container = previewRef?.current
    if (!container || !text.trim()) return

    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

    let count = 0
    let node
    while ((node = walker.nextNode())) {
      let m
      regex.lastIndex = 0
      const nodeText = node.nodeValue
      while ((m = regex.exec(nodeText)) !== null) {
        if (count === idx) {
          try {
            const range = document.createRange()
            range.setStart(node, m.index)
            range.setEnd(node, m.index + m[0].length)
            const mark = document.createElement('mark')
            mark.style.cssText = 'background:rgba(255,193,7,0.85);color:#000;border-radius:2px;padding:0 1px;'
            range.surroundContents(mark)
            activeSpanRef.current = mark
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } catch { /* node traversal edge case, ignore */ }
          return
        }
        count++
      }
    }
  }, [text, matches, previewRef, editorViewRef, removeHighlight])

  // Re-highlight quand l'index ou le texte change
  useEffect(() => {
    if (!open || !text.trim() || matches.length === 0) { removeHighlight(); return }
    // Petit délai pour laisser le preview re-rendre si besoin
    const t = setTimeout(() => highlightMatch(currentIdx), 50)
    return () => clearTimeout(t)
  }, [currentIdx, text, open, matches.length, highlightMatch, removeHighlight])

  // Nettoyer si le preview re-rend (span détaché)
  useEffect(() => {
    return () => removeHighlight()
  }, [source, removeHighlight])

  // ── Contexte texte pour la preview du match courant ─────────────────────────
  const preview = useMemo(() => {
    const match = matches[currentIdx]
    if (!match || !source) return null
    const start = source.lastIndexOf('\n', match.index) + 1
    const end = source.indexOf('\n', match.index + match[0].length)
    const line = source.slice(start, end === -1 ? undefined : end).trim()
    const relIdx = match.index - start
    return { line, relIdx, matchLen: match[0].length }
  }, [matches, currentIdx, source])

  const goNext = () => { if (matches.length) setCurrentIdx(i => (i + 1) % matches.length) }
  const goPrev = () => { if (matches.length) setCurrentIdx(i => (i - 1 + matches.length) % matches.length) }

  const handleKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? goPrev() : goNext() }
    if (e.key === 'ArrowDown') { e.preventDefault(); goNext() }
    if (e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
  }

  if (!open) return null

  const count = matches.length
  const current = count > 0 ? currentIdx + 1 : 0

  return (
    <div style={{
      position: 'fixed', top: '50px', right: '14px', zIndex: 5000,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '6px 8px',
      display: 'flex', flexDirection: 'column', gap: '5px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      minWidth: '280px', maxWidth: '380px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          placeholder="Rechercher dans le fichier…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}
        />
        {text && (
          <span style={{ fontSize: '11px', color: count === 0 ? '#f87171' : 'var(--text-muted)', flexShrink: 0, minWidth: '40px', textAlign: 'right' }}>
            {count === 0 ? 'Aucun' : `${current}/${count}`}
          </span>
        )}
        <NavButton onClick={goPrev} title="Précédent (Shift+Entrée)" disabled={!text || count === 0}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
        </NavButton>
        <NavButton onClick={goNext} title="Suivant (Entrée)" disabled={!text || count === 0}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </NavButton>
        <NavButton onClick={onClose} title="Fermer (Échap)">
          <svg width="11" height="11" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
        </NavButton>
      </div>

      {preview && (
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '4px', padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview.line.slice(0, preview.relIdx)}
          <mark style={{ background: 'rgba(255,193,7,0.4)', color: 'var(--text-primary)', borderRadius: '2px', padding: '0 1px' }}>
            {preview.line.slice(preview.relIdx, preview.relIdx + preview.matchLen)}
          </mark>
          {preview.line.slice(preview.relIdx + preview.matchLen)}
        </div>
      )}
    </div>
  )
})

function NavButton({ children, onClick, title, disabled }) {
  return (
    <button onClick={onClick} onMouseDown={e => e.preventDefault()} title={title} disabled={disabled}
      style={{ background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: disabled ? 0.4 : 1, padding: '3px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'all 0.1s' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = disabled ? 'var(--text-muted)' : 'var(--text-secondary)' }}
    >{children}</button>
  )
}

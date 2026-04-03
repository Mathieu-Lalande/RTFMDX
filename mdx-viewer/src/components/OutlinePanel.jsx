import { useMemo } from 'react'

// Reproduit le comportement de github-slugger (utilisé par rehype-slug)
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // garde \w (a-z, 0-9, _) et espaces/tirets
    .replace(/\s+/g, '-')      // espaces → tirets
    .replace(/^-+|-+$/g, '')   // trim tirets en début/fin
}

function parseHeadings(source) {
  if (!source) return []
  // Remove code blocks first to avoid matching headings inside them
  const withoutCode = source.replace(/```[\s\S]*?```/gm, (m) => '\n'.repeat(m.split('\n').length - 1))
  const headings = []
  const regex = /^(#{1,6})\s+(.+)$/gm
  let match
  while ((match = regex.exec(withoutCode)) !== null) {
    headings.push({ level: match[1].length, text: match[2].trim() })
  }
  return headings
}

export default function OutlinePanel({ source, onHeadingClick, open, onClose }) {
  const headings = useMemo(() => parseHeadings(source), [source])

  if (!open) return null

  return (
    <div style={{
      width: '220px',
      flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 10px 6px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Plan</span>
        </div>
        <button onClick={onClose} title="Fermer le plan (Ctrl+Shift+O)" style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '2px 4px', borderRadius: '4px',
          display: 'flex', alignItems: 'center',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
          </svg>
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}>
        {headings.length === 0 ? (
          <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.6 }}>
            Aucun titre trouvé
          </div>
        ) : headings.map((h, i) => {
          const indent = (h.level - 1) * 10
          const fontSize = h.level === 1 ? '12px' : h.level === 2 ? '11px' : '11px'
          const fontWeight = h.level <= 2 ? '600' : '400'
          const color = h.level === 1 ? 'var(--text-primary)' : h.level === 2 ? 'var(--text-secondary)' : 'var(--text-muted)'
          return (
            <div
              key={i}
              onClick={() => onHeadingClick && onHeadingClick(slugify(h.text))}
              title={h.text}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                paddingLeft: `${6 + indent}px`, paddingRight: '6px',
                paddingTop: '3px', paddingBottom: '3px',
                cursor: 'pointer', borderRadius: '4px',
                color,
                fontSize,
                fontWeight,
                lineHeight: 1.4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color }}
            >
              <span style={{
                fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0,
                width: '14px', textAlign: 'right', fontFamily: 'var(--font-mono)',
              }}>H{h.level}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.text}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

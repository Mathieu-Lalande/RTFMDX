import { useState, useEffect, useRef } from 'react'
import * as runtime from 'react/jsx-runtime'
import { Callout } from './mxt/Callout.jsx'
import { Steps } from './mxt/Steps.jsx'
import { CodeBlock } from './mxt/CodeBlock.jsx'
import { Badge } from './mxt/Badge.jsx'
import { Card, CardGrid } from './mxt/Card.jsx'
import { Tabs, Tab } from './mxt/Tabs.jsx'
import { WikiLink } from './mxt/WikiLink.jsx'
import { useVault } from '../context/VaultContext.jsx'

const COMPONENTS = {
  Callout, Steps, CodeBlock, Badge, Card, CardGrid, Tabs, Tab, WikiLink,
  pre: ({ children }) => <div>{children}</div>,
  code: ({ className, children }) => {
    const lang = className?.replace('language-', '') || ''
    if (lang) return <CodeBlock language={lang}>{String(children)}</CodeBlock>
    return <code className={className}>{children}</code>
  }
}

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

function FrontmatterBadge({ frontmatter }) {
  if (!frontmatter || !Object.keys(frontmatter).length) return null
  const { title, date, tags, author } = frontmatter
  const tagList = Array.isArray(tags) ? tags : tags ? [tags] : []

  return (
    <div style={{
      marginBottom: '2rem', paddingBottom: '1.5rem',
      borderBottom: '1px solid var(--border)',
      display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
    }}>
      {date && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {date}
        </span>
      )}
      {author && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {author}
        </span>
      )}
      {tagList.map(tag => (
        <span key={tag} style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
          background: 'var(--accent-soft)', color: 'var(--accent-hover)',
          border: '1px solid rgba(99,102,241,0.25)', fontWeight: '500',
        }}>#{tag}</span>
      ))}
    </div>
  )
}

export default function Preview({ source, filePath, frontmatter, readOnly, zoom }) {
  const debouncedSource = useDebounce(source, 400)
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      const result = await window.electron.compileMxt(debouncedSource, filePath)
      if (cancelled) return
      if (!result.ok) { setError(result.error); return }
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(result.code)
        const { default: MXTContent } = fn(runtime)
        setContent(<MXTContent components={COMPONENTS} />)
        setError(null)
      } catch (e) { setError(e.message) }
    }
    render()
    return () => { cancelled = true }
  }, [debouncedSource, filePath])

  const effectiveZoom = zoom ?? 1.0
  const proseStyle = effectiveZoom !== 1.0
    ? { fontSize: `calc(15px * ${effectiveZoom})` }
    : {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {!readOnly && (
        <div style={{
          padding: '6px 16px', background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Aperçu</span>
        </div>
      )}

      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto',
        padding: readOnly ? '4rem 5rem' : '2.5rem 3rem',
      }}>
        <div style={{ maxWidth: '72ch', margin: '0 auto' }}>
          {readOnly && frontmatter && <FrontmatterBadge frontmatter={frontmatter} />}
          {error ? (
            <div style={{
              padding: '1rem 1.25rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius)', color: '#f87171',
              fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6,
            }}>
              <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.5rem' }}>Erreur MXT</strong>
              {error}
            </div>
          ) : (
            <div className="prose" style={proseStyle}>{content}</div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import * as runtime from 'react/jsx-runtime'
import { Callout } from './mxt/Callout.jsx'
import { Steps } from './mxt/Steps.jsx'
import { CodeBlock } from './mxt/CodeBlock.jsx'
import { Badge } from './mxt/Badge.jsx'
import { Card, CardGrid } from './mxt/Card.jsx'
import { Tabs, Tab } from './mxt/Tabs.jsx'
import { WikiLink } from './mxt/WikiLink.jsx'

const COMPONENTS = {
  Callout, Steps, CodeBlock, Badge, Card, CardGrid, Tabs, Tab, WikiLink,
  pre: ({ children, ...props }) => {
    const child = Array.isArray(children) ? children[0] : children
    const lang = child?.props?.className?.replace('language-', '')
    if (lang) return <CodeBlock language={lang}>{String(child.props.children)}</CodeBlock>
    return (
      <pre {...props} style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '1rem 1.2rem', overflowX: 'auto',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '0.85em',
        lineHeight: '1.6', whiteSpace: 'pre', color: 'var(--text-secondary)',
      }}>{children}</pre>
    )
  },
  code: ({ className, children }) => {
    const lang = className?.replace('language-', '') || ''
    if (lang) return <CodeBlock language={lang}>{String(children)}</CodeBlock>
    return <code style={{ background: 'var(--bg-secondary)', borderRadius: '3px', padding: '0.1em 0.4em', fontSize: '0.88em', fontFamily: "'JetBrains Mono', monospace" }}>{children}</code>
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
  const { date, tags, author } = frontmatter
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

const HTML_EXPORT_CSS = `
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 3rem 2rem; background: #fff; color: #1a1a2e; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.75; }
article { max-width: 70ch; margin: 0 auto; }
h1,h2,h3,h4,h5,h6 { font-family: system-ui, -apple-system, sans-serif; line-height: 1.25; margin-top: 2em; margin-bottom: 0.5em; color: #111; }
h1 { font-size: 2em; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.4em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
h3 { font-size: 1.2em; }
p { margin: 0.8em 0; }
a { color: #4f46e5; }
code { background: #f3f4f6; border-radius: 4px; padding: 0.1em 0.4em; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.875em; color: #7c3aed; }
pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; overflow-x: auto; }
pre code { background: none; padding: 0; color: inherit; }
blockquote { border-left: 4px solid #e5e7eb; margin: 1em 0; padding: 0.5em 1em; color: #6b7280; }
ul, ol { padding-left: 1.5em; margin: 0.8em 0; }
li { margin: 0.3em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #e5e7eb; padding: 0.5em 1em; text-align: left; }
th { background: #f9fafb; font-weight: 600; }
img { max-width: 100%; height: auto; border-radius: 6px; }
hr { border: none; border-top: 2px solid #e5e7eb; margin: 2em 0; }
strong { color: #111; }
`

function buildStandaloneHtml(innerHTML, title) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || 'Export'}</title>
<style>${HTML_EXPORT_CSS}</style>
</head>
<body>
<article>
${innerHTML}
</article>
</body>
</html>`
}

export default function Preview({ source, filePath, frontmatter, readOnly, zoom, zenMode }) {
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

  const effectiveZoom = zenMode ? Math.max(zoom ?? 1.0, 1.1) : (zoom ?? 1.0)
  const proseStyle = effectiveZoom !== 1.0 ? { fontSize: `calc(15px * ${effectiveZoom})` } : {}

  const getDocTitle = () =>
    frontmatter?.title || filePath?.split(/[\\/]/).pop()?.replace(/\.(mxt|md)$/, '') || 'export'

  const handleExportHtml = async () => {
    const prose = containerRef.current?.querySelector('.prose')
    if (!prose) return
    const title = getDocTitle()
    await window.electron.exportHtml({ html: buildStandaloneHtml(prose.innerHTML, title), title })
  }

  const handleCopyHtml = async () => {
    const prose = containerRef.current?.querySelector('.prose')
    if (!prose) return
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([prose.innerHTML], { type: 'text/html' }) })
      ])
    } catch {
      await navigator.clipboard.writeText(prose.innerHTML)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {!zenMode && (
        <div style={{
          padding: '6px 16px', background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        }}>
          {!readOnly && (
            <>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Aperçu</span>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            <ToolbarBtn onClick={handleCopyHtml} title="Copier en HTML (pour Word, email…)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copier HTML
            </ToolbarBtn>
            <ToolbarBtn onClick={handleExportHtml} title="Exporter en fichier HTML standalone">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export HTML
            </ToolbarBtn>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto', position: 'relative',
        padding: zenMode ? '5rem 8rem' : readOnly ? '4rem 5rem' : '2.5rem 3rem',
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

function ToolbarBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '4px' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {children}
    </button>
  )
}

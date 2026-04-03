import { useState } from 'react'

export function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(String(children).trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      margin: '1.5rem 0',
      borderRadius: '10px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      background: 'var(--bg-secondary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>
          {language && (
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontWeight: '500',
              textTransform: 'lowercase'
            }}>
              {language}
            </span>
          )}
        </div>
        <button
          onClick={copy}
          style={{
            background: copied ? 'var(--accent-soft)' : 'transparent',
            border: '1px solid',
            borderColor: copied ? 'var(--accent)' : 'var(--border)',
            borderRadius: '5px',
            color: copied ? 'var(--accent-hover)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '3px 10px',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copié
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copier
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre style={{
        margin: 0,
        padding: '1.25rem 1.5rem',
        overflowX: 'auto',
        fontSize: '13px',
        lineHeight: '1.7',
        fontFamily: 'var(--font-mono)',
        borderRadius: '0 0 10px 10px'
      }}>
        <code style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}>
          {String(children).trim()}
        </code>
      </pre>
    </div>
  )
}

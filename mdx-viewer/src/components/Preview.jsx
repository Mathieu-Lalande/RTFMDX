import { useState, useEffect } from 'react'
import * as runtime from 'react/jsx-runtime'
import { Callout } from './mdx/Callout.jsx'
import { Steps } from './mdx/Steps.jsx'
import { CodeBlock } from './mdx/CodeBlock.jsx'
import { Badge } from './mdx/Badge.jsx'
import { Card, CardGrid } from './mdx/Card.jsx'
import { Tabs, Tab } from './mdx/Tabs.jsx'

const COMPONENTS = {
  Callout,
  Steps,
  CodeBlock,
  Badge,
  Card,
  CardGrid,
  Tabs,
  Tab,
  pre: ({ children }) => <div>{children}</div>,
  code: ({ className, children }) => {
    const lang = className?.replace('language-', '') || ''
    if (lang) return <CodeBlock language={lang}>{String(children)}</CodeBlock>
    return <code className={className}>{children}</code>
  }
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export default function Preview({ source }) {
  const debouncedSource = useDebounce(source, 400)
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      // Compile MDX dans le processus principal (Node.js) via IPC
      const result = await window.electron.compileMdx(debouncedSource)

      if (cancelled) return

      if (!result.ok) {
        setError(result.error)
        return
      }

      try {
        // Exécute le code compilé dans le renderer avec les composants React
        // Le code compilé attend un objet { jsx, jsxs, Fragment } en premier argument
        // eslint-disable-next-line no-new-func
        const fn = new Function(result.code)
        const { default: MDXContent } = fn(runtime)
        setContent(<MDXContent components={COMPONENTS} />)
        setError(null)
      } catch (e) {
        setError(e.message)
      }
    }

    render()
    return () => { cancelled = true }
  }, [debouncedSource])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      {/* En-tête */}
      <div style={{
        padding: '6px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Aperçu
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 4rem' }}>
        {error ? (
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius)',
            color: '#f87171',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: 1.6
          }}>
            <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.5rem' }}>Erreur MDX</strong>
            {error}
          </div>
        ) : (
          <div className="prose">
            {content}
          </div>
        )}
      </div>
    </div>
  )
}

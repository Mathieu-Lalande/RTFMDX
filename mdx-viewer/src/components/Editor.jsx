import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

const mdxThemeDark = createTheme({
  theme: 'dark',
  settings: {
    background: '#0f1117',
    foreground: '#e8eaf0',
    caret: '#6366f1',
    selection: 'rgba(99, 102, 241, 0.2)',
    selectionMatch: 'rgba(99, 102, 241, 0.1)',
    lineHighlight: 'rgba(255, 255, 255, 0.025)',
    gutterBackground: '#0f1117',
    gutterForeground: '#2a3347',
    gutterActiveForeground: '#4a5568',
    gutterBorder: 'transparent',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  styles: [
    { tag: t.heading1, color: '#e8eaf0', fontWeight: '700', fontSize: '1.3em' },
    { tag: t.heading2, color: '#c7d0e0', fontWeight: '600', fontSize: '1.15em' },
    { tag: t.heading3, color: '#a8b5cc', fontWeight: '600' },
    { tag: t.heading4, color: '#8892a4' },
    { tag: t.strong, color: '#e8eaf0', fontWeight: '700' },
    { tag: t.emphasis, color: '#818cf8', fontStyle: 'italic' },
    { tag: t.strikethrough, color: '#4a5568' },
    { tag: t.link, color: '#818cf8' },
    { tag: t.url, color: '#6366f1' },
    { tag: t.quote, color: '#8892a4', fontStyle: 'italic' },
    { tag: t.monospace, color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace" },
    { tag: t.comment, color: '#4a5568', fontStyle: 'italic' },
    { tag: t.keyword, color: '#818cf8' },
    { tag: t.string, color: '#6ee7b7' },
    { tag: t.number, color: '#fbbf24' },
    { tag: t.operator, color: '#f472b6' },
    { tag: t.punctuation, color: '#4a5568' },
    { tag: t.tagName, color: '#f472b6' },
    { tag: t.attributeName, color: '#818cf8' },
    { tag: t.attributeValue, color: '#6ee7b7' },
    { tag: t.content, color: '#d1d5e0' },
    { tag: t.processingInstruction, color: '#4a5568' },
    { tag: t.definition(t.variableName), color: '#818cf8' },
  ]
})

const mdxThemeLight = createTheme({
  theme: 'light',
  settings: {
    background: '#fafafa',
    foreground: '#111827',
    caret: '#6366f1',
    selection: 'rgba(99, 102, 241, 0.15)',
    selectionMatch: 'rgba(99, 102, 241, 0.08)',
    lineHighlight: 'rgba(0, 0, 0, 0.04)',
    gutterBackground: '#fafafa',
    gutterForeground: '#d1d5de',
    gutterActiveForeground: '#9ca3af',
    gutterBorder: 'transparent',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  styles: [
    { tag: t.heading1, color: '#111827', fontWeight: '700', fontSize: '1.3em' },
    { tag: t.heading2, color: '#1f2937', fontWeight: '600', fontSize: '1.15em' },
    { tag: t.heading3, color: '#374151', fontWeight: '600' },
    { tag: t.heading4, color: '#6b7280' },
    { tag: t.strong, color: '#111827', fontWeight: '700' },
    { tag: t.emphasis, color: '#6366f1', fontStyle: 'italic' },
    { tag: t.strikethrough, color: '#9ca3af' },
    { tag: t.link, color: '#6366f1' },
    { tag: t.url, color: '#4f46e5' },
    { tag: t.quote, color: '#6b7280', fontStyle: 'italic' },
    { tag: t.monospace, color: '#7c3aed', fontFamily: "'JetBrains Mono', monospace" },
    { tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },
    { tag: t.keyword, color: '#6366f1' },
    { tag: t.string, color: '#059669' },
    { tag: t.number, color: '#d97706' },
    { tag: t.operator, color: '#db2777' },
    { tag: t.punctuation, color: '#9ca3af' },
    { tag: t.tagName, color: '#db2777' },
    { tag: t.attributeName, color: '#6366f1' },
    { tag: t.attributeValue, color: '#059669' },
    { tag: t.content, color: '#374151' },
    { tag: t.processingInstruction, color: '#9ca3af' },
    { tag: t.definition(t.variableName), color: '#6366f1' },
  ]
})

const baseExtensions = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  EditorView.lineWrapping,
  EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
    },
    '.cm-scroller': {
      padding: '1.5rem 0',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
    '.cm-content': {
      padding: '0 2rem',
      maxWidth: '680px',
      margin: '0 auto',
    },
    '.cm-gutters': {
      minWidth: '48px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      paddingRight: '12px',
      fontSize: '12px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(128, 128, 128, 0.06) !important',
    },
    '.cm-cursor': {
      borderLeftColor: '#6366f1',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(99, 102, 241, 0.2) !important',
    },
  })
]

export default function Editor({ value, onChange, isReadOnly, theme, onOpenSearchReplace }) {
  const isDark = theme !== 'light'
  const bgColor = isDark ? '#0f1117' : '#fafafa'
  const editorTheme = isDark ? mdxThemeDark : mdxThemeLight

  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: bgColor
    }}>
      <div style={{
        padding: '6px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isReadOnly ? 'var(--yellow)' : 'var(--accent)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Éditeur{isReadOnly ? ' — Lecture seule' : ''}
        </span>
        {isReadOnly && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2" style={{ marginLeft: '2px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        )}
        {!isReadOnly && onOpenSearchReplace && (
          <button onClick={onOpenSearchReplace} title="Rechercher & Remplacer" style={{
            marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="3" y1="16" x2="8" y2="16"/><line x1="3" y1="20" x2="10" y2="20"/>
            </svg>
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CodeMirror
          value={value}
          height="100%"
          extensions={baseExtensions}
          theme={editorTheme}
          onChange={isReadOnly ? undefined : onChange}
          readOnly={isReadOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
          }}
        />
      </div>
    </div>
  )
}

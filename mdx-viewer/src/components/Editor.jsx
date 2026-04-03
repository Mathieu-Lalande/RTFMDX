import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

const mdxTheme = createTheme({
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

const editorExtensions = [
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
      backgroundColor: 'rgba(255, 255, 255, 0.025) !important',
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

export default function Editor({ value, onChange }) {
  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f1117'
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
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Éditeur
        </span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CodeMirror
          value={value}
          height="100%"
          extensions={editorExtensions}
          theme={mdxTheme}
          onChange={onChange}
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

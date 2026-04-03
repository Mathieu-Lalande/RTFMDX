import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, keymap } from '@codemirror/view'
import { autocompletion, startCompletion } from '@codemirror/autocomplete'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'
import { useRef } from 'react'

// ─── Thèmes ──────────────────────────────────────────────────────────────────
const mxtThemeDark = createTheme({
  theme: 'dark',
  settings: {
    background: '#0f1117', foreground: '#e8eaf0', caret: '#6366f1',
    selection: 'rgba(99, 102, 241, 0.2)', selectionMatch: 'rgba(99, 102, 241, 0.1)',
    lineHighlight: 'rgba(255, 255, 255, 0.025)',
    gutterBackground: '#0f1117', gutterForeground: '#2a3347',
    gutterActiveForeground: '#4a5568', gutterBorder: 'transparent',
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
    { tag: t.link, color: '#818cf8' }, { tag: t.url, color: '#6366f1' },
    { tag: t.quote, color: '#8892a4', fontStyle: 'italic' },
    { tag: t.monospace, color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace" },
    { tag: t.comment, color: '#4a5568', fontStyle: 'italic' },
    { tag: t.keyword, color: '#818cf8' }, { tag: t.string, color: '#6ee7b7' },
    { tag: t.number, color: '#fbbf24' }, { tag: t.operator, color: '#f472b6' },
    { tag: t.punctuation, color: '#4a5568' }, { tag: t.tagName, color: '#f472b6' },
    { tag: t.attributeName, color: '#818cf8' }, { tag: t.attributeValue, color: '#6ee7b7' },
    { tag: t.content, color: '#d1d5e0' },
    { tag: t.processingInstruction, color: '#4a5568' },
    { tag: t.definition(t.variableName), color: '#818cf8' },
  ]
})

const mxtThemeLight = createTheme({
  theme: 'light',
  settings: {
    background: '#fafafa', foreground: '#111827', caret: '#6366f1',
    selection: 'rgba(99, 102, 241, 0.15)', selectionMatch: 'rgba(99, 102, 241, 0.08)',
    lineHighlight: 'rgba(0, 0, 0, 0.04)',
    gutterBackground: '#fafafa', gutterForeground: '#d1d5de',
    gutterActiveForeground: '#9ca3af', gutterBorder: 'transparent',
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
    { tag: t.link, color: '#6366f1' }, { tag: t.url, color: '#4f46e5' },
    { tag: t.quote, color: '#6b7280', fontStyle: 'italic' },
    { tag: t.monospace, color: '#7c3aed', fontFamily: "'JetBrains Mono', monospace" },
    { tag: t.comment, color: '#9ca3af', fontStyle: 'italic' },
    { tag: t.keyword, color: '#6366f1' }, { tag: t.string, color: '#059669' },
    { tag: t.number, color: '#d97706' }, { tag: t.operator, color: '#db2777' },
    { tag: t.punctuation, color: '#9ca3af' }, { tag: t.tagName, color: '#db2777' },
    { tag: t.attributeName, color: '#6366f1' }, { tag: t.attributeValue, color: '#059669' },
    { tag: t.content, color: '#374151' },
    { tag: t.processingInstruction, color: '#9ca3af' },
    { tag: t.definition(t.variableName), color: '#6366f1' },
  ]
})

// ─── Icônes SVG par type de composant ────────────────────────────────────────
const SNIPPET_ICONS = {
  'callout-info': { color: '#60a5fa', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#60a5fa"><circle cx="12" cy="12" r="10"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="700" fill="white" font-family="serif">i</text></svg>' },
  'callout-warning': { color: '#fbbf24', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 2L1 21h22L12 2z"/><text x="12" y="18.5" text-anchor="middle" font-size="11" font-weight="700" fill="#1a1a1a" font-family="sans-serif">!</text></svg>' },
  'callout-error': { color: '#f87171', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#f87171"><circle cx="12" cy="12" r="10"/><path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>' },
  'steps': { color: '#a78bfa', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" font-size="7" fill="#a78bfa" font-family="sans-serif">1</text><text x="3" y="14" font-size="7" fill="#a78bfa" font-family="sans-serif">2</text><text x="3" y="20" font-size="7" fill="#a78bfa" font-family="sans-serif">3</text></svg>' },
  'tabs': { color: '#34d399', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M2 11h20M7 7V4M12 7V4M17 7V4" stroke-linecap="round"/></svg>' },
  'card': { color: '#fb923c', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2"><rect x="2" y="3" width="9" height="9" rx="1"/><rect x="13" y="3" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>' },
  'badge': { color: '#f472b6', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" stroke-linecap="round" stroke-width="3"/></svg>' },
  'code': { color: '#38bdf8', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  'wikilink': { color: '#818cf8', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  'frontmatter': { color: '#94a3b8', svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>' },
}

// ─── Snippets "/" ─────────────────────────────────────────────────────────────
const SLASH_SNIPPETS = [
  { label: '/callout-info',    iconKey: 'callout-info',    displayLabel: 'Callout — Info',         detail: 'Bloc d\'information',            insert: '<Callout type="info" title="Information">\n  \n</Callout>' },
  { label: '/callout-warning', iconKey: 'callout-warning', displayLabel: 'Callout — Avertissement', detail: 'Bloc d\'avertissement',           insert: '<Callout type="warning" title="Attention">\n  \n</Callout>' },
  { label: '/callout-error',   iconKey: 'callout-error',   displayLabel: 'Callout — Erreur',        detail: 'Bloc d\'erreur',                 insert: '<Callout type="error" title="Erreur">\n  \n</Callout>' },
  { label: '/steps',           iconKey: 'steps',           displayLabel: 'Steps',                   detail: 'Étapes numérotées',              insert: '<Steps>\n  - Première étape\n  - Deuxième étape\n  - Troisième étape\n</Steps>' },
  { label: '/tabs',            iconKey: 'tabs',            displayLabel: 'Tabs',                    detail: 'Onglets de contenu',             insert: '<Tabs>\n  <Tab label="Onglet 1">\n    Contenu.\n  </Tab>\n  <Tab label="Onglet 2">\n    Contenu.\n  </Tab>\n</Tabs>' },
  { label: '/card',            iconKey: 'card',            displayLabel: 'CardGrid',                detail: 'Grille de cartes',               insert: '<CardGrid>\n  <Card title="Titre">\n    Description.\n  </Card>\n  <Card title="Deuxième">\n    Description.\n  </Card>\n</CardGrid>' },
  { label: '/badge',           iconKey: 'badge',           displayLabel: 'Badge',                   detail: 'Étiquette inline',               insert: '<Badge variant="primary">Texte</Badge>' },
  { label: '/code',            iconKey: 'code',            displayLabel: 'Bloc de code',            detail: 'Code avec coloration syntaxique', insert: '```js\n\n```' },
  { label: '/wikilink',        iconKey: 'wikilink',        displayLabel: 'Wiki Link',               detail: 'Lien interne [[fichier]]',       insert: '[[]]' },
  { label: '/frontmatter',     iconKey: 'frontmatter',     displayLabel: 'Frontmatter',             detail: 'En-tête YAML',                   insert: `---\ntitle: \ndate: ${new Date().toISOString().slice(0, 10)}\ntags: []\n---\n` },
]

function slashCompletionSource(context) {
  const before = context.matchBefore(/\/\S*/)
  if (!before) return null
  const query = before.text.slice(1).toLowerCase()
  const filtered = query
    ? SLASH_SNIPPETS.filter(s => s.label.slice(1).includes(query) || s.displayLabel.toLowerCase().includes(query))
    : SLASH_SNIPPETS
  if (!filtered.length) return null
  return {
    from: before.from,
    options: filtered.map(s => Object.assign({
      label: s.label,
      displayLabel: s.displayLabel,
      detail: s.detail,
      boost: 99,
      apply(view, _completion, from, to) {
        view.dispatch({ changes: { from, to, insert: s.insert } })
      },
    }, { iconKey: s.iconKey })),  // iconKey accessible dans addToOptions.render
    filter: false,
    validFor: /^\/\S*$/,
  }
}

// Keymap : "/" insère "/" puis déclenche l'autocomplétion immédiatement (désactivé en readonly)
const slashKeymap = keymap.of([{
  key: '/',
  run(view) {
    if (view.state.readOnly) return false
    view.dispatch(view.state.replaceSelection('/'))
    startCompletion(view)
    return true
  },
}])

// ─── Extensions de base ───────────────────────────────────────────────────────
const baseExtensions = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  EditorView.lineWrapping,
  EditorView.theme({
    '&': { height: '100%', fontSize: '14px' },
    '.cm-scroller': { padding: '1.5rem 0', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
    '.cm-content': { padding: '0 2rem', maxWidth: '680px', margin: '0 auto' },
    '.cm-gutters': { minWidth: '48px' },
    '.cm-lineNumbers .cm-gutterElement': { paddingRight: '12px', fontSize: '12px' },
    '.cm-activeLine': { backgroundColor: 'rgba(128, 128, 128, 0.06) !important' },
    '.cm-cursor': { borderLeftColor: '#6366f1', borderLeftWidth: '2px' },
    '.cm-selectionBackground': { backgroundColor: 'rgba(99, 102, 241, 0.2) !important' },
    // Style du dropdown autocomplete
    '.cm-tooltip-autocomplete': {
      background: 'var(--bg-secondary, #1a1f2e)',
      border: '1px solid var(--border, #2a3347)',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontSize: '13px',
      fontFamily: "'JetBrains Mono', monospace",
    },
    '.cm-completionLabel': { color: 'var(--text-primary, #e8eaf0)' },
    '.cm-completionDetail': { color: 'var(--text-muted, #4a5568)', fontStyle: 'normal', marginLeft: '8px' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      background: 'var(--accent-soft, rgba(99,102,241,0.15))',
      color: 'var(--accent-hover, #818cf8)',
    },
  }),
  slashKeymap,
  autocompletion({
    override: [slashCompletionSource],
    defaultKeymap: true,
    addToOptions: [{
      // Injecte l'icône SVG colorée avant le label de chaque snippet
      render(completion) {
        const icon = SNIPPET_ICONS[completion.iconKey]
        if (!icon) return null
        const el = document.createElement('span')
        el.style.cssText = `
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 5px; margin-right: 8px;
          flex-shrink: 0; background: ${icon.color}18;
        `
        el.innerHTML = icon.svg
        return el
      },
      position: 20,
    }],
  }),
]

export default function Editor({ value, onChange, isReadOnly, theme, onEditorCreated }) {
  const isDark = theme !== 'light'
  const bgColor = isDark ? '#0f1117' : '#fafafa'
  const editorTheme = isDark ? mxtThemeDark : mxtThemeLight
  const containerRef = useRef(null)

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: bgColor }}>
      <div style={{
        padding: '6px 16px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
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
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.6 }}>
          Tapez <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '3px', padding: '0 4px', fontFamily: 'inherit' }}>/</kbd> pour insérer un composant
        </span>
      </div>
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto' }}>
        <CodeMirror
          value={value}
          height="100%"
          extensions={baseExtensions}
          theme={editorTheme}
          onChange={isReadOnly ? undefined : onChange}
          readOnly={isReadOnly}
          onCreateEditor={(view) => onEditorCreated?.(view)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            searchKeymap: false,
          }}
        />
      </div>
    </div>
  )
}

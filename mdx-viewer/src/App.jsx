import { useState, useEffect, useCallback, useRef } from 'react'
import { VaultProvider, useVault } from './context/VaultContext.jsx'
import Editor from './components/Editor.jsx'
import Preview from './components/Preview.jsx'
import TitleBar from './components/TitleBar.jsx'
import StatusBar from './components/StatusBar.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import TabBar from './components/TabBar.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import OutlinePanel from './components/OutlinePanel.jsx'
import SearchReplace from './components/SearchReplace.jsx'
import FindBar from './components/FindBar.jsx'

// ─── Panneau Backlinks ───────────────────────────────────────────────────────
function BacklinksPanel({ backlinks, onOpen }) {
  if (!backlinks.length) return null
  return (
    <div style={{
      borderTop: '1px solid var(--border)', padding: '10px 12px',
      background: 'var(--bg-secondary)', flexShrink: 0, maxHeight: '160px', overflowY: 'auto',
    }}>
      <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
        Backlinks ({backlinks.length})
      </div>
      {backlinks.map(b => (
        <div key={b.path} onClick={() => onOpen(b.path)} style={{
          fontSize: '12px', color: 'var(--accent-hover)', cursor: 'pointer',
          padding: '3px 0', display: 'flex', alignItems: 'center', gap: '5px',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-hover)'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          {b.name.replace(/\.(mdx?|md)$/, '')}
        </div>
      ))}
    </div>
  )
}

// ─── Panneau Recherche ───────────────────────────────────────────────────────
function SearchPanel({ open, onClose, onOpen }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (open) { setQuery(''); setResults([]); setTimeout(() => inputRef.current?.focus(), 50) } }, [open])

  const search = useCallback(async (q) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await window.electron.searchVault(q)
    setResults(res)
    setLoading(false)
  }, [])

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '640px', maxWidth: '90vw', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input ref={inputRef} value={query} onChange={e => search(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            placeholder="Rechercher dans tout le vault..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)' }}
          />
        </div>
        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {loading && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Recherche…</div>}
          {!loading && query && !results.length && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Aucun résultat pour "{query}"</div>}
          {results.map((r) => (
            <div key={`${r.path}-${r.line}`} onClick={() => { onOpen(r.path); onClose() }}
              style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-hover)', marginBottom: '3px' }}>
                {r.name.replace(/\.(mdx?|md)$/, '')} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>ligne {r.line}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.snippet}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── App principale ──────────────────────────────────────────────────────────
function AppContent() {
  const {
    activeTab, activeTabPath, tabs, vaultPath, vaultFiles,
    updateTabContent, markTabSaved, openFileByPath, openVaultFromPath,
    canBack, canForward, navigateBack, navigateForward,
    backlinks, openBuiltinExample,
  } = useVault()

  const [mode, setMode] = useState('read')
  const [saveStatus, setSaveStatus] = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [panelWidth, setPanelWidth] = useState(50)
  const [isSidebarResizing, setIsSidebarResizing] = useState(false)
  const [isPanelResizing, setIsPanelResizing] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const containerRef = useRef(null)

  // ── New state ──────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1.0)
  const [theme, setTheme] = useState('dark')
  const [autoSaveDelay, setAutoSaveDelay] = useState(3000)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [searchReplaceOpen, setSearchReplaceOpen] = useState(false)
  const [findBarOpen, setFindBarOpen] = useState(false)
  const [updateBanner, setUpdateBanner] = useState(null) // null | 'available' | 'downloaded'
  const autoSaveTimerRef = useRef(null)
  const configLoadedRef = useRef(false)

  // Load config on startup
  useEffect(() => {
    window.electron.getConfig().then(cfg => {
      if (cfg.zoom !== undefined) setZoom(cfg.zoom)
      if (cfg.theme) setTheme(cfg.theme)
      if (cfg.autoSave !== undefined) setAutoSaveDelay(cfg.autoSave)
    }).catch(() => {})
    configLoadedRef.current = true
  }, [])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Persist zoom/theme changes (skip initial mount)
  const persistConfigRef = useRef(false)
  useEffect(() => {
    if (!persistConfigRef.current) { persistConfigRef.current = true; return }
    window.electron.saveConfig({ zoom, theme, autoSave: autoSaveDelay }).catch(() => {})
  }, [zoom, theme, autoSaveDelay])

  // Auto-update events
  useEffect(() => {
    window.electron.onUpdateAvailable(() => setUpdateBanner('available'))
    window.electron.onUpdateDownloaded(() => setUpdateBanner('downloaded'))
  }, [])

  const source = activeTab?.content ?? ''
  const frontmatter = activeTab?.frontmatter ?? {}
  const wordCount = source.trim() ? source.trim().split(/\s+/).length : 0

  // Sauvegarde
  const save = useCallback(async () => {
    if (!activeTab) return
    if (activeTab.isReadOnly) return
    if (activeTab.path?.startsWith('__builtin__')) return
    if (!activeTab.path) {
      const r = await window.electron.saveFileAs({ content: source, dir: vaultPath })
      if (r.ok) { markTabSaved(r.path); setSaveStatus('saved'); setTimeout(() => setSaveStatus(null), 2000) }
      return
    }
    setSaveStatus('saving')
    const r = await window.electron.saveFile({ path: activeTab.path, content: source })
    if (r.ok) { markTabSaved(activeTab.path); setSaveStatus('saved'); setTimeout(() => setSaveStatus(null), 2000) }
    else { setSaveStatus('error'); setTimeout(() => setSaveStatus(null), 3000) }
  }, [activeTab, source, vaultPath, markTabSaved])

  const openFile = useCallback(async () => {
    const r = await window.electron.openFile()
    if (r.ok) openFileByPath(r.path)
  }, [openFileByPath])

  // Auto-save
  useEffect(() => {
    if (!activeTab?.isDirty || activeTab?.isReadOnly || !autoSaveDelay) return
    clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      save()
    }, autoSaveDelay)
    return () => clearTimeout(autoSaveTimerRef.current)
  }, [activeTab?.isDirty, activeTab?.isReadOnly, source, autoSaveDelay, save])

  // Zoom handlers
  const zoomIn = useCallback(() => setZoom(z => Math.min(1.5, parseFloat((z + 0.1).toFixed(1)))))
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.7, parseFloat((z - 0.1).toFixed(1)))))
  const zoomReset = useCallback(() => setZoom(1.0))

  // Theme toggle
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'))

  // Print
  const handlePrint = useCallback(() => window.print())

  // Heading click in outline
  const handleHeadingClick = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Raccourcis clavier
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); openFile() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); setMode(m => m === 'read' ? 'split' : m === 'split' ? 'edit' : 'read') }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setPaletteOpen(p => !p) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); setSearchOpen(p => !p) }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); navigateBack() }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); navigateForward() }
      // Zoom
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) { e.preventDefault(); zoomIn() }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); zoomOut() }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); zoomReset() }
      // Outline: Ctrl+Shift+O
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') { e.preventDefault(); setOutlineOpen(o => !o) }
      // Find in page: Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setFindBarOpen(o => !o) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [save, openFile, navigateBack, navigateForward, zoomIn, zoomOut, zoomReset])

  // Palette : actions
  const handlePaletteAction = useCallback((id, extra) => {
    if (id === 'mode-read') setMode('read')
    else if (id === 'mode-split') setMode('split')
    else if (id === 'mode-edit') setMode('edit')
    else if (id === 'save') save()
    else if (id === 'open-vault') {} // géré par Sidebar
    else if (id === 'open-builtin-example') openBuiltinExample()
    else if (id === 'reload-file' && extra) {
      updateTabContent(extra.path, extra.content)
    }
  }, [save, updateTabContent, openBuiltinExample])

  // Drag & drop to open vault or file
  const handleDragOver = useCallback((e) => { e.preventDefault() }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const filePath = file.path
    if (!filePath) return
    // Check if directory or file via extension
    if (!/\.(mdx?|md)$/i.test(filePath)) {
      // Assume it's a directory
      openVaultFromPath(filePath)
    } else {
      openFileByPath(filePath)
    }
  }, [openVaultFromPath, openFileByPath])

  // Resize sidebar
  const startSidebarResize = useCallback((e) => {
    e.preventDefault(); setIsSidebarResizing(true)
    const startX = e.clientX, startW = sidebarWidth
    const onMove = (e) => setSidebarWidth(Math.min(480, Math.max(160, startW + e.clientX - startX)))
    const onUp = () => { setIsSidebarResizing(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  // Resize panneau split
  const startPanelResize = useCallback((e) => {
    e.preventDefault(); setIsPanelResizing(true)
    const container = containerRef.current
    const startX = e.clientX, startW = panelWidth
    const onMove = (e) => {
      const totalW = container.offsetWidth - sidebarWidth
      setPanelWidth(Math.min(80, Math.max(20, startW + ((e.clientX - startX) / totalW) * 100)))
    }
    const onUp = () => { setIsPanelResizing(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [panelWidth, sidebarWidth])

  const isEditorVisible = mode === 'split' || mode === 'edit'

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', cursor: (isSidebarResizing || isPanelResizing) ? 'col-resize' : 'default' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <TitleBar
        className="no-print"
        fileName={activeTab?.frontmatter?.title || activeTab?.name || 'Aucun fichier'}
        isDirty={activeTab?.isDirty ?? false}
        onSave={save} onOpen={openFile}
        saveStatus={saveStatus} mode={mode} onModeChange={setMode}
        canBack={canBack} canForward={canForward}
        onBack={navigateBack} onForward={navigateForward}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        theme={theme} onToggleTheme={toggleTheme}
        onPrint={handlePrint}
        outlineOpen={outlineOpen} onToggleOutline={() => setOutlineOpen(o => !o)}
      />

      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', width: sidebarWidth, flexShrink: 0, position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          <Sidebar activeFilePath={activeTabPath} width={sidebarWidth} onResizeStart={startSidebarResize} />
          <BacklinksPanel backlinks={backlinks} onOpen={openFileByPath} />
        </div>

        {/* Zone principale */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div className="no-print">
            <TabBar />
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Éditeur */}
            {isEditorVisible && (
              <div style={{ width: mode === 'edit' ? '100%' : `${panelWidth}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <Editor
                  value={source}
                  onChange={val => {
                    if (activeTab && !activeTab.isReadOnly) updateTabContent(activeTab.path, val)
                  }}
                  vaultFiles={vaultFiles}
                  isReadOnly={activeTab?.isReadOnly ?? false}
                  theme={theme}
                  onOpenSearchReplace={() => setSearchReplaceOpen(o => !o)}
                />
                {/* Search & Replace */}
                {searchReplaceOpen && (
                  <SearchReplace
                    value={source}
                    onChange={val => activeTab && !activeTab.isReadOnly && updateTabContent(activeTab.path, val)}
                    onClose={() => setSearchReplaceOpen(false)}
                  />
                )}
              </div>
            )}

            {/* Diviseur */}
            {mode === 'split' && (
              <div onMouseDown={startPanelResize} style={{ width: '4px', background: isPanelResizing ? 'var(--accent)' : 'var(--border)', cursor: 'col-resize', flexShrink: 0, transition: isPanelResizing ? 'none' : 'background 0.2s' }}
                onMouseEnter={e => !isPanelResizing && (e.target.style.background = 'var(--accent)')}
                onMouseLeave={e => !isPanelResizing && (e.target.style.background = 'var(--border)')}
              />
            )}

            {/* Aperçu */}
            {activeTab && (mode === 'read' || mode === 'split') && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Preview
                  source={source}
                  filePath={activeTabPath}
                  frontmatter={frontmatter}
                  readOnly={mode === 'read'}
                  zoom={zoom}
                />
              </div>
            )}

            {/* Placeholder sans fichier */}
            {!activeTab && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.2 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p style={{ fontSize: '13px', opacity: 0.5 }}>Ouvrez un fichier depuis la sidebar</p>
                <p style={{ fontSize: '11px', opacity: 0.3 }}>ou Ctrl+P pour la palette de commandes</p>
              </div>
            )}

            {/* Outline panel (right sidebar) */}
            <OutlinePanel
              source={source}
              onHeadingClick={handleHeadingClick}
              open={outlineOpen}
              onClose={() => setOutlineOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Update banner */}
      {updateBanner && (
        <div style={{
          padding: '8px 16px',
          background: updateBanner === 'downloaded' ? 'var(--accent-soft)' : 'rgba(16,185,129,0.1)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '12px',
          fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0,
        }} className="no-print">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
          <span style={{ flex: 1 }}>
            {updateBanner === 'downloaded'
              ? 'Mise à jour téléchargée — Redémarrez pour installer'
              : 'Mise à jour disponible — Téléchargement en cours…'}
          </span>
          {updateBanner === 'downloaded' && (
            <button
              onClick={() => window.electron.installUpdate()}
              style={{
                padding: '3px 10px', background: 'var(--accent)', border: 'none',
                borderRadius: '5px', color: 'white', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Redémarrer
            </button>
          )}
          <button onClick={() => setUpdateBanner(null)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '2px 4px', borderRadius: '3px',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
            </svg>
          </button>
        </div>
      )}

      <div className="no-print">
        <StatusBar
          filePath={activeTabPath}
          wordCount={wordCount}
          charCount={source.length}
          saveStatus={saveStatus}
          mode={mode}
          tabCount={tabs.length}
          zoom={zoom}
          autoSaveDelay={autoSaveDelay}
          isReadOnly={activeTab?.isReadOnly ?? false}
        />
      </div>

      {/* Palette de commandes */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={handlePaletteAction}
        mode={mode}
      />

      {/* Recherche full-text vault */}
      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpen={openFileByPath}
      />

      {/* Find in page (Ctrl+F natif) */}
      <FindBar open={findBarOpen} onClose={() => setFindBarOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  )
}

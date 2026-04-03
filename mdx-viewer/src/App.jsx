import { useState, useEffect, useCallback, useRef } from 'react'
import Editor from './components/Editor.jsx'
import Preview from './components/Preview.jsx'
import TitleBar from './components/TitleBar.jsx'
import StatusBar from './components/StatusBar.jsx'


export default function App() {
  const [source, setSource] = useState('')
  const [filePath, setFilePath] = useState(null)
  const [fileName, setFileName] = useState('Nouveau fichier')
  const [isDirty, setIsDirty] = useState(false)
  const [mode, setMode] = useState('read')
  const [sidebarWidth, setSidebarWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const containerRef = useRef(null)

  // Charge le fichier initial
  useEffect(() => {
    window.electron.getFile().then(({ path, content, name }) => {
      setFilePath(path)
      setFileName(name)
      setSource(content)
    })

    // Reçoit un fichier envoyé depuis une seconde instance (double-clic Windows)
    window.electron.onOpenFile(({ path, name, content }) => {
      setFilePath(path)
      setFileName(name)
      setSource(content)
      setIsDirty(false)
      setMode('read')
    })
  }, [])

  // Compte les mots
  useEffect(() => {
    const words = source.trim() ? source.trim().split(/\s+/).length : 0
    setWordCount(words)
  }, [source])

  const handleChange = useCallback((val) => {
    setSource(val)
    setIsDirty(true)
  }, [])

  // Sauvegarde
  const save = useCallback(async () => {
    if (!filePath) {
      const result = await window.electron.saveFileAs({ content: source })
      if (result.ok) {
        setFilePath(result.path)
        setFileName(result.name)
        setIsDirty(false)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 2000)
      }
      return
    }
    setSaveStatus('saving')
    const result = await window.electron.saveFile({ path: filePath, content: source })
    if (result.ok) {
      setIsDirty(false)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } else {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }, [filePath, source])

  // Ouvrir un fichier
  const openFile = useCallback(async () => {
    const result = await window.electron.openFile()
    if (result.ok) {
      setFilePath(result.path)
      setFileName(result.name)
      setSource(result.content)
      setIsDirty(false)
      setMode('read')
    }
  }, [])

  // Raccourcis clavier
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); openFile() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        setMode(m => m === 'read' ? 'split' : m === 'split' ? 'edit' : 'read')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [save, openFile])

  // Resize du panneau split
  const startResize = useCallback((e) => {
    e.preventDefault()
    setIsResizing(true)
    const container = containerRef.current
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (e) => {
      const dx = e.clientX - startX
      const totalWidth = container.offsetWidth
      const newPct = Math.min(80, Math.max(20, startWidth + (dx / totalWidth) * 100))
      setSidebarWidth(newPct)
    }
    const onUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TitleBar
        fileName={fileName}
        isDirty={isDirty}
        onSave={save}
        onOpen={openFile}
        saveStatus={saveStatus}
        mode={mode}
        onModeChange={setMode}
      />

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          cursor: isResizing ? 'col-resize' : 'default'
        }}
      >
        {/* Éditeur — visible en mode split et edit */}
        {(mode === 'split' || mode === 'edit') && (
          <div style={{
            width: mode === 'edit' ? '100%' : `${sidebarWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Editor value={source} onChange={handleChange} />
          </div>
        )}

        {/* Diviseur — visible uniquement en mode split */}
        {mode === 'split' && (
          <div
            onMouseDown={startResize}
            style={{
              width: '4px',
              background: isResizing ? 'var(--accent)' : 'var(--border)',
              cursor: 'col-resize',
              flexShrink: 0,
              transition: isResizing ? 'none' : 'background 0.2s',
              zIndex: 10
            }}
            onMouseEnter={e => !isResizing && (e.target.style.background = 'var(--accent)')}
            onMouseLeave={e => !isResizing && (e.target.style.background = 'var(--border)')}
          />
        )}

        {/* Aperçu — visible en mode read et split */}
        {(mode === 'read' || mode === 'split') && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Preview source={source} readOnly={mode === 'read'} />
          </div>
        )}
      </div>

      <StatusBar
        filePath={filePath}
        wordCount={wordCount}
        charCount={source.length}
        saveStatus={saveStatus}
        mode={mode}
      />
    </div>
  )
}

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { parseFrontmatter, extractTags } from '../utils/markdown.js'

const VaultContext = createContext(null)

// ─── CLI flags ────────────────────────────────────────────────────────────
const cliReadOnly = typeof process !== 'undefined' && process.argv?.includes('--readonly')

export function VaultProvider({ children }) {
  const [vaultPath, setVaultPath] = useState(null)
  const [vaultName, setVaultName] = useState(null)
  const [tree, setTree] = useState([])
  const [vaultFiles, setVaultFiles] = useState([])
  const [vaultConfig, setVaultConfig] = useState({}) // vault-level config

  // ─── Onglets ─────────────────────────────────────────────────────────────
  // tab: { path, name, content, isDirty, frontmatter, isReadOnly }
  const [tabs, setTabs] = useState([])
  const [activeTabPath, setActiveTabPath] = useState(null)

  // ─── Historique ──────────────────────────────────────────────────────────
  const historyRef = useRef([])   // tableau de paths
  const histIdxRef = useRef(-1)
  const [canBack, setCanBack] = useState(false)
  const [canForward, setCanForward] = useState(false)

  const updateNavState = useCallback(() => {
    setCanBack(histIdxRef.current > 0)
    setCanForward(histIdxRef.current < historyRef.current.length - 1)
  }, [])

  // ─── Backlinks ───────────────────────────────────────────────────────────
  const [backlinks, setBacklinks] = useState([]) // [{ path, name }]

  // ─── Tags ────────────────────────────────────────────────────────────────
  const [allTags, setAllTags] = useState({}) // { tagName: [{ path, name }] }

  // ─── Panneau secondaire (split multi-fichiers) ───────────────────────────
  const [secondaryPath, setSecondaryPath] = useState(null)
  const [secondaryContent, setSecondaryContent] = useState(null)
  const [secondaryFrontmatter, setSecondaryFrontmatter] = useState({})

  const openSecondaryPanel = useCallback(async (filePath) => {
    if (!filePath) { setSecondaryPath(null); setSecondaryContent(null); setSecondaryFrontmatter({}); return }
    let result = await window.electron.readVaultFile(filePath)
    if (!result.ok) result = await window.electron.readFile(filePath)
    if (result.ok) {
      const { frontmatter } = parseFrontmatter(result.content)
      setSecondaryPath(filePath)
      setSecondaryContent(result.content)
      setSecondaryFrontmatter(frontmatter)
    }
  }, [])

  const closeSecondaryPanel = useCallback(() => {
    setSecondaryPath(null)
    setSecondaryContent(null)
    setSecondaryFrontmatter({})
  }, [])

  // ─── Favoris ─────────────────────────────────────────────────────────────
  const [favorites, setFavorites] = useState([]) // [path, ...]

  const toggleFavorite = useCallback((filePath) => {
    setFavorites(prev => {
      const next = prev.includes(filePath) ? prev.filter(p => p !== filePath) : [...prev, filePath]
      window.electron.saveConfig({ favorites: next }).catch(console.error)
      return next
    })
  }, [])

  // ─── Recent files ────────────────────────────────────────────────────────
  const [recentFiles, setRecentFiles] = useState([]) // [{ path, name, openedAt }]

  const addRecentFile = useCallback((filePath, fileName) => {
    if (!filePath || filePath.startsWith('__builtin__')) return
    setRecentFiles(prev => {
      const filtered = prev.filter(r => r.path !== filePath)
      const updated = [{ path: filePath, name: fileName, openedAt: new Date().toISOString() }, ...filtered].slice(0, 10)
      // persist
      window.electron.saveConfig({ recentFiles: updated }).catch(err => console.error('[config] Échec de la sauvegarde des fichiers récents:', err))
      return updated
    })
  }, [])

  // ─── Chargement au démarrage ─────────────────────────────────────────────
  useEffect(() => {
    window.electron.getVault().then((result) => {
      if (result.ok) {
        setVaultPath(result.vaultPath)
        setVaultName(result.vaultPath.split(/[\\/]/).pop())
        setTree(result.tree)
        refreshVaultFiles()
      }
    })

    // Load config (recent files, favorites, etc.)
    window.electron.getConfig().then(cfg => {
      if (cfg.recentFiles) setRecentFiles(cfg.recentFiles)
      if (cfg.favorites) setFavorites(cfg.favorites)
    }).catch(err => console.error('[config] Échec du chargement de la config:', err))

    window.electron.onVaultChanged((newTree) => {
      setTree(newTree)
      window.electron.getVaultFiles().then(files => {
        setVaultFiles(files)
        rebuildTags(files)
      })
    })

    window.electron.onOpenFile(({ path, name, content }) => {
      openTab({ path, name, content })
    })
  }, [])

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const refreshVaultFiles = useCallback(async () => {
    const files = await window.electron.getVaultFiles()
    setVaultFiles(files)
    rebuildTags(files)
  }, [])

  async function rebuildTags(files) {
    const tagMap = {}
    for (const f of files) {
      const result = await window.electron.readVaultFile(f.path)
      if (!result.ok) continue
      const tags = extractTags(result.content)
      tags.forEach(tag => {
        if (!tagMap[tag]) tagMap[tag] = []
        tagMap[tag].push({ path: f.path, name: f.name })
      })
    }
    setAllTags(tagMap)
  }

  // ─── Vault ───────────────────────────────────────────────────────────────
  const openVault = useCallback(async () => {
    const result = await window.electron.openVault()
    if (result.ok) {
      setVaultPath(result.vaultPath)
      setVaultName(result.vaultPath.split(/[\\/]/).pop())
      setTree(result.tree)
      setTabs([])
      setActiveTabPath(null)
      historyRef.current = []
      histIdxRef.current = -1
      updateNavState()
      const files = await window.electron.getVaultFiles()
      setVaultFiles(files)
      rebuildTags(files)
    }
  }, [updateNavState])

  const openVaultFromPath = useCallback(async (dirPath) => {
    const result = await window.electron.setVault(dirPath)
    if (result.ok) {
      setVaultPath(result.vaultPath)
      setVaultName(result.vaultPath.split(/[\\/]/).pop())
      setTree(result.tree)
      setTabs([])
      setActiveTabPath(null)
      historyRef.current = []
      histIdxRef.current = -1
      updateNavState()
      const files = await window.electron.getVaultFiles()
      setVaultFiles(files)
      rebuildTags(files)
    }
    return result
  }, [updateNavState])

  // ─── Onglets ─────────────────────────────────────────────────────────────
  const openTab = useCallback(({ path, name, content, isReadOnly: forceReadOnly }) => {
    const { frontmatter } = parseFrontmatter(content)
    const readOnly = forceReadOnly || frontmatter.readonly === 'true' || vaultConfig.readOnly || cliReadOnly || false

    setTabs(prev => {
      const exists = prev.find(t => t.path === path)
      if (exists) return prev.map(t => t.path === path ? { ...t, content, frontmatter, isReadOnly: readOnly } : t)
      return [...prev, { path, name, content, isDirty: false, frontmatter, isReadOnly: readOnly }]
    })
    setActiveTabPath(path)

    // Recent files
    if (path && !path.startsWith('__builtin__')) {
      addRecentFile(path, name)
    }

    // Historique
    const hist = historyRef.current
    const idx = histIdxRef.current
    // Tronque les "forward" si on navigue depuis le milieu
    const newHist = hist.slice(0, idx + 1)
    if (newHist[newHist.length - 1] !== path) {
      newHist.push(path)
    }
    historyRef.current = newHist
    histIdxRef.current = newHist.length - 1
    updateNavState()
  }, [updateNavState, vaultConfig, addRecentFile])

  const closeTab = useCallback((path) => {
    setTabs(prev => {
      const next = prev.filter(t => t.path !== path)
      if (activeTabPath === path) {
        const closed = prev.findIndex(t => t.path === path)
        const newActive = next[Math.min(closed, next.length - 1)]
        setActiveTabPath(newActive?.path ?? null)
      }
      return next
    })
  }, [activeTabPath])

  const setActiveTab = useCallback((path) => {
    setActiveTabPath(path)
    // Historique
    const hist = historyRef.current
    const idx = histIdxRef.current
    const newHist = hist.slice(0, idx + 1)
    if (newHist[newHist.length - 1] !== path) {
      newHist.push(path)
      historyRef.current = newHist
      histIdxRef.current = newHist.length - 1
      updateNavState()
    }
  }, [updateNavState])

  const updateTabContent = useCallback((path, content) => {
    const { frontmatter } = parseFrontmatter(content)
    setTabs(prev => prev.map(t => t.path === path ? { ...t, content, isDirty: true, frontmatter } : t))
  }, [])

  const markTabSaved = useCallback((path) => {
    setTabs(prev => prev.map(t => t.path === path ? { ...t, isDirty: false } : t))
  }, [])

  // ─── Ouverture de fichier ─────────────────────────────────────────────────
  const openFileByPath = useCallback(async (filePath) => {
    const existing = tabs.find(t => t.path === filePath)
    if (existing) { setActiveTab(filePath); return { ok: true } }
    // Essaie d'abord via vault (avec vérification sécurité), sinon lecture directe
    let result = await window.electron.readVaultFile(filePath)
    if (!result.ok) result = await window.electron.readFile(filePath)
    if (result.ok) openTab({ path: result.path, name: result.name, content: result.content })
    return result
  }, [tabs, setActiveTab, openTab])

  const openFileByName = useCallback(async (name) => {
    const resolved = await window.electron.resolveWikiLink(name)
    if (resolved) return openFileByPath(resolved)
    return { ok: false }
  }, [openFileByPath])

  // ─── Fichier intégré ──────────────────────────────────────────────────────
  const openBuiltinExample = useCallback(async () => {
    const BUILTIN_PATH = '__builtin__:exemple'
    const existing = tabs.find(t => t.path === BUILTIN_PATH)
    if (existing) { setActiveTab(BUILTIN_PATH); return }
    const result = await window.electron.getBuiltinExample()
    if (result.ok) {
      openTab({ path: BUILTIN_PATH, name: result.name, content: result.content, isReadOnly: true })
    }
  }, [tabs, setActiveTab, openTab])

  // ─── Duplication de fichier ───────────────────────────────────────────────
  const duplicateFile = useCallback(async (filePath) => {
    const result = await window.electron.duplicateFile(filePath)
    if (result.ok) {
      openTab({ path: result.path, name: result.name, content: result.content })
    }
    return result
  }, [openTab])

  // ─── Historique ──────────────────────────────────────────────────────────
  const navigateBack = useCallback(() => {
    const idx = histIdxRef.current
    if (idx <= 0) return
    histIdxRef.current = idx - 1
    const path = historyRef.current[histIdxRef.current]
    setActiveTabPath(path)
    updateNavState()
    // Charge si pas en onglet
    if (!tabs.find(t => t.path === path)) openFileByPath(path)
  }, [tabs, openFileByPath, updateNavState])

  const navigateForward = useCallback(() => {
    const idx = histIdxRef.current
    if (idx >= historyRef.current.length - 1) return
    histIdxRef.current = idx + 1
    const path = historyRef.current[histIdxRef.current]
    setActiveTabPath(path)
    updateNavState()
    if (!tabs.find(t => t.path === path)) openFileByPath(path)
  }, [tabs, openFileByPath, updateNavState])

  // ─── Backlinks (recalcul quand fichier actif change) ─────────────────────
  useEffect(() => {
    if (!activeTabPath || !vaultFiles.length) { setBacklinks([]); return }
    if (activeTabPath.startsWith('__builtin__')) { setBacklinks([]); return }
    const basename = activeTabPath.split(/[\\/]/).pop().replace(/\.(mxt|md)$/, '')
    const pattern = new RegExp(`\\[\\[${basename}(?:\\|[^\\]]*)?\\]\\]`, 'i')

    async function compute() {
      const links = []
      for (const f of vaultFiles) {
        if (f.path === activeTabPath) continue
        const r = await window.electron.readVaultFile(f.path)
        if (r.ok && pattern.test(r.content)) links.push({ path: f.path, name: f.name })
      }
      setBacklinks(links)
    }
    compute()
  }, [activeTabPath, vaultFiles])

  // ─── CRUD fichiers ────────────────────────────────────────────────────────
  const createFile = useCallback(async (opts) => {
    const result = await window.electron.createFile(opts)
    if (result.ok) openTab({ path: result.path, name: result.name, content: result.content })
    return result
  }, [openTab])

  const createFolder = useCallback((opts) => window.electron.createFolder(opts), [])

  const renameFile = useCallback(async (opts) => {
    const result = await window.electron.renameFile(opts)
    if (result.ok) {
      setTabs(prev => prev.map(t =>
        t.path === opts.oldPath ? { ...t, path: result.newPath, name: result.newName } : t
      ))
      if (activeTabPath === opts.oldPath) setActiveTabPath(result.newPath)
    }
    return result
  }, [activeTabPath])

  const deleteFile = useCallback(async (filePath) => {
    const result = await window.electron.deleteFile(filePath)
    if (result.ok) closeTab(filePath)
    return result
  }, [closeTab])

  const moveFile = useCallback(async (opts) => {
    const result = await window.electron.moveFile(opts)
    if (result.ok) {
      const oldBase = opts.oldPath
      const newBase = result.newPath
      // Met à jour les onglets : fichier direct ou tout le contenu d'un dossier déplacé
      setTabs(prev => prev.map(t => {
        if (t.path === oldBase) return { ...t, path: newBase, name: result.name }
        const sep = t.path.includes('\\') ? '\\' : '/'
        if (t.path.startsWith(oldBase + sep)) {
          return { ...t, path: newBase + t.path.slice(oldBase.length) }
        }
        return t
      }))
      setActiveTabPath(prev => {
        if (!prev) return prev
        if (prev === oldBase) return newBase
        const sep = prev.includes('\\') ? '\\' : '/'
        if (prev.startsWith(oldBase + sep)) return newBase + prev.slice(oldBase.length)
        return prev
      })
    }
    return result
  }, [])

  const deleteFolder = useCallback(async (folderPath) => {
    const result = await window.electron.deleteFolder(folderPath)
    if (result.ok) {
      setTabs(prev => {
        const remaining = prev.filter(t => !t.path.startsWith(folderPath))
        if (!remaining.find(t => t.path === activeTabPath)) setActiveTabPath(remaining[0]?.path ?? null)
        return remaining
      })
    }
    return result
  }, [activeTabPath])

  // ─── Tab courant ──────────────────────────────────────────────────────────
  const activeTab = tabs.find(t => t.path === activeTabPath) ?? null

  return (
    <VaultContext.Provider value={{
      // vault
      vaultPath, vaultName, tree, vaultFiles, vaultConfig, openVault, openVaultFromPath,
      // onglets
      tabs, activeTab, activeTabPath, openTab, closeTab, setActiveTab,
      updateTabContent, markTabSaved,
      // navigation
      openFileByPath, openFileByName,
      canBack, canForward, navigateBack, navigateForward,
      // backlinks
      backlinks,
      // tags
      allTags,
      // panneau secondaire
      secondaryPath, secondaryContent, secondaryFrontmatter,
      openSecondaryPanel, closeSecondaryPanel,
      // favoris
      favorites, toggleFavorite,
      // recent files
      recentFiles,
      // CRUD
      createFile, createFolder, renameFile, moveFile, deleteFile, deleteFolder,
      duplicateFile,
      // builtin
      openBuiltinExample,
      // utils
      parseFrontmatter,
    }}>
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault must be used inside VaultProvider')
  return ctx
}

const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron')
const fs = require('fs')
const path = require('path')
const gitManager = require('./git-manager')

// Auto-updater (fails silently if not packaged or no network)
let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater
} catch {}

// Protocole vault:// enregistré dans createWindow via protocol.registerFileProtocol

// ─── Config persistence ────────────────────────────────────────────────────
const configPath = () => path.join(app.getPath('userData'), 'config.json')
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath(), 'utf-8')) } catch { return {} }
}
function saveConfig(data) {
  try { fs.writeFileSync(configPath(), JSON.stringify(data, null, 2)) } catch {}
}

// ─── Vault state ───────────────────────────────────────────────────────────
let vaultPath = null
let vaultWatcher = null

// Validates that a path is strictly inside the vault (prevents path traversal)
function assertInsideVault(filePath) {
  if (!vaultPath) throw new Error('Aucun vault ouvert')
  const resolved = path.resolve(filePath)
  const vaultResolved = path.resolve(vaultPath)
  if (resolved !== vaultResolved && !resolved.startsWith(vaultResolved + path.sep)) {
    throw new Error('Accès refusé : chemin hors du vault')
  }
  return resolved
}

function getVaultTree(dir) {
  const IGNORE = new Set(['node_modules', '.git', '.vite', 'dist', 'dist-electron'])
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.') && !IGNORE.has(e.name))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  return entries.map(e => {
    const fullPath = path.join(dir, e.name)
    if (e.isDirectory()) {
      return { type: 'dir', name: e.name, path: fullPath, children: getVaultTree(fullPath) }
    }
    if (/\.(md|mxt)$/i.test(e.name)) {
      return { type: 'file', name: e.name, path: fullPath }
    }
    return null
  }).filter(Boolean)
}

function getAllFiles(dir) {
  const results = []
  function walk(node) {
    if (node.type === 'file') results.push(node)
    if (node.type === 'dir') node.children.forEach(walk)
  }
  getVaultTree(dir).forEach(walk)
  return results
}

function watchVault(win) {
  if (vaultWatcher) { vaultWatcher.close(); vaultWatcher = null }
  if (!vaultPath) return
  let debounce = null
  vaultWatcher = fs.watch(vaultPath, { recursive: true }, () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      if (fs.existsSync(vaultPath)) {
        win.webContents.send('vault-changed', getVaultTree(vaultPath))
      }
    }, 300)
  })
}

// ─── MXT compilation ───────────────────────────────────────────────────────
let _compile = null
async function getCompiler() {
  if (!_compile) {
    const { compile } = await import('@mdx-js/mdx')
    const { default: remarkGfm } = await import('remark-gfm')
    const { default: rehypeSlug } = await import('rehype-slug')
    _compile = async (source, filePath) => {
      // Strip frontmatter avant compilation
      let body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')

      // Wiki links [[filename]] → <WikiLink href="filename">label</WikiLink>
      body = body.replace(
        /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g,
        (_, href, label) => {
          const safeHref = href.trim().replace(/["\\<>]/g, c => `&#${c.charCodeAt(0)};`)
          return `<WikiLink href="${safeHref}">${(label || href).trim()}</WikiLink>`
        }
      )

      // Images relatives → vault:// protocol pour Electron
      if (filePath && vaultPath) {
        const dir = path.dirname(filePath)
        const toVault = (src) => {
          if (/^https?:\/\/|^vault:\/\//.test(src)) return src
          const abs = path.isAbsolute(src) ? src : path.resolve(dir, src)
          // Triple slash pour éviter que Windows traite le lecteur (C:) comme un host d'URL
          return 'vault:///' + abs.replace(/\\/g, '/')
        }
        // Markdown: ![alt](src) — chemins relatifs ET absolus (C:\, G:\, /chemin)
        body = body.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/|vault:\/\/)([^)]+)\)/g,
          (_, alt, src) => `![${alt}](${toVault(src.trim())})`
        )
        // HTML: <img src="..." /> — chemins relatifs ET absolus
        body = body.replace(
          /<img(\s[^>]*?)src=(["'])(?!https?:\/\/|vault:\/\/)([^"']+)\2/gi,
          (_, attrs, quote, src) => `<img${attrs}src=${quote}${toVault(src.trim())}${quote}`
        )
      }

      const opts = {
        outputFormat: 'function-body',
        development: false,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      }

      try {
        // Essai 1 : mode MXT complet (JSX autorisé)
        const result = await compile(body, opts)
        return String(result)
      } catch {
        // Fallback : mode Markdown pur (ignore le JSX/HTML invalide)
        const result = await compile(body, { ...opts, format: 'md' })
        return String(result)
      }
    }
  }
  return _compile
}

// ─── App setup ─────────────────────────────────────────────────────────────
let mainWindow = null
let openFilePath = null

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

const argFile = process.argv.find(a => /\.(md|mxt)$/i.test(a))
if (argFile && fs.existsSync(argFile)) openFilePath = argFile

function createWindow() {
  // Protocole vault:// pour servir les assets locaux (images, etc.)
  if (!protocol.isProtocolRegistered('vault')) {
    protocol.registerFileProtocol('vault', (request, callback) => {
      try {
        // vault:///C:/path → strip "vault://" then strip leading "/" before drive letter
        let raw = decodeURIComponent(request.url.replace('vault://', ''))
        if (/^\/[A-Za-z]:/.test(raw)) raw = raw.slice(1)
        const filePath = path.normalize(raw)
        // Lecture seule — on autorise n'importe quel fichier local (images depuis C:, G:, etc.)
        if (!fs.existsSync(filePath)) { callback({ error: -6 }); return } // ERR_FILE_NOT_FOUND
        callback({ path: filePath })
      } catch { callback({ error: -2 }) }
    })
  }

  mainWindow = new BrowserWindow({
    width: 1600, height: 950, minWidth: 900, minHeight: 600,
    frame: false, titleBarStyle: 'hidden', backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.on('closed', () => { mainWindow = null })

  // ── Find in page (Ctrl+F natif) ─────────────────────────────────────────
  mainWindow.webContents.on('found-in-page', (_, result) => {
    mainWindow.webContents.send('found-in-page', result)
  })
}

// ─── IPC handlers ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()

  // ── Auto-updater ────────────────────────────────────────────────────────
  let _updateStatus = null // 'available' | 'downloaded' | { error: string }
  if (autoUpdater) {
    try {
      autoUpdater.logger = null // désactive le logger interne
      autoUpdater.on('checking-for-update', () => {
        // Simple vérification, pas d'erreur
      })
      autoUpdater.on('update-available', (info) => {
        _updateStatus = 'available'
        mainWindow?.webContents.send('update-available')
      })
      autoUpdater.on('update-not-available', () => {
        // L'app est à jour, rien à signaler
      })
      autoUpdater.on('update-downloaded', () => {
        _updateStatus = 'downloaded'
        mainWindow?.webContents.send('update-downloaded')
      })
      autoUpdater.on('error', (err) => {
        _updateStatus = { error: err.message }
        mainWindow?.webContents.send('update-error', err.message)
      })
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        _updateStatus = { error: err.message }
        mainWindow?.webContents.send('update-error', err.message)
      })
    } catch (e) {
      _updateStatus = { error: e.message }
    }
  }
  // Renderer peut demander le statut après son chargement
  ipcMain.handle('get-update-status', () => {
    if (!_updateStatus) return null
    if (_updateStatus === 'available') return { type: 'available' }
    if (_updateStatus === 'downloaded') return { type: 'downloaded' }
    return { type: 'error', message: _updateStatus.error }
  })

  // MXT compilation (source + chemin du fichier courant pour résoudre les images)
  ipcMain.handle('compile-mxt', async (_, source, filePath) => {
    try {
      const compile = await getCompiler()
      const code = await compile(source, filePath || null)
      return { ok: true, code }
    } catch (e) { return { ok: false, error: e.message } }
  })

  // Recherche full-text dans le vault (async par batch pour éviter de bloquer le thread)
  ipcMain.handle('search-vault', async (_, query) => {
    if (!vaultPath || !query.trim()) return []
    const q = query.toLowerCase()
    const files = getAllFiles(vaultPath)
    const results = []
    const BATCH = 20

    for (let i = 0; i < files.length && results.length < 100; i += BATCH) {
      const batch = files.slice(i, i + BATCH)
      const batchResults = await Promise.all(batch.map(async (node) => {
        try {
          const content = await fs.promises.readFile(node.path, 'utf-8')
          const hits = []
          content.split('\n').forEach((line, idx) => {
            if (line.toLowerCase().includes(q)) {
              hits.push({ path: node.path, name: node.name, line: idx + 1, snippet: line.trim().slice(0, 120) })
            }
          })
          return hits
        } catch { return [] }
      }))
      results.push(...batchResults.flat())
    }

    return results.slice(0, 100)
  })

  // ── Config ──────────────────────────────────────────────────────────────
  ipcMain.handle('get-config', () => {
    return loadConfig()
  })

  ipcMain.handle('save-config', (_, updates) => {
    try {
      const current = loadConfig()
      const merged = { ...current, ...updates }
      saveConfig(merged)
      return { ok: true }
    } catch (e) { return { ok: false, error: e.message } }
  })

  // ── Vault ──────────────────────────────────────────────────────────────
  ipcMain.handle('open-vault', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Ouvrir ou créer un vault'
    })
    if (result.canceled || !result.filePaths[0]) return { ok: false }
    vaultPath = result.filePaths[0]
    saveConfig({ ...loadConfig(), vaultPath })
    watchVault(mainWindow)
    return { ok: true, vaultPath, tree: getVaultTree(vaultPath) }
  })

  // Ouvre un sélecteur de dossier sans toucher au vault (pour git, etc.)
  ipcMain.handle('browse-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Sélectionner un répertoire'
    })
    if (result.canceled || !result.filePaths[0]) return { ok: false }
    return { ok: true, dirPath: result.filePaths[0] }
  })

  ipcMain.handle('set-vault', (_, dirPath) => {
    try {
      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return { ok: false, error: 'Chemin invalide' }
      }
      vaultPath = dirPath
      saveConfig({ ...loadConfig(), vaultPath })
      watchVault(mainWindow)
      return { ok: true, vaultPath, tree: getVaultTree(vaultPath) }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('get-vault', () => {
    const cfg = loadConfig()
    if (cfg.vaultPath && fs.existsSync(cfg.vaultPath)) {
      vaultPath = cfg.vaultPath
      watchVault(mainWindow)
      return { ok: true, vaultPath, tree: getVaultTree(vaultPath) }
    }
    return { ok: false }
  })

  ipcMain.handle('get-vault-tree', () => {
    if (!vaultPath) return { ok: false }
    return { ok: true, tree: getVaultTree(vaultPath) }
  })

  ipcMain.handle('read-vault-file', (_, filePath) => {
    try {
      const resolved = assertInsideVault(filePath)
      return { ok: true, content: fs.readFileSync(resolved, 'utf-8'), name: path.basename(resolved), path: resolved }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('create-file', async (_, { dir, name }) => {
    try {
      const targetDir = dir || vaultPath
      assertInsideVault(targetDir)
      const base = /\.(md|mxt)$/.test(name) ? name : `${name}.mxt`
      const filePath = path.join(targetDir, base)
      assertInsideVault(filePath)
      if (fs.existsSync(filePath)) return { ok: false, error: 'Ce fichier existe déjà' }
      fs.writeFileSync(filePath, `# ${name.replace(/\.(mxt|md)$/, '')}\n\n`, 'utf-8')
      return { ok: true, path: filePath, name: base, content: fs.readFileSync(filePath, 'utf-8') }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('create-folder', async (_, { dir, name }) => {
    try {
      const targetDir = dir || vaultPath
      assertInsideVault(targetDir)
      const folderPath = path.join(targetDir, name)
      assertInsideVault(folderPath)
      if (fs.existsSync(folderPath)) return { ok: false, error: 'Ce dossier existe déjà' }
      fs.mkdirSync(folderPath, { recursive: true })
      return { ok: true, path: folderPath }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('rename-file', async (_, { oldPath, newName }) => {
    try {
      assertInsideVault(oldPath)
      const dir = path.dirname(oldPath)
      const ext = path.extname(oldPath)
      const base = newName.includes('.') ? newName : newName + ext
      const newPath = path.join(dir, base)
      assertInsideVault(newPath)
      fs.renameSync(oldPath, newPath)
      return { ok: true, newPath, newName: base }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('delete-file', async (_, filePath) => {
    try {
      assertInsideVault(filePath)
      await shell.trashItem(filePath)
      return { ok: true }
    } catch (e) {
      if (e.message.includes('hors du vault')) return { ok: false, error: e.message }
      try { fs.unlinkSync(filePath); return { ok: true } }
      catch (e2) { return { ok: false, error: e2.message } }
    }
  })

  ipcMain.handle('delete-folder', async (_, folderPath) => {
    try {
      assertInsideVault(folderPath)
      await shell.trashItem(folderPath)
      return { ok: true }
    } catch (e) {
      if (e.message.includes('hors du vault')) return { ok: false, error: e.message }
      try { fs.rmSync(folderPath, { recursive: true }); return { ok: true } }
      catch (e2) { return { ok: false, error: e2.message } }
    }
  })

  ipcMain.handle('move-file', async (_, { oldPath, newDir }) => {
    try {
      assertInsideVault(oldPath)
      assertInsideVault(newDir)
      const name = path.basename(oldPath)
      const newPath = path.join(newDir, name)
      assertInsideVault(newPath)
      if (fs.existsSync(newPath)) return { ok: false, error: 'Un fichier avec ce nom existe déjà dans ce dossier' }
      fs.renameSync(oldPath, newPath)
      return { ok: true, newPath, name }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('duplicate-file', async (_, filePath) => {
    try {
      assertInsideVault(filePath)
      const dir = path.dirname(filePath)
      const ext = path.extname(filePath)
      const base = path.basename(filePath, ext)
      let candidate = path.join(dir, `${base}-copie${ext}`)
      if (fs.existsSync(candidate)) {
        let i = 2
        while (fs.existsSync(path.join(dir, `${base}-copie-${i}${ext}`))) i++
        candidate = path.join(dir, `${base}-copie-${i}${ext}`)
      }
      assertInsideVault(candidate)
      fs.copyFileSync(filePath, candidate)
      return { ok: true, path: candidate, name: path.basename(candidate), content: fs.readFileSync(candidate, 'utf-8') }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('resolve-wiki-link', (_, name) => {
    if (!vaultPath) return null
    const all = getAllFiles(vaultPath)
    const found = all.find(f => {
      const base = path.basename(f.path, path.extname(f.path))
      return base.toLowerCase() === name.toLowerCase() || f.name.toLowerCase() === name.toLowerCase()
    })
    return found ? found.path : null
  })

  ipcMain.handle('get-vault-files', () => {
    if (!vaultPath) return []
    return getAllFiles(vaultPath).map(f => ({
      name: path.basename(f.path, path.extname(f.path)),
      path: f.path
    }))
  })

  // ── Fichier intégré (exemple) ──────────────────────────────────────────
  ipcMain.handle('get-builtin-example', () => {
    try {
      const examplePath = app.isPackaged
        ? path.join(process.resourcesPath, 'exemple.mxt')
        : path.join(__dirname, '../../exemple.mxt')
      if (!fs.existsSync(examplePath)) {
        return { ok: false, error: 'Fichier exemple introuvable' }
      }
      return { ok: true, content: fs.readFileSync(examplePath, 'utf-8'), name: 'exemple.mxt', path: '__builtin__:exemple' }
    } catch (e) { return { ok: false, error: e.message } }
  })

  // ── Fichier seul (sans vault) ──────────────────────────────────────────
  ipcMain.handle('get-file', () => {
    if (openFilePath && fs.existsSync(openFilePath)) {
      return { path: openFilePath, content: fs.readFileSync(openFilePath, 'utf-8'), name: path.basename(openFilePath) }
    }
    return { path: null, name: 'Nouveau fichier', content: '# Bienvenue\n\nOuvrez un **vault** ou un fichier `.mxt` / `.md`.\n' }
  })

  ipcMain.handle('save-file', (_, { path: p, content }) => {
    try {
      if (!p) return { ok: false, error: 'Pas de chemin' }
      // When a vault is open, only allow saving inside it
      if (vaultPath) assertInsideVault(p)
      fs.writeFileSync(p, content, 'utf-8')
      return { ok: true }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('save-file-as', async (_, { content, dir }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'MXT', extensions: ['mxt'] }, { name: 'Markdown', extensions: ['md'] }],
      defaultPath: path.join(dir || vaultPath || app.getPath('documents'), 'nouveau.mxt')
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { ok: true, path: result.filePath, name: path.basename(result.filePath) }
    }
    return { ok: false }
  })

  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'Fichiers texte', extensions: ['mxt', 'md'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      const p = result.filePaths[0]
      return { ok: true, path: p, name: path.basename(p), content: fs.readFileSync(p, 'utf-8') }
    }
    return { ok: false }
  })

  // Lit n'importe quel fichier sans vérification vault (pour fichiers hors vault)
  ipcMain.handle('read-file', (_, filePath) => {
    try {
      if (!fs.existsSync(filePath)) return { ok: false, error: 'Fichier introuvable' }
      const content = fs.readFileSync(filePath, 'utf-8')
      return { ok: true, content, name: path.basename(filePath), path: filePath }
    } catch (e) { return { ok: false, error: e.message } }
  })

  // ── Auto-updater install ───────────────────────────────────────────────
  ipcMain.handle('install-update', () => {
    if (autoUpdater) autoUpdater.quitAndInstall()
  })

  // ── Fenêtre ────────────────────────────────────────────────────────────
  ipcMain.handle('window-minimize', () => mainWindow?.minimize())
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.handle('window-close', () => mainWindow?.close())
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

  // ── Find in page ────────────────────────────────────────────────────────
  ipcMain.on('find-in-page', (_, text, forward = true, findNext = false) => {
    if (!text) { mainWindow?.webContents.stopFindInPage('clearSelection'); return }
    mainWindow?.webContents.findInPage(text, { forward, findNext, matchCase: false })
  })
  ipcMain.on('stop-find-in-page', () => {
    mainWindow?.webContents.stopFindInPage('clearSelection')
  })

  // ── Git Integration ────────────────────────────────────────────────────
  ipcMain.handle('git-detect-repo', (_, dir) => {
    const isRepo = gitManager.isGitRepo(dir)
    if (isRepo) {
      const info = gitManager.getRepoInfo(dir)
      return { ok: true, isRepo: true, info }
    }
    return { ok: true, isRepo: false }
  })

  ipcMain.handle('git-open-repo', (_, dir) => {
    const result = gitManager.openRepo(dir)
    return result
  })



  ipcMain.handle('git-get-markdown-files', async (_, dir) => {
    const files = gitManager.getMarkdownFiles(dir)
    return { ok: true, files }
  })

  ipcMain.handle('git-read-md', (_, filePath) => {
    const content = gitManager.readMarkdownFile(filePath)
    if (!content) return { ok: false, error: 'Impossible de lire le fichier' }
    return { ok: true, content, filePath }
  })




})

// ─── Instance unique ───────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_, argv) => {
    const file = argv.find(a => /\.(mxt|md)$/i.test(a))
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      if (file && fs.existsSync(file)) {
        mainWindow.webContents.send('open-file', {
          path: file, name: path.basename(file), content: fs.readFileSync(file, 'utf-8')
        })
      }
    }
  })
}

app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

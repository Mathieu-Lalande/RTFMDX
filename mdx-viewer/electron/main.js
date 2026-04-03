const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron')
const fs = require('fs')
const path = require('path')
const gitManager = require('./git-manager')

// Auto-updater (fails silently if not packaged or no network)
let autoUpdater = null
try {
  autoUpdater = require('electron-updater').autoUpdater
} catch {}

// Protocole vault:// pour servir les images et assets locaux
app.whenReady().then(() => {}).catch(() => {})
// (enregistré dans createWindow via protocol.registerFileProtocol)

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
    if (/\.(mdx?|md)$/i.test(e.name)) {
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

// ─── MDX compilation ───────────────────────────────────────────────────────
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
        (_, href, label) => `<WikiLink href="${href.trim()}">${(label || href).trim()}</WikiLink>`
      )

      // Images relatives → vault:// protocol pour Electron
      if (filePath && vaultPath) {
        const dir = path.dirname(filePath)
        body = body.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/|vault:\/\/)([^)]+)\)/g,
          (_, alt, src) => {
            const abs = path.isAbsolute(src)
              ? src
              : path.resolve(dir, src)
            return `![${alt}](vault://${abs.replace(/\\/g, '/')})`
          }
        )
      }

      const result = await compile(body, {
        outputFormat: 'function-body',
        development: false,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      })
      return String(result)
    }
  }
  return _compile
}

// ─── App setup ─────────────────────────────────────────────────────────────
let mainWindow = null
let openFilePath = null

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

const argFile = process.argv.find(a => /\.(mdx?|md)$/i.test(a))
if (argFile && fs.existsSync(argFile)) openFilePath = argFile

function createWindow() {
  // Protocole vault:// pour servir les assets locaux (images, etc.)
  if (!protocol.isProtocolRegistered('vault')) {
    protocol.registerFileProtocol('vault', (request, callback) => {
      const filePath = decodeURIComponent(request.url.replace('vault://', ''))
      callback({ path: filePath })
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
  const prodUrl = `file://${path.join(__dirname, '../dist/index.html')}`
  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || prodUrl)
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
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
  if (autoUpdater) {
    try {
      autoUpdater.on('update-available', () => {
        mainWindow?.webContents.send('update-available')
      })
      autoUpdater.on('update-downloaded', () => {
        mainWindow?.webContents.send('update-downloaded')
      })
      autoUpdater.checkForUpdatesAndNotify().catch(() => {})
    } catch {}
  }

  // MDX compilation (source + chemin du fichier courant pour résoudre les images)
  ipcMain.handle('compile-mdx', async (_, source, filePath) => {
    try {
      const compile = await getCompiler()
      const code = await compile(source, filePath || null)
      return { ok: true, code }
    } catch (e) { return { ok: false, error: e.message } }
  })

  // Recherche full-text dans le vault
  ipcMain.handle('search-vault', async (_, query) => {
    if (!vaultPath || !query.trim()) return []
    const q = query.toLowerCase()
    const results = []
    function searchTree(nodes) {
      for (const node of nodes) {
        if (node.type === 'file') {
          try {
            const content = fs.readFileSync(node.path, 'utf-8')
            const lines = content.split('\n')
            lines.forEach((line, i) => {
              if (line.toLowerCase().includes(q)) {
                results.push({
                  path: node.path,
                  name: node.name,
                  line: i + 1,
                  snippet: line.trim().slice(0, 120)
                })
              }
            })
          } catch {}
        } else if (node.type === 'dir') {
          searchTree(node.children)
        }
      }
    }
    searchTree(getVaultTree(vaultPath))
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
      properties: ['openDirectory'],
      title: 'Ouvrir un vault MDX'
    })
    if (result.canceled || !result.filePaths[0]) return { ok: false }
    vaultPath = result.filePaths[0]
    saveConfig({ ...loadConfig(), vaultPath })
    watchVault(mainWindow)
    return { ok: true, vaultPath, tree: getVaultTree(vaultPath) }
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
      return { ok: true, content: fs.readFileSync(filePath, 'utf-8'), name: path.basename(filePath), path: filePath }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('create-file', async (_, { dir, name }) => {
    try {
      const base = name.endsWith('.mdx') || name.endsWith('.md') ? name : `${name}.mdx`
      const filePath = path.join(dir || vaultPath, base)
      if (fs.existsSync(filePath)) return { ok: false, error: 'Ce fichier existe déjà' }
      fs.writeFileSync(filePath, `# ${name.replace(/\.(mdx?|md)$/, '')}\n\n`, 'utf-8')
      return { ok: true, path: filePath, name: base, content: fs.readFileSync(filePath, 'utf-8') }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('create-folder', async (_, { dir, name }) => {
    try {
      const folderPath = path.join(dir || vaultPath, name)
      if (fs.existsSync(folderPath)) return { ok: false, error: 'Ce dossier existe déjà' }
      fs.mkdirSync(folderPath, { recursive: true })
      return { ok: true, path: folderPath }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('rename-file', async (_, { oldPath, newName }) => {
    try {
      const dir = path.dirname(oldPath)
      const ext = path.extname(oldPath)
      const base = newName.includes('.') ? newName : newName + ext
      const newPath = path.join(dir, base)
      fs.renameSync(oldPath, newPath)
      return { ok: true, newPath, newName: base }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('delete-file', async (_, filePath) => {
    try {
      await shell.trashItem(filePath)
      return { ok: true }
    } catch (e) {
      try { fs.unlinkSync(filePath); return { ok: true } }
      catch (e2) { return { ok: false, error: e2.message } }
    }
  })

  ipcMain.handle('delete-folder', async (_, folderPath) => {
    try {
      await shell.trashItem(folderPath)
      return { ok: true }
    } catch (e) {
      try { fs.rmSync(folderPath, { recursive: true }); return { ok: true } }
      catch (e2) { return { ok: false, error: e2.message } }
    }
  })

  ipcMain.handle('duplicate-file', async (_, filePath) => {
    try {
      const dir = path.dirname(filePath)
      const ext = path.extname(filePath)
      const base = path.basename(filePath, ext)
      // Find non-colliding name
      let candidate = path.join(dir, `${base}-copie${ext}`)
      if (fs.existsSync(candidate)) {
        let i = 2
        while (fs.existsSync(path.join(dir, `${base}-copie-${i}${ext}`))) i++
        candidate = path.join(dir, `${base}-copie-${i}${ext}`)
      }
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
        ? path.join(process.resourcesPath, 'exemple.mdx')
        : path.join(__dirname, '../../exemple.mdx')
      if (!fs.existsSync(examplePath)) {
        return { ok: false, error: 'Fichier exemple introuvable' }
      }
      return { ok: true, content: fs.readFileSync(examplePath, 'utf-8'), name: 'exemple.mdx', path: '__builtin__:exemple' }
    } catch (e) { return { ok: false, error: e.message } }
  })

  // ── Fichier seul (sans vault) ──────────────────────────────────────────
  ipcMain.handle('get-file', () => {
    if (openFilePath && fs.existsSync(openFilePath)) {
      return { path: openFilePath, content: fs.readFileSync(openFilePath, 'utf-8'), name: path.basename(openFilePath) }
    }
    return { path: null, name: 'Nouveau fichier', content: '# Bienvenue\n\nOuvrez un **vault** ou un fichier `.mdx`.\n' }
  })

  ipcMain.handle('save-file', (_, { path: p, content }) => {
    try {
      if (!p) return { ok: false, error: 'Pas de chemin' }
      fs.writeFileSync(p, content, 'utf-8')
      return { ok: true }
    } catch (e) { return { ok: false, error: e.message } }
  })

  ipcMain.handle('save-file-as', async (_, { content, dir }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'MDX', extensions: ['mdx'] }, { name: 'Markdown', extensions: ['md'] }],
      defaultPath: path.join(dir || vaultPath || app.getPath('documents'), 'nouveau.mdx')
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { ok: true, path: result.filePath, name: path.basename(result.filePath) }
    }
    return { ok: false }
  })

  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'MDX / Markdown', extensions: ['mdx', 'md'] }],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      const p = result.filePaths[0]
      return { ok: true, path: p, name: path.basename(p), content: fs.readFileSync(p, 'utf-8') }
    }
    return { ok: false }
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
    const file = argv.find(a => /\.(mdx?|md)$/i.test(a))
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

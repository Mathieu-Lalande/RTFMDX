const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const fs = require('fs')
const path = require('path')

// MDX compilation — runs in Node.js context (main process) to avoid ESM/CJS issues in browser
let compileMDX = null
async function getCompiler() {
  if (!compileMDX) {
    const { compile } = await import('@mdx-js/mdx')
    const { default: remarkGfm } = await import('remark-gfm')
    const { default: rehypeSlug } = await import('rehype-slug')
    compileMDX = async (source) => {
      const result = await compile(source, {
        outputFormat: 'function-body',
        development: false,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      })
      return String(result)
    }
  }
  return compileMDX
}

let mainWindow
let openFilePath = null

// Fix GPU shader cache permission errors on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// File passed as argument (double-click in Windows Explorer)
const argFile = process.argv.find(a => a.endsWith('.mdx') || a.endsWith('.md'))
if (argFile && fs.existsSync(argFile)) {
  openFilePath = argFile
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const devUrl = 'http://localhost:5173'
  const prodUrl = `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || prodUrl)

  // DevTools en mode dev
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // Ouvre les liens externes dans le navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  // Compile MDX dans le processus principal (Node.js) et retourne le code compilé
  ipcMain.handle('compile-mdx', async (_, source) => {
    try {
      const compile = await getCompiler()
      const code = await compile(source)
      return { ok: true, code }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  // Fournit le fichier initial à React
  ipcMain.handle('get-file', () => {
    if (openFilePath && fs.existsSync(openFilePath)) {
      return {
        path: openFilePath,
        content: fs.readFileSync(openFilePath, 'utf-8'),
        name: path.basename(openFilePath)
      }
    }
    return {
      path: null,
      name: 'Nouveau fichier',
      content: `# Bienvenue dans MDX Viewer

Ceci est un éditeur **MDX** — Markdown avec des composants React.

## Fonctionnalités

- Rendu live en temps réel
- Composants personnalisés
- Syntax highlighting

## Composants disponibles

<Callout type="info">
  Utilisez les composants directement dans votre Markdown.
</Callout>

<Callout type="warning">
  Ceci est un avertissement important.
</Callout>

<Callout type="danger">
  Action irréversible — soyez prudent !
</Callout>

## Étapes d'exemple

<Steps>
  - Ouvrez un fichier **.mdx** depuis l'explorateur
  - Éditez à gauche, le rendu se met à jour à droite
  - **Ctrl+S** pour sauvegarder
</Steps>

## Code

\`\`\`javascript
function hello(name) {
  return \`Bonjour, \${name} !\`
}
\`\`\`

> **Note :** Double-cliquez sur n'importe quel fichier \`.mdx\` pour l'ouvrir directement.
`
    }
  })

  // Sauvegarde
  ipcMain.handle('save-file', (_, { path: p, content }) => {
    try {
      if (!p) return { ok: false, error: 'Pas de chemin défini' }
      fs.writeFileSync(p, content, 'utf-8')
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  // Sauvegarde sous
  ipcMain.handle('save-file-as', async (_, { content }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'MDX', extensions: ['mdx'] }, { name: 'Markdown', extensions: ['md'] }],
      defaultPath: 'nouveau.mdx'
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      openFilePath = result.filePath
      return { ok: true, path: result.filePath, name: path.basename(result.filePath) }
    }
    return { ok: false }
  })

  // Ouvrir un fichier
  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'MDX / Markdown', extensions: ['mdx', 'md'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths[0]) {
      const p = result.filePaths[0]
      openFilePath = p
      return {
        ok: true,
        path: p,
        name: path.basename(p),
        content: fs.readFileSync(p, 'utf-8')
      }
    }
    return { ok: false }
  })

  // Contrôles fenêtre (titlebar custom)
  ipcMain.handle('window-minimize', () => mainWindow.minimize())
  ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.handle('window-close', () => mainWindow.close())
  ipcMain.handle('window-is-maximized', () => mainWindow.isMaximized())
})

// Instance unique — si l'app est déjà ouverte et qu'on double-clique sur un .mdx,
// on envoie le fichier à la fenêtre existante plutôt que d'en ouvrir une deuxième
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_, argv) => {
    const file = argv.find(a => a.endsWith('.mdx') || a.endsWith('.md'))
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      if (file && fs.existsSync(file)) {
        mainWindow.webContents.send('open-file', {
          path: file,
          name: path.basename(file),
          content: fs.readFileSync(file, 'utf-8')
        })
      }
    }
  })
}

// macOS : rouvre si on clique sur l'icône
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

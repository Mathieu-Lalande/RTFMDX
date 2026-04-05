const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // MXT
  compileMxt: (source, filePath) => ipcRenderer.invoke('compile-mxt', source, filePath),
  searchVault: (query) => ipcRenderer.invoke('search-vault', query),

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (updates) => ipcRenderer.invoke('save-config', updates),

  // Vault
  openVault: () => ipcRenderer.invoke('open-vault'),
  setVault: (dirPath) => ipcRenderer.invoke('set-vault', dirPath),
  getVault: () => ipcRenderer.invoke('get-vault'),
  getVaultTree: () => ipcRenderer.invoke('get-vault-tree'),
  readVaultFile: (filePath) => ipcRenderer.invoke('read-vault-file', filePath),
  createFile: (opts) => ipcRenderer.invoke('create-file', opts),
  createFolder: (opts) => ipcRenderer.invoke('create-folder', opts),
  renameFile: (opts) => ipcRenderer.invoke('rename-file', opts),
  moveFile: (opts) => ipcRenderer.invoke('move-file', opts),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  deleteFolder: (folderPath) => ipcRenderer.invoke('delete-folder', folderPath),
  duplicateFile: (filePath) => ipcRenderer.invoke('duplicate-file', filePath),
  resolveWikiLink: (name) => ipcRenderer.invoke('resolve-wiki-link', name),
  getVaultFiles: () => ipcRenderer.invoke('get-vault-files'),

  // Fichier intégré
  getBuiltinExample: () => ipcRenderer.invoke('get-builtin-example'),

  // Événements vault → renderer
  onVaultChanged: (cb) => ipcRenderer.on('vault-changed', (_, tree) => cb(tree)),
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_, data) => cb(data)),

  // Fichier seul
  getFile: () => ipcRenderer.invoke('get-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveFileAs: (data) => ipcRenderer.invoke('save-file-as', data),
  openFile: () => ipcRenderer.invoke('open-file'),

  // Git Integration
  gitDetectRepo: (dir) => ipcRenderer.invoke('git-detect-repo', dir),
  gitOpenRepo: (dir) => ipcRenderer.invoke('git-open-repo', dir),
  gitGetMarkdownFiles: (dir) => ipcRenderer.invoke('git-get-markdown-files', dir),
  gitReadMd: (filePath) => ipcRenderer.invoke('git-read-md', filePath),

  // Fenêtre
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Auto-update
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', () => cb()),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', () => cb()),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Find in page (natif Electron)
  findInPage: (text, forward, findNext) => ipcRenderer.send('find-in-page', text, forward, findNext),
  stopFindInPage: () => ipcRenderer.send('stop-find-in-page'),
  onFoundInPage: (cb) => ipcRenderer.on('found-in-page', (_, result) => cb(result)),
})

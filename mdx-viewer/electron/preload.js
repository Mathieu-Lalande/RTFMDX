const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // MDX
  compileMdx: (source, filePath) => ipcRenderer.invoke('compile-mdx', source, filePath),
  searchVault: (query) => ipcRenderer.invoke('search-vault', query),

  // Vault
  openVault: () => ipcRenderer.invoke('open-vault'),
  getVault: () => ipcRenderer.invoke('get-vault'),
  getVaultTree: () => ipcRenderer.invoke('get-vault-tree'),
  readVaultFile: (filePath) => ipcRenderer.invoke('read-vault-file', filePath),
  createFile: (opts) => ipcRenderer.invoke('create-file', opts),
  createFolder: (opts) => ipcRenderer.invoke('create-folder', opts),
  renameFile: (opts) => ipcRenderer.invoke('rename-file', opts),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  deleteFolder: (folderPath) => ipcRenderer.invoke('delete-folder', folderPath),
  resolveWikiLink: (name) => ipcRenderer.invoke('resolve-wiki-link', name),
  getVaultFiles: () => ipcRenderer.invoke('get-vault-files'),

  // Événements vault → renderer
  onVaultChanged: (cb) => ipcRenderer.on('vault-changed', (_, tree) => cb(tree)),
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_, data) => cb(data)),

  // Fichier seul
  getFile: () => ipcRenderer.invoke('get-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveFileAs: (data) => ipcRenderer.invoke('save-file-as', data),
  openFile: () => ipcRenderer.invoke('open-file'),

  // Fenêtre
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
})

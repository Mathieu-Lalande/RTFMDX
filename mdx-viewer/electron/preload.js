const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  compileMdx: (source) => ipcRenderer.invoke('compile-mdx', source),
  getFile: () => ipcRenderer.invoke('get-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveFileAs: (data) => ipcRenderer.invoke('save-file-as', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_, data) => cb(data)),
})

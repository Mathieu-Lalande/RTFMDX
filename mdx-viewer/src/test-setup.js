import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock global window.electron (Electron IPC bridge)
global.window = global.window || {}
window.electron = {
  // Vault
  openVault: vi.fn().mockResolvedValue({ ok: false }),
  browseDirectory: vi.fn().mockResolvedValue({ ok: false }),
  setVault: vi.fn().mockResolvedValue({ ok: false }),
  getVault: vi.fn().mockResolvedValue({ ok: false }),
  getVaultTree: vi.fn().mockResolvedValue([]),
  getVaultFiles: vi.fn().mockResolvedValue([]),
  readVaultFile: vi.fn().mockResolvedValue({ ok: false }),
  createFile: vi.fn().mockResolvedValue({ ok: false }),
  createFolder: vi.fn().mockResolvedValue({ ok: false }),
  renameFile: vi.fn().mockResolvedValue({ ok: false }),
  moveFile: vi.fn().mockResolvedValue({ ok: false }),
  deleteFile: vi.fn().mockResolvedValue({ ok: false }),
  deleteFolder: vi.fn().mockResolvedValue({ ok: false }),
  duplicateFile: vi.fn().mockResolvedValue({ ok: false }),
  resolveWikiLink: vi.fn().mockResolvedValue(null),
  searchVault: vi.fn().mockResolvedValue([]),

  // Config
  getConfig: vi.fn().mockResolvedValue({}),
  saveConfig: vi.fn().mockResolvedValue({}),

  // Git
  gitDetectRepo: vi.fn().mockResolvedValue({ isRepo: false }),
  gitOpenRepo: vi.fn().mockResolvedValue({ success: false }),
  gitGetMarkdownFiles: vi.fn().mockResolvedValue({ files: [] }),
  gitReadMd: vi.fn().mockResolvedValue({ ok: false }),

  // Fichier
  getFile: vi.fn().mockResolvedValue({ ok: false }),
  saveFile: vi.fn().mockResolvedValue({ ok: false }),
  saveFileAs: vi.fn().mockResolvedValue({ ok: false }),
  openFile: vi.fn().mockResolvedValue({ ok: false }),
  getBuiltinExample: vi.fn().mockResolvedValue({ ok: false }),

  // Fenêtre
  windowMinimize: vi.fn(),
  windowMaximize: vi.fn(),
  windowClose: vi.fn(),
  windowIsMaximized: vi.fn().mockResolvedValue(false),

  // Auto-update
  onUpdateAvailable: vi.fn(),
  onUpdateDownloaded: vi.fn(),
  onUpdateError: vi.fn(),
  getUpdateStatus: vi.fn().mockResolvedValue(null),
  installUpdate: vi.fn(),

  // Events
  onVaultChanged: vi.fn(),
  onOpenFile: vi.fn(),

  // Compile
  compileMxt: vi.fn().mockResolvedValue({ ok: false }),

  // Find
  findInPage: vi.fn(),
  stopFindInPage: vi.fn(),
  onFoundInPage: vi.fn(),
}

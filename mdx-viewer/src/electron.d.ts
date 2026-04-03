export {}

interface FileData {
  path: string
  name: string
  content: string
}

interface VaultNode {
  type: 'file' | 'dir'
  name: string
  path: string
  children?: VaultNode[]
}

declare global {
  interface Window {
    electron: {
      // MDX
      compileMdx: (source: string, filePath?: string) => Promise<{ ok: boolean; code?: string; error?: string }>
      searchVault: (query: string) => Promise<Array<{ path: string; name: string; line: number; snippet: string }>>

      // Vault
      openVault: () => Promise<{ ok: boolean; vaultPath?: string; tree?: VaultNode[] }>
      getVault: () => Promise<{ ok: boolean; vaultPath?: string; tree?: VaultNode[] }>
      getVaultTree: () => Promise<{ ok: boolean; tree?: VaultNode[] }>
      readVaultFile: (filePath: string) => Promise<{ ok: boolean } & Partial<FileData>>
      createFile: (opts: { dir?: string; name: string }) => Promise<{ ok: boolean; path?: string; name?: string; content?: string; error?: string }>
      createFolder: (opts: { dir?: string; name: string }) => Promise<{ ok: boolean; path?: string; error?: string }>
      renameFile: (opts: { oldPath: string; newName: string }) => Promise<{ ok: boolean; newPath?: string; newName?: string; error?: string }>
      deleteFile: (filePath: string) => Promise<{ ok: boolean; error?: string }>
      deleteFolder: (folderPath: string) => Promise<{ ok: boolean; error?: string }>
      resolveWikiLink: (name: string) => Promise<string | null>
      getVaultFiles: () => Promise<Array<{ name: string; path: string }>>

      // Événements
      onVaultChanged: (cb: (tree: VaultNode[]) => void) => void
      onOpenFile: (cb: (data: FileData) => void) => void

      // Fichier seul
      getFile: () => Promise<FileData & { path: string | null }>
      saveFile: (data: { path: string; content: string }) => Promise<{ ok: boolean; error?: string }>
      saveFileAs: (data: { content: string; dir?: string }) => Promise<{ ok: boolean; path?: string; name?: string }>
      openFile: () => Promise<{ ok: boolean } & Partial<FileData>>

      // Fenêtre
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
    }
  }
}

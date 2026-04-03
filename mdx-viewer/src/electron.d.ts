export {}

declare global {
  interface Window {
    electron: {
      compileMdx: (source: string) => Promise<{ ok: boolean; code?: string; error?: string }>
      getFile: () => Promise<{ path: string | null; name: string; content: string }>
      saveFile: (data: { path: string; content: string }) => Promise<{ ok: boolean; error?: string }>
      saveFileAs: (data: { content: string }) => Promise<{ ok: boolean; path?: string; name?: string }>
      openFile: () => Promise<{ ok: boolean; path?: string; name?: string; content?: string }>
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      onOpenFile: (cb: (data: { path: string; name: string; content: string }) => void) => void
    }
  }
}

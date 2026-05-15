import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer, type BrowserWindowConstructorOptions } from 'electron'

const api = {
  createWindow: (
    payload?: BrowserWindowConstructorOptions & {
      url?: string
    }
  ) =>
    ipcRenderer.invoke('created-window:create', payload) as Promise<{
      id: number
    }>,

  deleteWindow: (id: number) =>
    ipcRenderer.invoke('created-window:delete', id) as Promise<{
      ok: boolean
    }>,

  windowExists: (id: number) =>
    ipcRenderer.invoke('created-window:exists', id) as Promise<{
      exists: boolean
    }>
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}

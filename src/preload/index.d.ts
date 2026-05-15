import type { ElectronAPI } from '@electron-toolkit/preload'
import type { BrowserWindowConstructorOptions } from 'electron'

type API = {
  createWindow: (
    payload?: BrowserWindowConstructorOptions & {
      url?: string
    }
  ) => Promise<{
    id: number
  }>
  deleteWindow: (id: number) => Promise<{
    ok: boolean
  }>
  windowExists: (id: number) => Promise<{
    exists: boolean
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}

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
    persist: {
      get<T>(key: string, fallbackValue?: T): Promise<T>
      set<T>(key: string, value: T): Promise<T>
      delete(key: string): Promise<boolean>
    }
  }
}

import type { ElectronAPI } from '@electron-toolkit/preload'
import type { BrowserWindowConstructorOptions } from 'electron'

type PoseKeypoint = {
  x: number
  y: number
  score: number
}

type RunPoseFramePayload = {
  rgba: Uint8ClampedArray
  width: number
  height: number
}

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
  runPoseFrame: (payload: RunPoseFramePayload) => Promise<PoseKeypoint[] | null>
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

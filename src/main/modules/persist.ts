import { app, ipcMain } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import { join } from 'path'

type PersistStore = Record<string, unknown>

let cache: PersistStore | null = null

const storeDir = () => join(app.getPath('userData'), 'app-data')
const storePath = () => join(storeDir(), 'persist.json')
const tempPath = () => join(storeDir(), 'persist.tmp.json')

async function loadStore(): Promise<PersistStore> {
  if (cache) return cache

  try {
    const raw = await readFile(storePath(), 'utf8')
    cache = JSON.parse(raw) as PersistStore
  } catch {
    cache = {}
  }

  return cache
}

async function saveStore(store: PersistStore): Promise<void> {
  await mkdir(storeDir(), { recursive: true })

  await writeFile(tempPath(), JSON.stringify(store, null, 2), 'utf8')
  await rename(tempPath(), storePath())
}

export function registerPersistIpc(): void {
  ipcMain.handle('persist:get', async (_event, key: string, fallbackValue: unknown = null) => {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Invalid persist key')
    }

    const store = await loadStore()
    return key in store ? store[key] : fallbackValue
  })

  ipcMain.handle('persist:set', async (_event, key: string, value: unknown) => {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Invalid persist key')
    }

    const store = await loadStore()
    store[key] = value
    await saveStore(store)

    return value
  })

  ipcMain.handle('persist:delete', async (_event, key: string) => {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Invalid persist key')
    }

    const store = await loadStore()
    delete store[key]
    await saveStore(store)

    return true
  })
}

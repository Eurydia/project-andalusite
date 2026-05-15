import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'

const createdWindows = new Map<
  number,
  {
    window: BrowserWindow
    ownerWindow?: BrowserWindow
    closeWithOwner?: () => void
  }
>()

export const registerCreatedWindowIpc = () => {
  ipcMain.handle(
    'created-window:create',
    async (
      event,
      payload: BrowserWindowConstructorOptions & {
        url?: string
      } = {}
    ) => {
      const { url, ...windowOptions } = payload
      const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined

      const createdWindow = new BrowserWindow({
        ...windowOptions,
        width: windowOptions.width ?? 800,
        height: windowOptions.height ?? 600,
        title: windowOptions.title ?? 'Created Window',
        show: windowOptions.show ?? false,
        autoHideMenuBar: windowOptions.autoHideMenuBar ?? true,
        webPreferences: {
          ...windowOptions.webPreferences,
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          contextIsolation: true,
          nodeIntegration: false,
          webSecurity: true
        }
      })

      const closeWithOwner = () => {
        if (!createdWindow.isDestroyed()) {
          createdWindow.close()
        }

        createdWindows.delete(createdWindow.id)
      }

      if (ownerWindow && !ownerWindow.isDestroyed()) {
        ownerWindow.once('closed', closeWithOwner)
      }

      createdWindows.set(createdWindow.id, {
        window: createdWindow,
        ownerWindow,
        closeWithOwner
      })

      createdWindow.on('ready-to-show', () => {
        if (windowOptions.show !== true) {
          createdWindow.show()
        }
      })

      createdWindow.on('closed', () => {
        const trackedWindow = createdWindows.get(createdWindow.id)

        if (trackedWindow?.ownerWindow && trackedWindow.closeWithOwner) {
          trackedWindow.ownerWindow.removeListener('closed', trackedWindow.closeWithOwner)
        }

        createdWindows.delete(createdWindow.id)
      })

      const search = new URLSearchParams({
        mediaPlayer: 'true',
        url: url ?? ''
      }).toString()

      if (is.dev && process.env.ELECTRON_RENDERER_URL) {
        const rendererUrl = new URL(process.env.ELECTRON_RENDERER_URL)
        rendererUrl.search = search

        await createdWindow.loadURL(rendererUrl.toString())
      } else {
        await createdWindow.loadFile(join(__dirname, '../renderer/index.html'), {
          search: `?${search}`
        })
      }

      return {
        id: createdWindow.id
      }
    }
  )

  ipcMain.handle('created-window:delete', (_event, id: number) => {
    const trackedWindow = createdWindows.get(id)

    if (!trackedWindow || trackedWindow.window.isDestroyed()) {
      createdWindows.delete(id)

      return {
        ok: false
      }
    }

    trackedWindow.window.close()
    createdWindows.delete(id)

    return {
      ok: true
    }
  })

  ipcMain.handle('created-window:exists', (_event, id: number) => {
    const trackedWindow = createdWindows.get(id)
    const exists = Boolean(trackedWindow && !trackedWindow.window.isDestroyed())

    if (!exists) {
      createdWindows.delete(id)
    }

    return {
      exists
    }
  })
}

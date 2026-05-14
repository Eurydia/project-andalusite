import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, session, shell, systemPreferences } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

async function requestCameraPermission(): Promise<void> {
  if (process.platform === 'darwin') {
    await systemPreferences.askForMediaAccess('camera')
  }
}

function enableMediaPermissions(): void {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (is.dev) return true

    return permission === 'media'
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (is.dev) {
      callback(true)
      return
    }

    callback(permission === 'media')
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  await requestCameraPermission()
  enableMediaPermissions()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

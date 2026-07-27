import { electronAPI } from "@electron-toolkit/preload";
import {
  type BrowserWindowConstructorOptions,
  contextBridge,
  ipcRenderer,
} from "electron";

try {
  contextBridge.exposeInMainWorld("electron", electronAPI);
  contextBridge.exposeInMainWorld("windowApi", {
    createWindow: (
      payload?: BrowserWindowConstructorOptions & {
        url?: string;
      },
    ) =>
      ipcRenderer.invoke("created-window:create", payload) as Promise<{
        id: number;
      }>,

    deleteWindow: (id: number) =>
      ipcRenderer.invoke("created-window:delete", id) as Promise<{
        ok: boolean;
      }>,

    windowExists: (id: number) =>
      ipcRenderer.invoke("created-window:exists", id) as Promise<{
        exists: boolean;
      }>,

    runPoseFrame: (payload: {
      rgba: Uint8ClampedArray;
      width: number;
      height: number;
    }) =>
      ipcRenderer.invoke("pose:run-frame", payload) as Promise<Array<{
        x: number;
        y: number;
        score: number;
      }> | null>,
  });
  contextBridge.exposeInMainWorld("persist", {
    get: <T>(key: string, fallbackValue?: T): Promise<T> =>
      ipcRenderer.invoke("persist:get", key, fallbackValue),

    set: <T>(key: string, value: T): Promise<T> =>
      ipcRenderer.invoke("persist:set", key, value),

    delete: (key: string): Promise<boolean> =>
      ipcRenderer.invoke("persist:delete", key),
  });
} catch (error) {
  console.error(error);
}

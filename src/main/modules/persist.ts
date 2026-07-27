import { app, ipcMain } from "electron";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { join } from "path";

type PersistStore = Record<string, unknown>;

let cache: PersistStore | null = null;

const getStoreDir = () => join(app.getPath("userData"), "app-data");
const getStorePath = () => join(getStoreDir(), "persist.json");
const getTempPath = () => join(getStoreDir(), "persist.tmp.json");

async function loadStore() {
  if (cache !== null) {
    return cache;
  }

  try {
    const raw = await readFile(getStorePath(), "utf8");
    cache = JSON.parse(raw) as PersistStore;
  } catch {
    cache = {};
  }

  return cache;
}

async function commitStore(store: PersistStore) {
  await mkdir(getStoreDir(), { recursive: true });

  await writeFile(getTempPath(), JSON.stringify(store, null, 2), "utf8");
  await rename(getTempPath(), getStorePath());
}

export function registerPersistIpc() {
  ipcMain.handle(
    "persist:get",
    async (_event, key: string, fallbackValue: unknown = null) => {
      const _key = key.trim().normalize();
      if (_key.length === 0) {
        return;
      }
      const store = await loadStore();
      return _key in store ? store[_key] : fallbackValue;
    },
  );

  ipcMain.handle("persist:set", async (_event, key: string, value: unknown) => {
    const _key = key.trim().normalize();
    if (_key.length === 0) {
      throw new Error("Invalid persist key");
    }

    const store = await loadStore();
    store[_key] = value;
    await commitStore(store);
    return value;
  });

  ipcMain.handle("persist:delete", async (_event, key: string) => {
    const _key = key.trim().normalize();
    if (typeof _key !== "string" || _key.length === 0) {
      throw new Error("Invalid persist key");
    }

    const store = await loadStore();
    delete store[_key];
    await commitStore(store);

    return true;
  });
}

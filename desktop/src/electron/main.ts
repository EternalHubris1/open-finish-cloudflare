import { app, BrowserWindow, ipcMain, net, shell } from "electron";
import path from "node:path";

const isDevelopment = !app.isPackaged;
const fallbackRemoteApiUrl =
  process.env.ETERNAL_DOJO_API_URL ??
  "https://open-finish-cloudflare.dgt-saunin.workers.dev";

function safeRemoteApiUrl(value: string): string {
  const url = new URL(value.trim());
  const localDevelopmentHost =
    isDevelopment && (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (url.protocol !== "https:" && !localDevelopmentHost) {
    throw new Error("Only HTTPS remote API URLs are allowed outside local development.");
  }

  return url.origin;
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: "#080d14",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const isInternal = isDevelopment
      ? url.startsWith("http://127.0.0.1:5173")
      : url.startsWith("file:");
    if (!isInternal) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (isDevelopment) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173");
  } else {
    await window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  ipcMain.handle("desktop:runtime-info", () => ({
    appVersion: app.getVersion(),
    defaultRemoteApiUrl: safeRemoteApiUrl(fallbackRemoteApiUrl),
  }));

  ipcMain.handle("desktop:probe-remote-api", async (_event, rawUrl: string) => {
    const remoteApiUrl = safeRemoteApiUrl(rawUrl);
    try {
      const response = await net.fetch(
        new URL("/api/auth/session", remoteApiUrl).toString(),
      );
      return {
        reachable: true,
        remoteApiUrl,
        status: response.status,
        authenticationRequired: response.status === 401 || response.status === 403,
      };
    } catch {
      return {
        reachable: false,
        remoteApiUrl,
        status: null,
        authenticationRequired: false,
      };
    }
  });

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

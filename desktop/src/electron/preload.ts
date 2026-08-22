import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("eternalDesktop", {
  getRuntimeInfo: () => ipcRenderer.invoke("desktop:runtime-info"),
  probeRemoteApi: (remoteApiUrl: string) =>
    ipcRenderer.invoke("desktop:probe-remote-api", remoteApiUrl),
});

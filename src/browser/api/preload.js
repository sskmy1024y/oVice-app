const { contextBridge, ipcRenderer } = require("electron");
const messages = require("./lib/messages.js");

contextBridge.exposeInMainWorld("electronAPI", {
  appEnd: () => ipcRenderer.send("app-end"),
  reload: () => ipcRenderer.send(messages.viewReload),
  restore: () => ipcRenderer.send(messages.restore),
  resetWindow: () => ipcRenderer.send(messages.resetWindow),
  handleAppReady: (callback) => ipcRenderer.on(messages.appReady, callback),
  handleMinimize: (callback) => ipcRenderer.on(messages.minimize, callback),
  getDisplayMedia: () => ipcRenderer.send(messages.requestDisplayMedia),
  setDisplayMedia: (callback) => ipcRenderer.on(messages.sendDisplayMedia),
  toggleMinimize: () => ipcRenderer.send(messages.toggleMinimize),
  togglePin: () => ipcRenderer.send(messages.togglePin),
});

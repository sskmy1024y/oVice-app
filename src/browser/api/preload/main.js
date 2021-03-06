const { contextBridge, ipcRenderer } = require("electron");
const messages = require("../lib/messages.js");

contextBridge.exposeInMainWorld("electronAPI", {
  appEnd: () => ipcRenderer.send("app-end"),
  reload: () => ipcRenderer.send(messages.viewReload),
  restore: () => ipcRenderer.send(messages.restore),
  resetWindow: () => ipcRenderer.send(messages.resetWindow),
  handleAppReady: (callback) => ipcRenderer.on(messages.appReady, callback),
  handleMinimize: (callback) => ipcRenderer.on(messages.minimize, callback),
  showPicker: () => ipcRenderer.send(messages.showPicker),
  handleSourceIdSelected: (callback) =>
    ipcRenderer.on(messages.sourceIdSelected, callback),
  changeWindowMode: () => ipcRenderer.send(messages.changeWindowMode),
  openLink: (url) => ipcRenderer.send(messages.openLink, url),
  handleMicButton: (callback) =>
    ipcRenderer.on(messages.pushMicButton, callback),
  handleAwayButton: (callback) =>
    ipcRenderer.on(messages.pushAwayButton, callback),

  /* for windows */
  windowsWindowMaximize: () => ipcRenderer.send(messages.windowsWindowMaximize),
  windowsWindowRestore: () => ipcRenderer.send(messages.windowsWindowRestore),
  windowsWindowMinimize: () => ipcRenderer.send(messages.windowsWindowMinimize),
  windowsWindowClose: () => ipcRenderer.send(messages.windowsWindowClose),
});

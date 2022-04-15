const { contextBridge, ipcRenderer } = require("electron");
const messages = require("../lib/messages.js");

contextBridge.exposeInMainWorld("electronAPI", {
  getSources: (callback) => ipcRenderer.on(messages.getSources, callback),
  sourceIdSelected: (id) => ipcRenderer.send(messages.sourceIdSelected, id),
});

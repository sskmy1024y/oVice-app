const { contextBridge, ipcRenderer } = require("electron");
const messages = require("../lib/messages.js");

contextBridge.exposeInMainWorld("electronAPI", {
  setRoomId: (roomId) => ipcRenderer.send(messages.setRoomId, roomId),
});

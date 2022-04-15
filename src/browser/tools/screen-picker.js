"use strict";

const { BrowserWindow, desktopCapturer } = require("electron");
const messages = require("../api/lib/messages");
const path = require("path");

const excludeWindowNames = ["StatusIndicator", "Electron Screen Selector"];

module.exports = {
  init: (window) => {
    const dialog = new BrowserWindow({
      parent: window,
      skipTaskbar: true,
      modal: true,
      show: false,
      height: 390,
      width: 680,
      webPreferences: {
        preload: path.join(__dirname, "/../api/preload/picker.js"),
      },
    });
    dialog.loadURL(
      "file://" + __dirname + "/../../renderer/screencapture/index.html"
    );
    this.dialog = dialog;
  },
  /**
   * @param {BrowserWindow} window
   */
  show: (window) => {
    const dialog = window.getChildWindows()[0];
    dialog.show();
    desktopCapturer
      .getSources({ types: ["window", "screen"] })
      .then((sources) => {
        const parsedSources = sources
          .filter((v) => !excludeWindowNames.includes(v.name))
          .map((v) => ({
            id: v.id,
            name: v.name,
            thumbnail: v.thumbnail.toDataURL(),
          }));
        dialog.webContents.send(messages.getSources, parsedSources);
      });
  },
};

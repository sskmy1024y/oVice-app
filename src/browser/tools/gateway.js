"use strict";

const { BrowserWindow } = require("electron");
const path = require("path");

module.exports = {
  open: (window) => {
    const dialog = new BrowserWindow({
      parent: window,
      skipTaskbar: true,
      modal: true,
      show: false,
      height: 390,
      width: 680,
      webPreferences: {
        preload: path.join(__dirname, "/../api/preload/gateway.js"),
      },
    });
    dialog
      .loadURL("file://" + __dirname + "/../../renderer/gateway/index.html")
      .then(function () {
        dialog.show();
      });
  },
};

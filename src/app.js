"use strict";

const { app, BrowserWindow, systemPreferences } = require("electron");
const Application = require("./browser/main.js");
const {
  minimize,
  restoreWindow,
  handleChangeDisplay,
  handleMoved,
  handleResized,
  quit,
  beforeQuit,
  checkUpdate,
} = require("./browser/window.js");

/**
 * @type {BrowserWindow}
 */
let window = null;

app.on("window-all-closed", function () {
  app.quit();
});

app.whenReady().then(function () {
  const application = new Application();
  window = application.start();
  registerWindowEvent();
  handleChangeDisplay();
});

app.on("activate", () => {
  checkUpdate(window);
  restoreWindow(window);
});

app.on("before-quit", function () {
  beforeQuit(window);
});

function registerWindowEvent() {
  window.webContents.on("did-finish-load", function () {
    this.send("app-ready");
    checkUpdate(window);
  });

  window.on("blur", function () {
    minimize(this);
  });

  window.on("moved", function () {
    handleMoved(this);
  });

  window.on("resized", function () {
    handleResized(this);
  });

  window.on("close", function (event) {
    quit(this, event);
  });
}

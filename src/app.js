"use strict";

const { app, BrowserWindow, systemPreferences } = require("electron");
const Application = require("./browser/main.js");
const {
  minimize,
  restoreWindow,
  handleChangeDisplay,
} = require("./browser/window.js");

/**
 * @type {BrowserWindow}
 */
let window = null;

const variables = {
  isAppQuitting: false,
};

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(function () {
  const application = new Application();
  window = application.start();
  registerWindowEvent();
  handleChangeDisplay();
});

app.on("activate", () => {
  restoreWindow(window);
});

app.on("before-quit", function () {
  variables.isAppQuitting = true;
});

function registerWindowEvent() {
  window.webContents.on("did-finish-load", function () {
    this.send("app-ready");
  });

  window.on("blur", function () {
    minimize(this);
  });

  window.on("close", function (event) {
    if (!variables.isAppQuitting) {
      minimize(this);
      event.preventDefault();
    } else {
      this.send("app-end");
    }
  });
}

"use strict";

const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const Application = require("./browser/main.js");
const { isWin } = require("./browser/utils/platform.js");
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

  if (isWin) {
    autoUpdater.checkForUpdatesAndNotify();
    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 1000 * 60 * 10);
  } else {
    checkUpdate(window);
  }
});

app.on("activate", () => {
  if (!isWin) {
    checkUpdate(window);
    restoreWindow(window);
  }
});

app.on("before-quit", function () {
  beforeQuit(window);
});

function registerWindowEvent() {
  window.webContents.on("did-finish-load", function () {
    this.send("app-ready");
  });

  window.on("blur", function () {
    if (!isWin) minimize(this);
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

autoUpdater.on("update-downloaded", ({ version, releaseDate }) => {
  const detail = `${app.getName()} ${version} ${releaseDate}`;

  dialog.showMessageBox(
    window, // new BrowserWindow
    {
      type: "question",
      buttons: ["再起動", "あとで"],
      defaultId: 0,
      cancelId: 999,
      message: "新しいバージョンをダウンロードしました。再起動しますか？",
      detail,
    },
    (res) => {
      if (res === 0) {
        autoUpdater.quitAndInstall();
      }
    }
  );
});

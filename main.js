'use strict';
 
// Electronのモジュール
const { app, BrowserWindow, webFrame } = require('electron')
const {handleChangeDisplay} = require("./src/screen")

const ipc = require('electron').ipcMain

const GLOBAL_VARIABLE = {
  /* Set a variable when the app is quitting. */
  isAppQuitting: false,
  isMinimize: false,
  size: {
    width: 800,
    height: 600
  },
  position: {
    x: 0,
    y: 0,
  },
  screen: {
    width: 0,
    height: 0
  }
}

const MINIMAM_WIDTH = 280
const MINIMAM_HEIGHT = 200

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: GLOBAL_VARIABLE.size.width,
    height: GLOBAL_VARIABLE.size.height,
    titleBarStyle: 'hidden'
  })
  mainWindow.setWindowButtonVisibility(true)

  mainWindow.loadURL('https://unipos.ovice.in/login');

  mainWindow.on('close', function (evt) {
    if (!GLOBAL_VARIABLE.isAppQuitting) {
      minimizeWindow(mainWindow);
      evt.preventDefault();
    }
  });

  mainWindow.on("blur", function () {
    minimizeWindow(mainWindow);
  });

  mainWindow.on("focus", function () {
    restoreWindow(mainWindow)
  });

  return mainWindow
}

/**
 * windowを最小化する
 * @param {BrowserWindow} window 
 */
async function minimizeWindow(window) {
  if (GLOBAL_VARIABLE.isMinimize) return

  /* save window size */
  const [width, height] = window.getSize()
  GLOBAL_VARIABLE.size.width = width
  GLOBAL_VARIABLE.size.height = height

  /* save window position */
  const [x, y] = window.getPosition()
  GLOBAL_VARIABLE.position.x = x
  GLOBAL_VARIABLE.position.y = y

  window.setSize(MINIMAM_WIDTH, MINIMAM_HEIGHT)
  window.setPosition(GLOBAL_VARIABLE.screen.width - MINIMAM_WIDTH, GLOBAL_VARIABLE.screen.height - MINIMAM_HEIGHT)
  window.setAlwaysOnTop(true, "screen-saver") // 常に最前面に表示する
  window.setVisibleOnAllWorkspaces(true) // ワークスペース変わっても表示する
  window.webContents.setZoomFactor(0.6)
  
  window.webContents.executeJavaScript(`
    const overlay = document.createElement("div")
    overlay.id = "draggable-overlay"
    overlay.style = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; -webkit-app-region: drag;"
    document.body.append(overlay)
  `)

  GLOBAL_VARIABLE.isMinimize = true
}

/**
 * windowを元に戻す
 * @param {BrowserWindow} window 
 */
 async function restoreWindow(window) {
  if (!GLOBAL_VARIABLE.isMinimize) return

  console.log(GLOBAL_VARIABLE.position.x, GLOBAL_VARIABLE.position.y)

  window.setSize(GLOBAL_VARIABLE.size.width, GLOBAL_VARIABLE.size.height, false)
  setTimeout(() => window.setPosition(GLOBAL_VARIABLE.position.x, GLOBAL_VARIABLE.position.y), 100)
  
  window.setAlwaysOnTop(false)
  window.setVisibleOnAllWorkspaces(false)

  window.webContents.setZoomFactor(1)
  window.webContents.executeJavaScript(`
    document.getElementById("draggable-overlay").remove()
  `)

  GLOBAL_VARIABLE.isMinimize = false
}

// アプリのquitを押した時に実行
app.on('before-quit', function (event) {
  GLOBAL_VARIABLE.isAppQuitting = true;
});
 
// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit()
});
 
// Electronの初期化完了後に実行
app.whenReady().then(() => {
  const { screen } = require('electron')
  handleChangeDisplay(screen, GLOBAL_VARIABLE)

  const window = createMainWindow()

  window.webContents.on('did-finish-load', function() {
    window.webContents.executeJavaScript(`
      var el = document.createElement("script");
      el.src = "file://${__dirname}/src/lib/index.js";
      document.body.appendChild(el);
    `)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    else restoreWindow(window)
  })

  screen.on("display-added", () => handleChangeDisplay(screen, GLOBAL_VARIABLE))
  screen.on("display-metrics-changed", () => handleChangeDisplay(screen, GLOBAL_VARIABLE))
  screen.on("display-removed", () => handleChangeDisplay(screen, GLOBAL_VARIABLE))
})

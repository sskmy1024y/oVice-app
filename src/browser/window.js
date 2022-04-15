"use strict";

const { BrowserWindow, BrowserView } = require("electron");
const path = require("path");
const messages = require("./api/lib/messages.js");

const CONSTANTS = {
  minimum: {
    width: 280,
    height: 200,
  },
  default: {
    width: 1000,
    height: 720,
  },
};

const variables = {
  state: {
    isScreenPicking: false,
  },
  setting: {
    minimize: true,
    pin: true,
  },
  size: {
    width: CONSTANTS.default.width,
    height: CONSTANTS.default.height,
  },
  position: {
    x: 0,
    y: 0,
  },
  screen: {
    width: 0,
    height: 0,
  },
};

function handleChangeDisplay() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  variables.screen.width = width;
  variables.screen.height = height;
}

/**
 * minimize window
 * @param {BrowserWindow} window
 */
function minimize(window) {
  if (!variables.setting.minimize || variables.state.isScreenPicking) return;

  /* save window size */
  const [width, height] = window.getSize();
  variables.size.width = width;
  variables.size.height = height;

  /* save window position */
  const [x, y] = window.getPosition();
  variables.position.x = x;
  variables.position.y = y;

  window.setSize(CONSTANTS.minimum.width, CONSTANTS.minimum.height);
  window.setPosition(
    variables.screen.width - CONSTANTS.minimum.width,
    variables.screen.height - CONSTANTS.minimum.height
  );
  window.setAlwaysOnTop(true, "screen-saver"); // 常に最前面に表示する
  window.setVisibleOnAllWorkspaces(true); // ワークスペース変わっても表示する

  window.webContents.send(messages.minimize);

  const view = window.getBrowserView();
  view.setBounds({
    x: 0,
    y: 0,
    width: CONSTANTS.minimum.width,
    height: CONSTANTS.minimum.height,
  });
  view.webContents.setZoomFactor(0.8);
  view.webContents.executeJavaScript(`
    var draggableOverlayId = "draggable-overlay"
    if (document.getElementById(draggableOverlayId)) document.getElementById(draggableOverlayId).remove()
    var overlay = document.createElement("div")
    overlay.id = draggableOverlayId
    overlay.style = "position: absolute; inset: 0; width: 99999px; height: 99999px; -webkit-app-region: drag; z-index: 5999;"
    overlay.addEventListener("dblclick", function () {
      window.electronAPI.restore()
    })
    document.body.append(overlay)
    
    if (document.getElementById("logo")) document.getElementById("logo").hidden = true
    if (document.getElementById("chat-button")) document.getElementById("chat-button").hidden = true
    if (document.getElementById("menu-icon")) document.getElementById("menu-icon").hidden = true
    if (document.getElementById("dynamic-objects-block")) document.getElementById("dynamic-objects-block").hidden = true
    if (document.querySelector("div[title='Minimap']")) document.querySelector("div[title='Minimap']").hidden = true
    document.querySelectorAll("#away .center div, #away .center p").forEach(el => el.hidden = true)
    if (document.getElementById("mic-block")) document.getElementById("mic-block").setAttribute("style", "transform: scale(1.6);")
    if (document.getElementById("away-block")) document.getElementById("away-block").setAttribute("style", "transform: scale(1.6);")
    if (document.getElementById("leave-openspace-block")) document.getElementById("leave-openspace-block").setAttribute("style", "transform: scale(1.6);")
    if (document.getElementById("menu-block")) document.getElementById("menu-block").setAttribute("style", "display: flex; width: 290px; bottom: 16px; right: 16px; justify-content: space-between")
    if (document.querySelector("#away .center button")) document.querySelector("#away .center button").setAttribute("style", "z-index: 6000; font-size: 30px;")
    `);
}

/**
 * restore window
 * @param {BrowserWindow} window
 * @param {boolean} reset
 */
function restoreWindow(window, reset = false) {
  const width = reset ? CONSTANTS.default.width : variables.size.width;
  const height = reset ? CONSTANTS.default.height : variables.size.height;
  const x = reset
    ? variables.screen.width / 2 - CONSTANTS.default.width / 2
    : variables.position.x;
  const y = reset
    ? variables.screen.height / 2 - CONSTANTS.default.height / 2
    : variables.position.y;

  window.setSize(width, height);
  setTimeout(() => window.setPosition(x, y), 100);

  window.setAlwaysOnTop(false);
  window.setVisibleOnAllWorkspaces(false);

  const view = window.getBrowserView();
  view.setBounds({
    x: 0,
    y: 40,
    width: width,
    height: height - 40,
  });
  view.webContents.setZoomFactor(1);
  view.webContents.executeJavaScript(`
    var draggableOverlayId = "draggable-overlay"
    if (document.getElementById(draggableOverlayId)) document.getElementById(draggableOverlayId).remove()

    if (document.getElementById("logo")) document.getElementById("logo").hidden = false
    if (document.getElementById("chat-button")) document.getElementById("chat-button").hidden = false
    if (document.getElementById("menu-icon")) document.getElementById("menu-icon").hidden = false
    if (document.getElementById("dynamic-objects-block")) document.getElementById("dynamic-objects-block").hidden = false
    if (document.querySelector("div[title='Minimap']")) document.querySelector("div[title='Minimap']").hidden = false
    document.querySelectorAll("#away .center div, #away .center p").forEach(el => el.hidden = false)
    if (document.getElementById("mic-block")) document.getElementById("mic-block").removeAttribute("style")
    if (document.getElementById("away-block")) document.getElementById("away-block").removeAttribute("style")
    if (document.getElementById("leave-openspace-block")) document.getElementById("leave-openspace-block").removeAttribute("style")
    if (document.getElementById("menu-block")) document.getElementById("menu-block").removeAttribute("style")
    if (document.querySelector("#away .center button")) document.querySelector("#away .center button").removeAttribute("style")
  `);
}

/**
 * toggle auto minimize
 * @param {BrowserWindow} window
 */
function toggleMinimize(window) {
  variables.setting.minimize = !variables.setting.minimize;

  if (variables.setting.minimize) {
    window.webContents.executeJavaScript(`
      document.getElementById("toggle-minimize").innerHTML = '<i class="fa-solid fa-window-maximize"></i>'
    `);
  } else {
    window.webContents.executeJavaScript(`
      document.getElementById("toggle-minimize").innerHTML = '<i class="fa-solid fa-minimize"></i>'
    `);
  }
}

/**
 * toggle pin
 * @param {BrowserWindow} window
 */
function togglePin(window) {
  variables.setting.pin = !variables.setting.pin;

  if (variables.setting.pin) {
    window.setAlwaysOnTop(true);
    window.setVisibleOnAllWorkspaces(true);
    window.webContents.executeJavaScript(`
      document.getElementById("toggle-pin").innerHTML = '<i class="fa-solid fa-spinner"></i>'
    `);
  } else {
    window.setAlwaysOnTop(false);
    window.setVisibleOnAllWorkspaces(false);
    window.webContents.executeJavaScript(`
      document.getElementById("toggle-pin").innerHTML = '<i class="fa-solid fa-thumbtack"></i>'
    `);
  }

  window.set;
}

/**
 * toggle screen picker
 * @param {BrowserWindow} window
 */
function handleOpenPicker(window) {
  variables.state.isScreenPicking = true;
}

/**
 * handle close screen picker
 * @param {BrowserWindow} window
 */
function handleSelectedScreenId(window, selectedId) {
  variables.state.isScreenPicking = false;

  const view = window.getBrowserView();
  view.webContents.send(messages.sourceIdSelected, selectedId);
}

module.exports = {
  open: function () {
    const window = new BrowserWindow({
      width: variables.size.width,
      height: variables.size.height,
      titleBarStyle: "hidden",
      trafficLightPosition: { x: 10, y: 12 },
      webPreferences: {
        preload: path.join(__dirname, "api/preload/main.js"),
      },
    });
    window.loadURL("file://" + __dirname + "/../renderer/browser/index.html");

    /** ====== open oVice page ======= */

    const view = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, "api/preload/main.js"),
      },
    });
    window.setBrowserView(view);

    const [width, height] = window.getSize();
    view.setAutoResize({ width: true, height: true });
    view.setBounds({ x: 0, y: 40, width, height: height - 40 });

    view.webContents.loadURL("https://unipos.ovice.in/login");

    view.webContents.executeJavaScript(`
      var captureSource = { id: null };
      async function getDisplayMedia() {
        const promise = new Promise((resolve) => {
          captureSource = new Proxy(
            captureSource,
            {
              set(obj, key, value) {
                console.log(value);
                resolve(value);
                return Reflect.set(...arguments);
              },
            }
          );
        });
      
        window.electronAPI.showPicker();
        const captureSourceId = await promise;
        delete captureSource
        captureSource = { id: null };
        return captureSourceId;
      }
      
      window.electronAPI.handleSourceIdSelected(function (event, id) {
        console.log(id);
        captureSource.id = id;
      });
      
      navigator.mediaDevices.getDisplayMedia = async () => {
        const captureSourceId = await getDisplayMedia();
        console.log(captureSourceId)
        
        // create MediaStream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: captureSourceId,
            },
          },
        });


        return stream;
      };
    `);

    view.webContents.openDevTools();

    return window;
  },
  minimize,
  restoreWindow,
  toggleMinimize,
  togglePin,
  handleOpenPicker,
  handleSelectedScreenId,
  handleChangeDisplay,
};

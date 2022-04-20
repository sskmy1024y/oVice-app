"use strict";

const {
  BrowserWindow,
  BrowserView,
  shell,
  Event,
  dialog,
} = require("electron");
const path = require("path");
const semver = require("semver");
const semverClean = require("semver/functions/clean");
const messages = require("./api/lib/messages.js");
const Store = require("electron-store");
const fetch = require("electron-fetch").default;
const store = new Store();
const { open: openModal } = require("./tools/gateway.js");
const {
  init: initPicker,
  show: showPicker,
} = require("./tools/screen-picker.js");
const { isWin } = require("./utils/platform.js");

const CONSTANTS = {
  window: {
    minimum: {
      width: 280,
      height: 200,
    },
    default: {
      width: 1000,
      height: 720,
    },
  },
};

const variables = {
  state: {
    isMinimized: false,
    isScreenPicking: false,
    isAppQuitting: false,
    isShowedUpdateAlert: false,
  },
  setting: {
    roomId: null,
    mode: "minimize",
    ...JSON.parse(store.get("setting", "{}")),
  },
  window: {
    default: {
      width: CONSTANTS.window.default.width,
      height: CONSTANTS.window.default.height,
      x: 0,
      y: 0,
      zoom: 1,
    },
    minimum: {
      width: CONSTANTS.window.minimum.width,
      height: CONSTANTS.window.minimum.height,
      x: null,
      y: null,
    },
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
 * @param {BrowserWindow} window
 */
function beforeQuit() {
  store.set("setting", JSON.stringify(variables.setting));
  variables.state.isAppQuitting = true;
}

/**
 * @param {BrowserWindow} window
 * @param {Event} event
 */
function quit(window, event) {
  if (variables.setting.mode === "minimize" && !variables.state.isAppQuitting) {
    event.preventDefault();
    minimize(window);
  } else {
    window.send("app-end");
  }
}

/**
 * handle resized window
 * @param {BrowserWindow} window
 */
function handleResized(window) {
  const [width, height] = window.getSize();

  if (variables.state.isMinimized) {
    variables.window.minimum.width = width;
    variables.window.minimum.height = height;
  } else {
    variables.window.default.width = width;
    variables.window.default.height = height;
  }
}

/**
 * handle moved window
 * @param {BrowserWindow} window
 */
function handleMoved(window) {
  const [x, y] = window.getPosition();

  if (variables.state.isMinimized) {
    variables.window.minimum.x = x;
    variables.window.minimum.y = y;
  } else {
    variables.window.default.x = x;
    variables.window.default.y = y;
  }
}

/**
 * minimize window
 * @param {BrowserWindow} window
 */
function minimize(window) {
  if (
    variables.setting.roomId === null ||
    variables.setting.mode !== "minimize" ||
    variables.state.isMinimized ||
    variables.state.isScreenPicking
  )
    return;
  variables.state.isMinimized = true;

  /* save window size */
  const [width, height] = window.getSize();
  variables.window.default.width = width;
  variables.window.default.height = height;

  /* save window position */
  const [x, y] = window.getPosition();
  variables.window.default.x = x;
  variables.window.default.y = y;

  window.setSize(
    variables.window.minimum.width,
    variables.window.minimum.height
  );

  const view = window.getBrowserView();

  variables.window.default.zoom = view.webContents.getZoomFactor();

  view.setBounds({
    x: 0,
    y: 0,
    width: variables.window.minimum.width,
    height: variables.window.minimum.height,
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

  window.setPosition(
    variables.window.minimum.x ||
      variables.screen.width - variables.window.minimum.width,
    variables.window.minimum.y ||
      variables.screen.height - variables.window.minimum.height
  );
  window.setAlwaysOnTop(true, "screen-saver"); // always display top
  window.setVisibleOnAllWorkspaces(true); // show all workspace
}

/**
 * restore window
 * @param {BrowserWindow} window
 * @param {boolean} reset
 */
function restoreWindow(window, reset = false) {
  if (variables.setting.roomId === null) return;

  const width = reset
    ? CONSTANTS.window.default.width
    : variables.window.default.width;
  const height = reset
    ? CONSTANTS.window.default.height
    : variables.window.default.height;
  const x = reset
    ? variables.screen.width / 2 - CONSTANTS.window.default.width / 2
    : variables.window.default.x;
  const y = reset
    ? variables.screen.height / 2 - CONSTANTS.window.default.height / 2
    : variables.window.default.y;

  variables.state.isMinimized = false;

  window.setSize(width, height);
  window.setPosition(x, y);

  window.setAlwaysOnTop(false);
  window.setVisibleOnAllWorkspaces(false);

  const view = window.getBrowserView();
  view.setBounds({
    x: 0,
    y: 40,
    width: width,
    height: height - 40,
  });
  view.webContents.setZoomFactor(variables.window.default.zoom);
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
 * @param {BrowserWindow} window
 * @param {string} mode "pinned" | "minimize" | "normal"
 */
function reflectWindowMode(window, mode) {
  variables.setting.mode = mode;

  if (mode === "pinned") {
    window.setAlwaysOnTop(true);
    window.setVisibleOnAllWorkspaces(true);
    window.webContents.executeJavaScript(`
      document.getElementById("window-mode").innerHTML = '<i class="fa-solid fa-thumbtack"></i>'
    `);
  } else {
    window.setAlwaysOnTop(false);
    window.setVisibleOnAllWorkspaces(false);

    if (mode === "normal") {
      window.webContents.executeJavaScript(`
        document.getElementById("window-mode").innerHTML = '<i class="fa-solid fa-window-maximize"></i>'
      `);
    } else {
      window.webContents.executeJavaScript(`
      document.getElementById("window-mode").innerHTML = '<i class="fa-solid fa-minimize"></i>'
    `);
    }
  }
}

/**
 * toggle auto minimize
 * @param {BrowserWindow} window
 */
function hanldeWindowMode(window) {
  const currentMode = variables.setting.mode; // "pinned" | "minimize" | "normal"

  const nextMode = isWin
    ? currentMode === "pinned"
      ? "normal"
      : "pinned"
    : currentMode === "minimize"
    ? "pinned"
    : currentMode === "pinned"
    ? "normal"
    : "minimize";

  reflectWindowMode(window, nextMode);
}

/**
 * toggle screen picker
 * @param {BrowserWindow} window
 */
function handleOpenPicker(window) {
  variables.state.isScreenPicking = true;
  showPicker(window);
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

/**
 *
 * @param {BrowserView.webContents} contents
 */
function injectCustomJS(contents) {
  contents.executeJavaScript(`
    var captureSource = { id: null };
    async function getDisplayMedia() {
      const promise = new Promise((resolve) => {
        captureSource = new Proxy(
          captureSource,
          {
            set(obj, key, value) {
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
    
    navigator.mediaDevices.getDisplayMedia = async () => {
      const captureSourceId = await getDisplayMedia();
      
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

    window.electronAPI.handleSourceIdSelected(function (event, id) {
      captureSource.id = id;
    });

    window.electronAPI.handleMicButton(function (event, boolean) {
      if (!document.querySelector("#mic-block>.bottom-menu-item.volumebar") || !document.querySelector("#openspace-mic")) return
      const currentStatus = document.querySelector("#openspace-mic").className.split(" ").includes("bar-device-on")
      if (currentStatus !== boolean) document.querySelector("#mic-block > .bottom-menu-item.volumebar").click()
    })

    window.electronAPI.handleAwayButton(function (event) {
      if (!document.querySelector("#away-block")) return
      document.querySelector("#away-block").click()
    })
  `);
}

/**
 * Open oVice page
 * @param {BrowserWindow} window
 * @param {string} roomId
 */
function openOVice(window, roomId) {
  variables.setting.roomId = roomId;

  /**
   * @type {BrowserView}
   */
  let view = window.getBrowserView();

  if (view === null) {
    view = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, "api/preload/main.js"),
      },
    });
    window.setBrowserView(view);

    view.webContents.on("new-window", function (event, url) {
      event.preventDefault();
      shell.openExternal(url);
    });

    view.webContents.openDevTools();

    view.webContents.on("did-finish-load", function (event) {
      injectCustomJS(this);

      if (isWin) {
        window.setThumbarButtons([
          {
            tooltip: "Mute",
            icon: path.join(__dirname, "/../assets/thumbar/mute.png"),
            click() {
              view.webContents.send(messages.pushMicButton, false);
            },
          },
          {
            tooltip: "Mic on",
            icon: path.join(__dirname, "/../assets/thumbar/mic.png"),
            click() {
              view.webContents.send(messages.pushMicButton, true);
            },
          },
          {
            tooltip: "Away",
            icon: path.join(__dirname, "/../assets/thumbar/coffee.png"),
            click() {
              view.webContents.send(messages.pushAwayButton);
            },
          },
        ]);
      }
    });
  }

  const [width, height] = window.getSize();
  view.setAutoResize({ width: true, height: true });
  view.setBounds({ x: 0, y: 40, width, height: height - 40 });

  view.webContents.loadURL(`https://${roomId}.ovice.in/login`);

  reflectWindowMode(window, variables.setting.mode);

  initPicker(window);
}

/**
 * Reset all settings
 * @param {BrowserWindow} window
 */
function resetAllSetting(window) {
  let top = window.getParentWindow();
  if (top === null) top = window;

  restoreWindow(top, true);
  variables.setting = {
    roomId: null,
    mode: "minimize",
  };
  variables.state = {
    isMinimized: false,
    isScreenPicking: false,
  };
  store.clear();

  const children = top.getChildWindows();
  if (children.length > 0) {
    children.forEach((w) => w.close());
  }
  const view = top.getBrowserView();
  top.removeBrowserView(view);
  openModal(top);
}

/**
 * check update for github release
 * @param {BrowserWindow} window
 */
async function checkUpdate(window) {
  const result = await fetch(
    "https://api.github.com/repos/sskmy1024y/oVice-app/releases/latest"
  ).then(async (res) => await res.json());

  const latest = semverClean(result.tag_name);
  const current = process.env.npm_package_version;

  if (semver.lt(current, latest)) {
    const res = await dialog.showMessageBox({
      title: "Released new update",
      message: "Please download new version application",
      type: "info",
    });

    shell.openExternal("https://github.com/sskmy1024y/oVice-app/releases");
    variables.state.isShowedUpdateAlert = true;
  }
}

module.exports = {
  init: function () {
    const window = new BrowserWindow({
      width: CONSTANTS.window.default.width,
      height: CONSTANTS.window.default.height,
      titleBarStyle: "hidden",
      trafficLightPosition: { x: 10, y: 12 },
      webPreferences: {
        preload: path.join(__dirname, "api/preload/main.js"),
      },
    });
    window.loadURL("file://" + __dirname + "/../renderer/browser/index.html");

    if (variables.setting.roomId === null) {
      openModal(window);
    } else {
      openOVice(window, variables.setting.roomId);
    }

    return window;
  },
  checkUpdate,
  openOVice,
  minimize,
  beforeQuit,
  quit,
  restoreWindow,
  handleResized,
  handleMoved,
  hanldeWindowMode,
  handleOpenPicker,
  handleSelectedScreenId,
  handleChangeDisplay,
  resetAllSetting,
};

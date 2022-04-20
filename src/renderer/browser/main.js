"use strict";

let isWindows = false;

const ua = window.navigator.userAgent.toLowerCase();
if (ua.indexOf("windows nt") !== -1) {
  isWindows = true;
} else if (ua.indexOf("android") !== -1) {
} else if (ua.indexOf("iphone") !== -1 || ua.indexOf("ipad") !== -1) {
} else if (ua.indexOf("mac os x") !== -1) {
}

function Application(id) {
  document.getElementById("window-mode").onclick = this.changeWindowMode;
}

Application.prototype.reload = function () {
  window.electronAPI.reload();
};
Application.prototype.restore = function () {
  window.electronAPI.restore();
};
Application.prototype.toggleStick = function () {
  this.browser.sticky = !this.browser.sticky;
  if (this.browser.sticky) {
    mainApp.stick();
  } else {
    mainApp.unstick();
  }
};
Application.prototype.changeWindowMode = function () {
  window.electronAPI.changeWindowMode();
};

// for windows
Application.prototype.windowsWindowMaximize = function () {
  window.electronAPI.windowsWindowMaximize();
  document.getElementById("windows-restore").hidden = false;
  document.getElementById("windows-maximize").hidden = true;
};
Application.prototype.windowsWindowRestore = function () {
  window.electronAPI.windowsWindowRestore();
  document.getElementById("windows-maximize").hidden = false;
  document.getElementById("windows-restore").hidden = true;
};
Application.prototype.windowsWindowMinimize = function () {
  window.electronAPI.windowsWindowMinimize();
};
Application.prototype.windowsWindowClose = function () {
  window.electronAPI.windowsWindowClose();
};

function prepareWindows() {
  const draggable = document.querySelector(".draggable").cloneNode();
  document.querySelector(".draggable").remove();
  document
    .getElementById("header")
    .insertBefore(draggable, document.getElementById("toolbar").nextSibling);

  const buttons = document.createElement("div");
  buttons.id = "windows-buttons";
  buttons.className = "buttons";
  buttons.innerHTML = `
    <button class="minimize" id="windows-minimize" title="Minimize" type="button">
        <i class="fa-solid fa-window-minimize"></i>
    </button>
    <button class="restore" id="windows-restore" title="Restore" type="button" hidden>
    <i class="fa-regular fa-window-restore"></i>
    </button>
    <button class="maximum" id="windows-maximize" title="Maximum" type="button">
        <i class="fa-solid fa-square"></i>
    </button>
    <button class="close" id="windows-close" title="Close" type="button">
        <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  document.getElementById("header").appendChild(buttons);

  document.getElementById("windows-minimize").onclick =
    app.windowsWindowMinimize;
  document.getElementById("windows-restore").onclick = app.windowsWindowRestore;
  document.getElementById("windows-maximize").onclick =
    app.windowsWindowMaximize;
  document.getElementById("windows-close").onclick = app.windowsWindowClose;
}

var app = null;
window.electronAPI.handleAppReady(function () {
  app = new Application("toolbar");

  if (isWindows) {
    prepareWindows();
  }
});

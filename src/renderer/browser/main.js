"use strict";


function Application(id) {
  // document.getElementById("reload").onclick = this.reload;
  // document.getElementById("restore-size").onclick = this.restore;
  document.getElementById("window-mode").onclick = this.changeWindowMode;
}

Application.prototype.reload = function () {
  window.electronAPI.reload();
};
Application.prototype.restore = function () {
  window.electronAPI.restore();
};
Application.prototype.openDevTools = function () {
  this.webview.openDevTools();
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

var app = null;
window.electronAPI.handleAppReady(function () {
  app = new Application("toolbar");
});

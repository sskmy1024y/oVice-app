"use strict";

const { ipcMain, desktopCapturer, Menu } = require("electron");
const messages = require("./api/lib/messages.js");
const {
  restoreWindow,
  resetWindow,
  toggleMinimize,
  togglePin,
} = require("./window.js");

function Application() {
  this.listeners = [
    [messages.viewReload, this.reload],
    [messages.restore, this.restore],
    [messages.resetWindow, this.resetWindow],
    [messages.requestDisplayMedia, this.requestDisplayMedia],
    [messages.toggleMinimize, this.toggleMinimize],
    [messages.togglePin, this.togglePin],
  ];
}
Application.prototype = {
  start: function () {
    this.init();
    const window = require("./window.js");
    return window.open();
  },
  init: function () {
    var self = this;
    var listeners = this.listeners;
    listeners.map(function ([message, func]) {
      ipcMain.on(message, function (event, obj) {
        // this, eventEmitter, event
        func.call(
          self,
          {
            emitter: this,
            event: event,
          },
          obj
        );
      });
    });
  },
  reload: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    const view = window.getBrowserView();
    view.webContents.reload();
  },
  restore: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    restoreWindow(window);
  },
  resetWindow: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    resetWindow(window);
  },
  toggleMinimize: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    toggleMinimize(window);
  },
  togglePin: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    togglePin(window);
  },
  requestDisplayMedia: function (event) {
    (async () => {
      const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"],
      });

      const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => {
          return {
            label: source.name,
            click: () => selectSource(source),
          };
        })
      );

      videoOptionsMenu.popup();
    })();
  },
};

module.exports = Application;

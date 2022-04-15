"use strict";

const { ipcMain, shell, BrowserWindow } = require("electron");
const { init: initPicker, show: showPicker } = require("./screen-picker.js");
const messages = require("./api/lib/messages.js");
const {
  restoreWindow,
  handleSelectedScreenId,
  handleOpenPicker,
  hanldeWindowMode,
} = require("./window.js");

function Application() {
  /**
   * @type {ScreenPicker}
   */
  this.listeners = [
    [messages.viewReload, this.reload],
    [messages.restore, this.restore],
    [messages.resetWindow, this.resetWindow],
    [messages.showPicker, this.showPicker],
    [messages.sourceIdSelected, this.sourceIdSelected],
    [messages.changeWindowMode, this.changeWindowMode],
  ];
}
Application.prototype = {
  start: function () {
    this.init();
    const window = require("./window.js").open();
    initPicker(window);
    return window;
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
    restoreWindow(window, true);
  },
  changeWindowMode: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    hanldeWindowMode(window);
  },
  showPicker: function (event) {
    const window = event.event.sender.getOwnerBrowserWindow();
    handleOpenPicker(window);
    showPicker(window);
  },
  sourceIdSelected: function (event, id) {
    /**
     * @type {BrowserWindow}
     */
    const dialog = event.event.sender.getOwnerBrowserWindow();
    const window = dialog.getParentWindow();
    handleSelectedScreenId(window, id);
    dialog.hide();
  },
  openLink: function (event, url) {
    shell.openExternal(url);
  },
};

module.exports = Application;

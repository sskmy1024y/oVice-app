/**
 * @param {Electron.Screen} screen 
 */
function handleChangeDisplay(screen, GLOBAL_VARIABLE) {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  GLOBAL_VARIABLE.screen.width = width
  GLOBAL_VARIABLE.screen.height = height
}

module.exports = {handleChangeDisplay}

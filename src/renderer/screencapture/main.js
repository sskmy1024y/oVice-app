document.onkeydown = function (evt) {
  evt = evt || window.event;
  // Press esc key.
  if (evt.keyCode === 27) {
    ipcRenderer.send("source-id-selected", null);
  }
};

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
  const template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

window.electronAPI.getSources(function (event, sources) {
  const sourcesList = document.querySelector(".capturer-list");
  sources.forEach((source) => {
    const thumb = source.thumbnail;
    const title = source.name.slice(0, 20);
    const item = `<button><img src="${thumb}"><span>${title}</span></button>`;
    const element = htmlToElement(item);
    element.onclick = (e) => {
      e.preventDefault();
      window.electronAPI.sourceIdSelected(source.id);
      sourcesList.innerHTML = "";
    };
    sourcesList.appendChild(element);
  });
});

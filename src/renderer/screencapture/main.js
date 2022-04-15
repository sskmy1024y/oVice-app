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
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

window.electronAPI.getSources(function (event, sources) {
  let sourcesList = document.querySelector(".capturer-list");
  for (let source of sources) {
    let thumb = source.thumbnail;
    let title = source.name.slice(0, 20);
    let item = `<li><a href="#"><img src="${thumb}"><span>${title}</span></a></li>`;
    sourcesList.appendChild(htmlToElement(item));
  }
  let links = sourcesList.querySelectorAll("a");
  for (let i = 0; i < links.length; ++i) {
    let closure = (i) => {
      return (e) => {
        e.preventDefault();
        window.electronAPI.sourceIdSelected(sources[i].id);
        sourcesList.innerHTML = "";
      };
    };
    links[i].onclick = closure(i);
  }
});

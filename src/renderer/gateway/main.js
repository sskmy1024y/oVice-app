window.onload = function (event) {
  document
    .getElementById("room-id-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const id = document.getElementById("roomId").value;

      if (id === "") return;

      window.electronAPI.setRoomId(id);
    });
};

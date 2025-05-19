const buttons = document.querySelectorAll(".vidBtn");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const video = button.closest(".video").querySelector("video");

    if (video.paused) {
      video.play();
      button.textContent = "Pause";
    } else {
      video.pause();
      button.textContent = "Play";
    }
  });
});

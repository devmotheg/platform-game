const theme = new Audio("./assets/sounds/theme.mp3");
theme.loop = true;
export const sounds = {
  collect() {
    return new Audio("./assets/sounds/collect.mp3").play();
  },
  jump() {
    return new Audio("./assets/sounds/jump.mp3").play();
  },
  theme(action) {
    if (action === "play") {
      theme.currentTime = 0;
      theme.play();
    } else if (action === "pause") theme.pause();
  },
};

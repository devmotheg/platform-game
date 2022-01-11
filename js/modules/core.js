/*!
 * @author Mohamed Muntasir
 * @link https://github.com/devmotheg
 */

import { Level, State } from "./system.js";
import { displayWinScreen } from "../app.js";
import { $lives } from "./canvas-display.js";

const eventHandlers = [];
const rejections = [];

const trackKeys = keys => {
  const down = {};

  const track = event => {
    if (keys.includes(event.key)) {
      down[event.key] = event.type === "keydown";
      event.preventDefault();
    }
  };

  addEventListener("keydown", track);
  eventHandlers.push(["keydown", track]);
  addEventListener("keyup", track);
  eventHandlers.push(["keyup", track]);
  return down;
};

const runAnimation = frameFunc => {
  let lastTime = null;

  const frame = time => {
    if (lastTime) {
      const timeStep = Math.min(time - lastTime, 100) / 1000;
      if (!frameFunc(timeStep)) return false;
    }
    lastTime = time;
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

export const clearHandlers = _ => {
  while (eventHandlers.length) {
    const [type, func] = eventHandlers.pop();
    removeEventListener(type, func);
  }
};

export const clearGames = _ => {
  const $gameWin = document.querySelector(".game__win");
  if ($gameWin) $gameWin.remove();
  const $games = document.querySelectorAll(".game");
  for (const game of $games) game.remove();
  while (rejections.length) rejections.pop()();
};

const togglePauseScreen = (display, paused) => {
  const width = display.$canvas.width,
    height = display.$canvas.height;
  const ctx = display.ctx;
  if (paused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "rgb(241, 229, 89)";
    ctx.fillText("PAUSED", width / 2 - 60, height / 2 + 15);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
};

const updateLives = (display, newLives) => {
  for (let i = 0; i < newLives; i++)
    display.ctx.drawImage(
      $lives,
      0,
      0,
      20,
      20,
      i * 60 + 5,
      5,
      display.scale,
      display.scale
    );
};

const updateCoins = (level, display) => {
  const offset = level.totalCoins.toString().length < 2 ? 95 : 110;
  display.ctx.font = "bold 30px sans-serif";
  display.ctx.fillStyle = "rgb(241, 229, 89)";
  display.ctx.fillText(
    `${level.collectedCoins} of ${level.totalCoins}`,
    display.$canvas.width - offset,
    35
  );
};

const runLevel = (level, Display, lives) => {
  clearHandlers();
  const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);
  clearGames();

  const display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1,
    paused;
  return new Promise((resolve, reject) => {
    rejections.push(reject);

    const animate = _ => {
      runAnimation(time => {
        state = state.update(time, arrowKeys);
        if (paused) {
          togglePauseScreen(display, paused);
          return false;
        } else {
          display.syncState(state);
          updateLives(display, lives);
          updateCoins(level, display);
        }
        if (state.status === "playing") {
          return true;
        } else if (ending > 0) {
          ending -= time;
          return true;
        } else {
          display.clear();
          resolve(state.status);
          return false;
        }
      });
    };

    const pauseHandler = event => {
      if (event.key === "Escape") {
        if (paused) {
          paused = false;
          animate();
        } else paused = true;
      }
    };

    addEventListener("keydown", pauseHandler);
    eventHandlers.push(["keydown", pauseHandler]);

    animate();
  });
};

export async function runGame(plans, Display, startIdx) {
  let lives = 3;
  for (let level = startIdx; level < plans.length;) {
    try {
      const status = await runLevel(new Level(plans[level]), Display, lives);
      if (status === "won") {
        level++;
        Math.max(++lives, 7);
      } else if (--lives === 0) {
        if (--level < 0) level = 0;
        lives = 3;
      }
    } catch (_) {
      break;
    }
  }
  displayWinScreen();
}

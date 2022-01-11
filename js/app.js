/*!
 * @author Mohamed Muntasir
 * @link https://github.com/devmotheg
 */

import { GAME_LEVELS } from "./data/game-levels.js";
import { Level, State } from "./modules/system.js";
import { loadingSprites, CanvasDisplay } from "./modules/canvas-display.js";
import { runGame, clearHandlers, clearGames } from "./modules/core.js";
import { sounds } from "./data/sounds.js";

const $menuSelection = document.querySelector(".menu__selection"),
  $levels = document.querySelector(".levels");

export const displayWinScreen = _ => {
  if ($menuSelection.innerHTML !== "") return;
  clearHandlers();
  clearGames();
  const $gameWin = document.createElement("p");
  $gameWin.className = "game__win";
  $gameWin.innerHTML =
    "Your unmatched perspicacity,<br />coupled with your sheer indefatigability,<br />combine to make you a feared opponent<br />in any realm of human endeavor.";
  document.body.appendChild($gameWin);
};

(async _ => {
  await loadingSprites();

  const startNewLevel = i => {
    clearHandlers();
    clearGames();
    runGame(GAME_LEVELS, CanvasDisplay, i);
    sounds.theme("play");
  };

  const displayLevels = _ => {
    sounds.theme("pause");
    clearHandlers();
    clearGames();
    for (let i = 0; i < GAME_LEVELS.length; i++) {
      const level = new Level(GAME_LEVELS[i]);
      const cnv = new CanvasDisplay($menuSelection, level, 25, 200, 200);
      cnv.$canvas.addEventListener("click", _ => startNewLevel(i));
      const state = State.start(level);
      cnv.syncState(state);

      const width = cnv.$canvas.width,
        height = cnv.$canvas.height;
      cnv.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      cnv.ctx.fillRect(0, 0, width, height);
      cnv.ctx.font = "bold 30px sans-serif";
      cnv.ctx.fillStyle = "rgb(241, 229, 89)";
      cnv.ctx.fillText(`LEVEL ${i + 1}`, width / 2 - 60, height / 2 + 15);
    }
  };

  displayLevels();
  $levels.addEventListener("click", _ => displayLevels());
})();

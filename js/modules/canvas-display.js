/*!
 * @author Mohamed Muntasir
 * @link https://github.com/devmotheg
 */

const $backgroundSprites = document.createElement("img");
$backgroundSprites.src = "./assets/images/background-sprites.png";
const $playerSprites = document.createElement("img");
$playerSprites.src = "./assets/images/player-sprites.png";
const $monsterSprites = document.createElement("img");
$monsterSprites.src = "./assets/images/monster-sprites.png";
export const $lives = document.createElement("img");
$lives.src = "./assets/images/lives.png";

const backgroundLoading = _ =>
  new Promise(resolve => $backgroundSprites.addEventListener("load", resolve));

const playerLoading = _ =>
  new Promise(resolve => $playerSprites.addEventListener("load", resolve));

const monsterLoading = _ =>
  new Promise(resolve => $monsterSprites.addEventListener("load", resolve));

const livesLoading = _ =>
  new Promise(resolve => $lives.addEventListener("load", resolve));

export const loadingSprites = async _ => {
  await backgroundLoading();
  await playerLoading();
  await monsterLoading();
  await livesLoading();
};

export class CanvasDisplay {
  constructor(parent, level, scale = 50, maxW = 1006, maxH = 506) {
    this.scale = scale;
    this.$canvas = document.createElement("canvas");
    this.$canvas.className = "game";
    this.$canvas.width = Math.min(maxW, level.width * scale);
    this.$canvas.height = Math.min(maxH, level.height * scale);
    parent.appendChild(this.$canvas);
    this.ctx = this.$canvas.getContext("2d");
    this.viewport = {
      left: 0,
      top: 0,
      width: this.$canvas.width / scale,
      height: this.$canvas.height / scale,
    };
  }

  clear() {
    this.$canvas.remove();
  }
}

CanvasDisplay.prototype.syncState = function (state) {
  this.updateViewport(state);
  this.clearDisplay(state.status);
  this.drawBackground(state.level);
  this.drawActors(state.actors);
};

CanvasDisplay.prototype.updateViewport = function (state) {
  const view = this.viewport;
  const wMargin = view.width / 3,
    hMargin = view.height / 3;
  const center = state.player.pos.plus(state.player.size.times(0.5));
  if (center.x < view.left + wMargin)
    view.left = Math.max(center.x - wMargin, 0);
  else if (center.x > view.left + view.width - wMargin)
    view.left = Math.min(
      center.x + wMargin - view.width,
      state.level.width - view.width
    );
  if (center.y < view.top + hMargin) view.top = Math.max(center.y - hMargin, 0);
  else if (center.y > view.top + view.height - hMargin)
    view.top = Math.min(
      center.y + hMargin - view.height,
      state.level.height - view.height
    );
};

CanvasDisplay.prototype.clearDisplay = function (status) {
  if (status === "won") this.ctx.fillStyle = "rgb(68, 191, 255)";
  else if (status === "lost") this.ctx.fillStyle = "rgb(44, 136, 214)";
  else this.ctx.fillStyle = "rgb(52, 166, 251)";
  this.ctx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
};

CanvasDisplay.prototype.drawBackground = function (level) {
  const { left, top, width, height } = this.viewport;
  const xStart = Math.floor(left),
    xEnd = Math.ceil(left + width);
  const yStart = Math.floor(top),
    yEnd = Math.ceil(top + height);
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const tile = level.rows[y][x];
      if (tile === "empty") continue;
      const screenX = (x - left) * this.scale,
        screenY = (y - top) * this.scale;
      const tileX = tile === "lava" ? 20 : 0;
      this.ctx.drawImage(
        $backgroundSprites,
        tileX + 0.3,
        0,
        19,
        20,
        screenX,
        screenY,
        this.scale,
        this.scale
      );
    }
  }
};

const flipHorizontally = (context, around) => {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
};

CanvasDisplay.prototype.drawSpecial = function (
  actor,
  x,
  y,
  width,
  height,
  img
) {
  width += (this.scale / 3) * 2;
  x -= this.scale / 3;

  if (actor.speed.x != 0) actor.flipped = actor.speed.x < 0;

  let tile = 8;
  if (actor.speed.y !== 0) tile = 9;
  else if (actor.speed.x !== 0) tile = Math.floor(Date.now() / 60) % 8;

  this.ctx.save();
  if (actor.flipped) flipHorizontally(this.ctx, x + width / 2);
  const tileX = tile * 24;
  this.ctx.drawImage(
    img,
    tileX,
    0,
    width / (this.scale / 16),
    height / (this.scale / 20),
    x,
    y,
    width,
    height
  );
  this.ctx.restore();
};

CanvasDisplay.prototype.drawActors = function (actors) {
  for (const actor of actors) {
    const width = actor.size.x * this.scale,
      height = actor.size.y * this.scale;
    let x = (actor.pos.x - this.viewport.left) * this.scale,
      y = (actor.pos.y - this.viewport.top) * this.scale;
    if (actor.type === "player") {
      this.drawSpecial(actor, x, y, width, height, $playerSprites);
    } else if (actor.type === "monster") {
      this.drawSpecial(actor, x, y, width, height, $monsterSprites);
    } else {
      const tileX = actor.type === "coin" ? 40 : 20;
      this.ctx.drawImage(
        $backgroundSprites,
        tileX + 0.3,
        0,
        width / (this.scale / 19),
        height / (this.scale / 20),
        x,
        y,
        width,
        height
      );
    }
  }
};

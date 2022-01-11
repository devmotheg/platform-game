/*!
 * @author Mohamed Muntasir
 * @link https://github.com/devmotheg
 */

import { Vec, Player, Lava, Coin, Monster } from "../modules/entities.js";

export const LEVEL_CHARS = {
  ".": "empty",
  "#": "wall",
  "+": "lava",
  "@": Player,
  "=": Lava,
  "|": Lava,
  v: Lava,
  $: Coin,
  m: Monster,
};

const overlap = (actor1, actor2) => {
  return (
    actor1.pos.x + actor1.size.x >= actor2.pos.x &&
    actor2.pos.x + actor2.size.x >= actor1.pos.x &&
    actor1.pos.y + actor1.size.y >= actor2.pos.y &&
    actor2.pos.y + actor2.size.y >= actor1.pos.y
  );
};

export class Level {
  constructor(plan) {
    this.collectedCoins = 0;
    this.totalCoins = 0;
    const rows = plan
      .trim()
      .split("\n")
      .map(l => [...l.replace(/\s/g, "")]);
    this.height = rows.length;
    this.width = rows[0].length;
    this.startActors = [];
    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        const type = LEVEL_CHARS[ch];
        if (typeof type === "string") return type;
        const actor = type.create(new Vec(x, y), ch);
        if (actor.type === "coin") this.totalCoins++;
        this.startActors.push(actor);
        return "empty";
      });
    });
  }
}

Level.prototype.touches = function (pos, size, type) {
  const xStart = Math.floor(pos.x),
    xEnd = Math.ceil(pos.x + size.x);
  const yStart = Math.floor(pos.y),
    yEnd = Math.ceil(pos.y + size.y);
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
      const here = isOutside ? "wall" : this.rows[y][x];
      if (here === type) return { y, x };
    }
  }
  return false;
};

export class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  static start(level) {
    return new State(level, level.startActors, "playing");
  }

  get player() {
    return this.actors.find(a => a.type === "player");
  }
}

State.prototype.update = function (time, keys) {
  const actors = this.actors.map(a => a.update(time, this, keys));
  let newState = new State(this.level, actors, this.status);
  if (newState.status !== "playing") return newState;
  const player = newState.player;
  if (this.level.touches(player.pos, player.size, "lava"))
    return new State(this.level, actors, "lost");
  for (const actor of actors)
    if (actor !== player && overlap(actor, player))
      newState = actor.collide(newState);
  return newState;
};

/*!
 * @author Mohamed Muntasir
 * @link https://github.com/devmotheg
 */

import { State } from "./system.js";
import { sounds } from "../data/sounds.js";

const GRAVITY = 30;

export class Vec {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	plus(other) {
		return new Vec(this.x + other.x, this.y + other.y);
	}

	times(factor) {
		return new Vec(this.x * factor, this.y * factor);
	}
}

const move = (type, actor, pos, time, level, speed, dir) => {
	let touched;
	if (type === "horizontal") {
		let xSpeed = dir ? speed : dir === false ? -speed : 0;
		const movedX = pos.plus(new Vec(xSpeed * time, 0));
		if (!(touched = level.touches(movedX, actor.size, "wall"))) pos = movedX;
		else {
			if (touched.x > pos.x) pos.x += touched.x - pos.x - actor.size.x;
			else pos.x -= pos.x - (touched.x + 1);
		}
		return { pos, xSpeed };
	} else if (type === "vertical") {
		let ySpeed = actor.speed.y + GRAVITY * time;
		const movedY = pos.plus(new Vec(0, ySpeed * time));
		if (!(touched = level.touches(movedY, actor.size, "wall"))) pos = movedY;
		else if (dir && ySpeed > 0) {
			ySpeed = -speed;
			if (actor.type === "player") sounds.jump();
		} else {
			ySpeed = 0;
			if (touched.y < pos.y) pos.y -= pos.y - (touched.y + 1);
		}
		return { pos, ySpeed };
	}
};

export class Player {
	constructor(pos, speed, flipped = false) {
		this.pos = pos;
		this.speed = speed;
		this.flipped = flipped;
	}

	get type() {
		return "player";
	}

	get walkSpeed() {
		return 7;
	}

	get jumpSpeed() {
		return 17;
	}

	static create(pos) {
		return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
	}
}

Player.prototype.size = new Vec(0.8, 1.5);

Player.prototype.update = function (time, state, keys) {
	let dir;
	if (keys.ArrowLeft) dir = false;
	if (keys.ArrowRight) dir = true;
	var { pos, xSpeed } = move(
		"horizontal",
		this,
		this.pos,
		time,
		state.level,
		this.walkSpeed,
		dir
	);
	dir = keys.ArrowUp;
	var { pos, ySpeed } = move(
		"vertical",
		this,
		pos,
		time,
		state.level,
		this.jumpSpeed,
		dir
	);
	return new Player(pos, new Vec(xSpeed, ySpeed), this.flipped);
};

export class Lava {
	constructor(pos, speed, reset = null) {
		this.pos = pos;
		this.speed = speed;
		this.reset = reset;
	}

	get type() {
		return "lava";
	}

	static create(pos, ch) {
		if (ch === "=") return new Lava(pos, new Vec(4, 0));
		else if (ch === "|") return new Lava(pos, new Vec(0, 4));
		else if (ch === "v") return new Lava(pos, new Vec(0, 5), pos);
	}
}

Lava.prototype.size = new Vec(1, 1);

Lava.prototype.update = function (time, state) {
	const newPos = this.pos.plus(this.speed.times(time));
	if (!state.level.touches(newPos, this.size, "wall"))
		return new Lava(newPos, this.speed, this.reset);
	else if (this.reset) return new Lava(this.reset, this.speed, this.reset);
	else return new Lava(this.pos, this.speed.times(-1));
};

Lava.prototype.collide = function (state) {
	return new State(state.level, state.actors, "lost");
};

export class Coin {
	constructor(pos, basePos, wobble) {
		this.pos = pos;
		this.basePos = basePos;
		this.wobble = wobble;
	}

	get type() {
		return "coin";
	}

	get wobbleSpeed() {
		return 8;
	}

	get wobbleDist() {
		return 0.07;
	}

	static create(pos) {
		const basePos = pos.plus(new Vec(0.2, 0.1));
		return new Coin(basePos, basePos, Math.random() * Math.PI * 2);
	}
}

Coin.prototype.size = new Vec(0.6, 0.6);

Coin.prototype.update = function (time) {
	const wobble = this.wobble + this.wobbleSpeed * time,
		wobblePos = Math.sin(wobble) * this.wobbleDist;
	return new Coin(
		this.basePos.plus(new Vec(0, wobblePos)),
		this.basePos,
		wobble
	);
};

Coin.prototype.collide = function (state) {
	sounds.collect();
	const filtered = state.actors.filter(a => a !== this);
	let status = state.status;
	if (++state.level.collectedCoins === state.level.totalCoins) status = "won";
	return new State(state.level, filtered, status);
};

export class Monster {
	constructor(pos, speed, flipped = false) {
		this.pos = pos;
		this.speed = speed;
		this.flipped = flipped;
	}

	get type() {
		return "monster";
	}

	get walkSpeed() {
		return 5;
	}

	get jumpSpeed() {
		return 15;
	}

	static create(pos) {
		return new Monster(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
	}
}

Monster.prototype.size = new Vec(0.8, 1.5);

Monster.prototype.update = function (time, state) {
	const dist = new Vec(
		state.player.pos.x - this.pos.x,
		state.player.pos.y - this.pos.y
	);
	const canSpot =
		Math.abs(dist.x) < 10 &&
		Math.abs(dist.x) > 0.5 &&
		dist.y > -5 &&
		dist.y < 4;
	let dir, blocked;
	if (canSpot) dir = dist.x > 0;
	var { pos, xSpeed } = move(
		"horizontal",
		this,
		this.pos,
		time,
		state.level,
		this.walkSpeed,
		dir
	);
	for (let y = Math.floor(pos.y), x = Math.floor(pos.x); y > pos.y - 2; y--)
		if (y < 0 || state.level.rows[y][x] === "wall") blocked = true;
	dir = !blocked && canSpot && dist.y < 0;
	var { pos, ySpeed } = move(
		"vertical",
		this,
		pos,
		time,
		state.level,
		this.jumpSpeed,
		dir
	);
	return new Monster(pos, new Vec(xSpeed, ySpeed), this.flipped);
};

Monster.prototype.collide = function (state) {
	const playerBottom = state.player.pos.y + state.player.size.y;
	if (Math.abs(playerBottom - this.pos.y) <= 0.6) {
		const filtered = state.actors.filter(a => a !== this);
		return new State(state.level, filtered, state.status);
	}
	return new State(state.level, state.actors, "lost");
};

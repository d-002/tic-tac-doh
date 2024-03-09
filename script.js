let canvas, ctx, H;
let game;
let gamesPlayed = 0;
let fps = 10;
let deep = 6; // /2 turns ahead
let interval;

let settings = [NaN, NaN, NaN, NaN]; // size, pieces, required, AI level
let gameValues = [[3, 5, 3], [3, 3, 3], [4, 8, 4], [4, 4, 4], [8, 32, 4], [8, 6, 4]];
let comments = [
	["Classic Tic tac toe game, 3x3 grid. Place pieces and line 3 in a row (horizontally, vertically or digonally) to win, while blocking your opponent!",
	"First 3 rounds you place pieces, then you will have to move your pieces around to line them up. To move a piece, first click on it to select it, then click on a free, adjacent cell (to the right, left, up, down, or diagonally). This way there's no way you tie, and it's much more challenging and fun!",
	"Classic Tic tac toe, but you need to line 4 in a row in this 4x4 grid!",
	"Line 4 in a row in this 4x4 grid, but you can also move pieces! (refer to <strong>\"You can move pieces around\"</strong> for more information)",
	"GIANT 8x8 GRID!!! You only need to line 4 pieces in a row, so you're free to go anywhere! <span class=\"error\">Lisa is not (yet) playable in this gamemode!</span>",
	"Only for the grandmasters among you, since this 8x8 grid requires you to move your pieces around and line 4 in a row! You get 6 pieces. <span class=\"error\">Lisa is not (yet) playable in this gamemode!</span>"],
	["You are playing against drunk Homer Simpson. He is so drunk he confuses his pieces and yours, so there's almost <strong>no way</strong> he wins!",
	"You are playing against Homer Simpson. He doesn't really know how to play, and places kinda randomly because he's too busy eating doughnuts at the same time.",
	"You are playing against Mr. Burns. He doesn't care about winning, he doesn't care about playing or enjoying the game, all he wants is to prevent you from winning. Try to outsmart him!",
	"You are playing against Bart Simpson. He plays like an average human being, trying to win and to prevent you from doing the same. You can do this!",
	"You are playing against Lisa Simpson. She has studied every possible strategy, and will never lose! She plans multiple turns ahead, and knows everything you are planning... At least try to tie!"]
];

class Game {
	constructor(p1, p2, size, maxPieces, required, aiStarts) {
		if (aiStarts) this.players = [p2, p1];
		else this.players = [p1, p2];
		this.players[0].id = 1; // /!\ 1-based
		this.players[1].id = 2;

		this.size = size;
		this.maxPieces = maxPieces;
		this.required = required; // in a row to win

		this.board = [];
		for (let y = 0; y < size; y++) {
			let line = [];
			for (let x = 0; x < size; x++) line.push(0);
			this.board.push(line);
		}

		this.turnId = 1;
		this.turnCount = 0;
	}

	areLinked(a, b) {
		// check if two positions can be points in a piece movement
		let [y1, x1] = a;
		let [y2, x2] = b;
		return (x1 != x2 || y1 != y2) && Math.abs(x1-x2) < 2 && Math.abs(y1-y2) < 2;
	}

	win(board) {
		// check horizontal and vertical
		for (let i = 0; i < this.size; i++) {
			let prev = [-1, -1];
			let count = [0, 0];
			for (let j = 0; j < this.size; j++)
				for (let k = 0; k < 2; k++) {
					let v = k == 0 ? board[i][j] : board[j][i];
					if (v == prev[k]) count[k]++;
					else count[k] = 1;
					prev[k] = v;
					if (v != 0 && count[k] == this.required) return v;
				}
		}

		// check diagonals
		for (let i = 0; i <= this.size-this.required; i++) {
			let prev = [-1, -1, -1, -1];
			let count = [0, 0, 0, 0];
			for (let j = 0; j < this.size-i; j++) {
				for (let k = 0; k < 4; k++) {
					let x = (k & 1) ? j : i+j;
					let y = (k & 1) ? i+j : j;
					x = k < 2 ? x : this.size-x-1;

					let v = board[y][x];
					if (v == prev[k]) count[k]++;
					else count[k] = 1;
					prev[k] = v;
					if (v != 0 && count[k] == this.required) return v;
				}
			}
		}

		for (let x = 0; x < this.size; x++) for (let y = 0; y < this.size; y++) if (board[y][x] == 0) return 0;
		return -1; // draw
	}

	update() {
		if (this.players[this.turnId-1].play()) {
			this.turnId = 3-this.turnId;
			if (this.turnId == 1) this.turnCount++;
		}

		let w = this.win(this.board);
		if (w != 0) {
			console.log(w);
			newGame();
		}

		this.draw();
	}

	draw() {
		ctx.clearRect(0, 0, H, H);
		let step = H/this.size;

		// lines between squares
		ctx.strokeStyle = "#aaa";
		ctx.lineWidth = 4;
		let offset = Math.max(29 - 3*this.size, 2);
		for (let i = 1; i < this.size; i++) {
			let d = parseInt(i*step);
			ctx.beginPath();
			ctx.moveTo(d, offset);
			ctx.lineTo(d, H-offset);
			ctx.moveTo(offset, d);
			ctx.lineTo(H-offset, d);
			ctx.stroke();
		}

		// pieces
		ctx.strokeStyle = "rgba(1, 1, 1, 0)";
		for (let x = 0; x < this.size; x++) for (let y = 0; y < this.size; y++) {
			let selection = this.players[this.turnId-1].selection;
			if (selection != null && eq([x, y], selection)) {
				// show selection
				ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
				ctx.fillRect(parseInt(x*step), parseInt(y*step), parseInt(step), parseInt(step));
			}

			let i = this.board[y][x]-1;
			if (i == -1) continue;
			ctx.fillStyle = ["#00f", "#f00"][this.players[i].image];
			ctx.beginPath();
			ctx.arc(parseInt((x+0.5) * step), parseInt((y+0.5) * step), step/2.5, 0, 2*Math.PI);
			ctx.fill();
		}
	}
}

class Player {
	constructor() {
		this.image = 0;
		this.pos = null; // will be non-null when async event clicked
	}

	click(evt) {
		let rect = canvas.getBoundingClientRect();
		let x = evt.x-rect.x, y = evt.y-rect.y;
		if (0 <= x && x < H && 0 <= y && y < H) {
			x = parseInt(x*game.size/H);
			y = parseInt(y*game.size/H);
			this.pos = [x, y];
		}
	}

	play() {
		if (this.pos == null) return false;
		let [x, y] = this.pos;
		this.pos = null;
		if (game.turnCount < game.maxPieces) {
			if (game.board[y][x] == 0) {
				game.board[y][x] = this.id;
				return true;
			}
		}
		else {
			if (game.board[y][x] == this.id) this.selection = [x, y]; // set selection
			else if (game.board[y][x] == 0 && this.selection != null && game.areLinked(this.selection, [x, y])) {
				game.board[this.selection[1]][this.selection[0]] = 0;
				game.board[y][x] = this.id;
				this.selection = null;
				return true;
			}
		}

		return false;
	}
}

class Ai {
	constructor() {
		this.image = 1;
		this.selection = null;
	}

	play() {
		return true;
	}

	click() { }
}

class HumanAi extends Ai {
	constructor(tryWin, tryNoLose) {
		super();
		this.tryWin = tryWin;
		this.tryNoLose = tryNoLose;
	}

	play() {
		let empty = [];
		for (let x = 0; x < game.size; x++) for (let y = 0; y < game.size; y++) if (game.board[y][x] == 0) empty.push([x, y]);
		if (game.turnCount < game.maxPieces) {
			for (let i = 0; i < empty.length; i++) {
				let [x, y] = empty[i];
				if (this.tryWin) {
					game.board[y][x] = this.id;
					if (game.win(game.board) != 0) return true; // try to win
				}
				if (this.tryNoLose) {
					game.board[y][x] = 3-this.id;
					if (game.win(game.board) != 0) {
						game.board[y][x] = this.id;
						return true; // try to cancel
					}
				}
				game.board[y][x] = 0;
			}
			// otherwise play randomly
			let [x, y] = empty[parseInt(Math.random()*empty.length)];
			game.board[y][x] = this.id;
		}
		else {
			// get possible destinations from owned pieces
			let mine = [];
			for (let x = 0; x < game.size; x++) for (let y = 0; y < game.size; y++) if (game.board[y][x] == this.id) mine.push([x, y]);
			let possible = [];
			let loses = []; // indices where it loses (don't do that, except if forced to)
			for (let i = 0; i < mine.length; i++) {
				let [x1, y1] = mine[i];

				// don't leave a position where the player could go and win
				let couldLose = false;
				for (let x = 0; x < game.size; x++) for (let y = 0; y < game.size; y++) if (!eq([x, y], [x1, y1]) && game.board[y][x] == 3-this.id && game.areLinked([x1, y1], [x, y])) {
					game.board[y1][x1] = 3-this.id;
					game.board[y][x] = 0;
					if (game.win(game.board)) couldLose = true;
					game.board[y][x] = 3-this.id;
					game.board[y1][x1] = this.id;
					if (couldLose) break;
				}

				// find all positions linked to the current piece
				let linked = [];
				for (let x2 = 0; x2 < game.size; x2++) for (let y2 = 0; y2 < game.size; y2++) if (game.board[y2][x2] == 0 && game.areLinked([x1, y1], [x2, y2])) {
					linked.push([x2, y2]);
				}
				if (linked.length) {
					if (couldLose) loses.push(possible.length);
					possible.push([[x1, y1], linked]);
				}
			}

			for (let i = 0; i < possible.length; i++) {
				if (loses.includes(i)) continue; // would lose by moving this piece
				let [a, linked] = possible[i];
				let [x1, y1] = a;
				game.board[y1][x1] = 0;
				for (let j = 0; j < linked.length; j++) {
					let [x2, y2] = linked[j];
					if (this.tryWin) {
						game.board[y2][x2] = this.id;
						if (game.win(game.board) != 0) return true;
					}
					if (this.tryNoLose) {
						// check if a player's piece could move here
						for (let x = 0; x < game.size; x++) for (let y = 0; y < game.size; y++) if (!eq([x, y], [x2, y2]) && game.board[y][x] == 3-this.id && game.areLinked([x2, y2], [x, y])) {
							game.board[y][x] = 0;
							game.board[y2][x2] = 3-this.id;
							if (game.win(game.board)) {
								game.board[y][x] = 3-this.id;
								game.board[y2][x2] = this.id;
								game.board[y1][x1] = 0;
								return true;
							}
							game.board[y][x] = 3-this.id;
						}
						game.board[y2][x2] = 0;
					}
					game.board[y2][x2] = 0;
				}
				game.board[y1][x1] = this.id;
			}

			// otherwise play randomly, but don't do a losing action
			let newP = [];
			for (let i = 0; i < possible.length; i++) if (!loses.includes(i)) newP.push(possible[i]);
			if (newP.length == 0) newP = possible; // every action is a loss, so pick a random one
			let [pos, linked] = newP[parseInt(Math.random()*newP.length)];
			let [x1, y1] = pos;
			let [x2, y2] = linked[parseInt(Math.random()*linked.length)];
			game.board[y1][x1] = 0;
			game.board[y2][x2] = this.id;
		}
		return true;
	}
}

class MinimaxAi extends Ai {
	constructor(invert, size) {
		super();
		this.deep = size < 4 ? 8 : 4;
		this.invert = invert;
	}

	score(win, deep) {
		if (win < 1) return 0;
		return win == this.id ? 20-deep : deep-20;
	}

	minimax(board, deep, id, turn) {
		// stop when game ended or too deep
		let w = game.win(board);
		if (w != 0 || deep == 0) {
			let score = this.score(w, deep);
			return [score, score > 0 ? 1 : score < 0 ? -1 : 0];
		}

		// get simulated turn count
		if (deep < this.deep && id == 1) turn++;

		let scores = [];
		let winning = 0; // outcomes where the AI wins - outcomes where it loses
		let total = 0;
		// first phase: place pieces
		if (turn < game.maxPieces) {
			// get possible placements
			let empty = [];
			for (let x = 0; x < game.size; x++) for (let y = 0; y < game.size; y++) if (board[y][x] == 0) empty.push([x, y]);

			empty.forEach(pos => {
				let board2 = [];
				for (let y1 = 0; y1 < game.size; y1++) {
					let line = [];
					for (let x1 = 0; x1 < game.size; x1++) line.push(eq(pos, [x1, y1]) ? id : board[y1][x1]);
					board2.push(line);
				}
				let [score, ratio] = this.minimax(board2, deep-1, 3-id, turn);
				scores.push([score, ratio, pos]);
				winning += ratio;
				total++;
			});
		}
		// second phase: move pieces around
		else {
			// get possible destinations from owned pawns
			let mine = [];
			for (let y = 0; y < game.size; y++) for (let x = 0; x < game.size; x++) if (board[y][x] == id) mine.push([x, y]);

			let possible = [];
			mine.forEach(pos => {
				let linked = [];
				for (let x2 = 0; x2 < game.size; x2++) for (let y2 = 0; y2 < game.size; y2++) if (board[y2][x2] == 0 && game.areLinked(pos, [x2, y2])) {
					linked.push([x2, y2]);
				}
				if (linked.length) possible.push([pos, linked]);
			});

			possible.forEach(([a, linked]) => {
				linked.forEach(b => {
					let board2 = [];
					for (let y = 0; y < game.size; y++) {
						let line = [];
						for (let x = 0; x < game.size; x++) line.push(eq([x, y], a) ? 0 : eq([x, y], b) ? id : board[y][x]);
						board2.push(line);
					}
					let [score, ratio] = this.minimax(board2, deep-1, 3-id, turn);
					scores.push([score, ratio, [a, b]]);
					winning += ratio;
					total++;
				});
			});
		}

		let chosen = (id == this.id) ^ this.invert ? max(scores) : min(scores);

		// set winning ratio to average when selecting player moves, or best for AI moves
		let ratio = id == this.id ? chosen[1] : total == 0 ? 0 : winning/total;

		// return movement at the end, or score and ratio for recursive calls
		if (deep == this.deep) return chosen[2];
		return [chosen[0], ratio];
	}

	play() {
		let newB = [];
		game.board.forEach(line => {newB.push([...line])});
		let [a, b] = this.minimax(newB, this.deep, this.id, game.turnCount);
		if (game.turnCount < game.maxPieces) game.board[b][a] = this.id;
		else {
			game.board[a[1]][a[0]] = 0;
			game.board[b[1]][b[0]] = this.id;
		}
		return true;
	}
}

function max(scores) {
	let best = [0];
	for (let j = 1; j < scores.length; j++) {
		let a = scores[j], b = scores[best[0]];
		if (a[0] > b[0] || (a[0] == b[0] && a[1] > b[1])) best = [j];
		else if (eq(a, b)) best.push(j); // eq only tests for the first 2 elements
	}
	return scores[best[parseInt(Math.random()*best.length)]];
}

function min(scores) {
	let best = [0];
	for (let j = 1; j < scores.length; j++) {
		let a = scores[j], b = scores[best[0]];
		if (a[0] < b[0] || (a[0] == b[0] && a[1] < b[1])) best = [j];
		else if (eq(a, b)) best.push(j);
	}
	return scores[best[parseInt(Math.random()*best.length)]];
}

function eq(l1, l2) {
	return l1[0] == l2[0] && l1[1] == l2[1];
	/* if (l1.length != l2.length) return false;
	for (let i = 0; i < l1.length; i++) if (l1[i] != l2[i]) return false;
	return true; */
}

function getSettings() {
	// update settings
	let [s0, s1] = document.getElementsByTagName("select");
	v0 = parseInt(s0.value);
	v1 = parseInt(s1.value);
	settings = [...gameValues[v0], v1];
	if (v0 > 3 && v1 == 4) {
		settings[3] = 3;
		v1 = 3;
		s1.value = 3;
	}

	// change text in html
	let [t0, t1] = document.getElementsByClassName("comment");
	t0.innerHTML = comments[0][v0];
	t1.innerHTML = comments[1][v1];
}

function newGame(start) {
	if (start) {
		getSettings();
		gamesPlayed = 0;
	}

	let player, ai;
	player = new Player();
	switch (settings[3]) {
		case 0: ai = new MinimaxAi(true, settings[0]); break;
		case 1: ai = new HumanAi(false, false); break;
		case 2: ai = new HumanAi(false, true); break;
		case 3: ai = new HumanAi(true, true); break;
		case 4: ai = new MinimaxAi(false, settings[0]);
	}

	game = new Game(player, ai, settings[0], settings[1], settings[2], gamesPlayed++ & 1);

	if (interval != null) window.clearInterval(interval);
	interval = window.setInterval(() => {game.update()}, 1000/fps);
}

function init() {
	canvas = document.getElementById("canvas");
	H = canvas.parentNode.getBoundingClientRect().height-40;
	canvas.setAttribute("width", H);
	canvas.setAttribute("height", H);

	ctx = canvas.getContext("2d");

	getSettings();
	newGame(true);
	window.addEventListener("click", evt => {game.players.forEach(p => p.click(evt))});
}

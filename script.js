let ctx, H;
let game;
let deep = 6; // /2 turns ahead

class Game {
	constructor(p1, p2, maxPieces, size, required, turnId) {
		this.p1 = p1;
		this.p2 = p2;
		this.size = size;
		this.maxPieces = maxPieces;
		this.required = required; // in a row to win

		this.board = [];
		for (let y = 0; y < size; y++) {
			let line = [];
			for (let x = 0; x < size; x++) line.push(0);
			this.board.push(line);
		}

		this.turnId = turnId;
		this.over = false;
	}

	areLinked(i1, i2) {
		// check if two indices can be points in a piece movement
		let [y1, x1] = divmod(i1, this.size);
		let [y2, x2] = divmod(i2, this.size);
		return Math.abs(x1-x2) < 2 && Math.abs(y1-y2) < 2;
	}

	win(board) {
		// check horizontal and vertical
		for (let i = 0; i < this.size; i++) {
			let prevX = -1, prevY = -1;
			let countX = 0, countY = 0;
			for (let j = 0; j < this.size; j++) {
				let v = board[i][j];
				if (v == prevX) countX++;
				else countX = 0;
				prevX = v;
				if (v != 0 && countX == this.required) return v;

				v = board[j][i];
				if (v == prevY) countY++;
				else countY = 0;
				prevY = v;
				if (v != 0 && countY == this.required) return v;
			}
		}

		// check diagonals
		for (let i = 0; i <= this.size-this.required; i++) {
			let prevA = -1, prevB = -1;
			let countA = 0, countB = 0;
			for (let j = 0; j < this.size-i; j++) {

			}
		}
	}
}

class Player {
}

class HumanAi {
	constructor(tryWin, tryNoLose) {
		this.tryWin = tryWin;
		this.tryNoLose = tryNoLose;
	}
}

class MinimaxAi {
	constructor(invert) {
		this.invert = invert;
	}
}

function copyBoard(board) {
	let newB = [];
	board.forEach(line => {newB.push([...line])});
	return newB;
}

function divmod(a, b) {
	// a and b are positive
	return [parseInt(a/b), a%b];
}

function apply() {
	newGame(true);
}

function newGame(start) {
	let player, ai;
	player = new Player();
	ai = new HumanAi(false, false);
	game = new Game(player, ai, 3, 3, 3, start ? 0 : 1-game.turn);
}

function init() {
	let canvas = document.getElementById("canvas");
	H = canvas.parentNode.getBoundingClientRect().height-40;
	canvas.setAttribute("width", H);
	canvas.setAttribute("height", H);

	ctx = canvas.getContext("2d");

	newGame(true);
}

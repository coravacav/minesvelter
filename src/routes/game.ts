import { writable } from 'svelte/store';

export type Cell = { value: number; revealed: boolean; flagged: boolean; x: number; y: number };

export type GameState = {
	width: number;
	height: number;
	board: Cell[][];
	game_state: 'none' | 'playing' | 'won' | 'lost';
};

// -1 will be a mine
const game_store = writable<GameState>({ width: 32, height: 18, board: [[]], game_state: 'none' });

function reset_board() {
	game_store.update((game) => {
		const board = game.board;
		const height = game.height;
		const width = game.width;

		for (let x = 0; x < height; x++) {
			for (let y = 0; y < width; y++) {
                board[x][y].flagged = false;
				board[x][y].revealed = false;
			}
		}

		return { ...game, board };
	});
}

function create_board() {
	game_store.update((game) => {
		const board = game.board;
		const height = game.height;
		const width = game.width;

		for (let x = 0; x < height; x++) {
			board[x] = [];
			for (let y = 0; y < width; y++) {
				board[x][y] = { value: 0, revealed: false, flagged: false, x, y };
			}
		}

		return { ...game, board };
	});
}

function populate_board_with_mines(percentage: number) {
	game_store.update((game) => {
		const board = game.board;
		const height = game.height;
		const width = game.width;

		const total = height * width;
		const mines = Math.floor(total * percentage);
		for (let i = 0; i < mines; i++) {
			const x = Math.floor(Math.random() * height);
			const y = Math.floor(Math.random() * width);

			if (board[x][y].value === -1) {
				i--;
				continue;
			}

			board[x][y].value = -1;
		}

		// calculate all the right numbers after placing all the mines
		for (let x = 0; x < height; x++) {
			for (let y = 0; y < width; y++) {
				let board_value = board[x][y].value;

				if (board_value === -1) continue;

				if (board[x - 1]?.[y - 1]?.value === -1) board_value++;
				if (board[x - 1]?.[y]?.value === -1) board_value++;
				if (board[x - 1]?.[y + 1]?.value === -1) board_value++;
				if (board[x]?.[y - 1]?.value === -1) board_value++;
				if (board[x]?.[y + 1]?.value === -1) board_value++;
				if (board[x + 1]?.[y - 1]?.value === -1) board_value++;
				if (board[x + 1]?.[y]?.value === -1) board_value++;
				if (board[x + 1]?.[y + 1]?.value === -1) board_value++;

				board[x][y].value = board_value;
			}
		}

		return { ...game, board };
	});
}

function reveal(cell: Cell) {
	game_store.update((game) => {
		const board = game.board;
		const x = cell.x;
		const y = cell.y;

		if (board[x][y].revealed) return game;
		if (board[x][y].flagged) return game;

		board[x][y].revealed = true;

		if (board[x][y].value === -1) {
			return { ...game, game_state: 'lost' };
		}

		return { ...game, board };
	});
}

function flag(cell: Cell) {
	game_store.update((game) => {
		const board = game.board;
		const x = cell.x;
		const y = cell.y;

		if (board[x][y].revealed) return game;

		board[x][y].flagged = !board[x][y].flagged;

		return { ...game, board };
	});
}

// Make sure this wonderful side effect only runs once
let handled_game_end = false;

// Handle everything if lost or won
game_store.subscribe((game) => {
	if (game.game_state === 'none' || game.game_state === 'playing') handled_game_end = false;
	if (handled_game_end) return;

	if (game.game_state === 'lost' || game.game_state === 'won') {
		// reveal everything
		game.board.forEach((row) => {
			row.forEach((cell) => {
				cell.revealed = true;
			});
		});
	}
});

export const game = {
	subscribe: game_store.subscribe,
	create_board,
	populate_board_with_mines,
	reveal,
	flag,
    reset_board,
};

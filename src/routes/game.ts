import { writable } from 'svelte/store';

export type Cell = { value: number; revealed: boolean; flagged: boolean; x: number; y: number };

export type GameState = {
	width: number;
	height: number;
	board: Cell[][];
	game_state: 'none' | 'won' | 'lost';
};

// -1 will be a mine
const game_store = writable<GameState>({ width: 3, height: 5, board: [[]], game_state: 'none' });

function gen_surrounding_indexes(x: number, y: number) {
	const surrounding: [number, number][] = [];

	surrounding.push([x - 1, y - 1]);
	surrounding.push([x - 1, y]);
	surrounding.push([x - 1, y + 1]);
	surrounding.push([x, y - 1]);
	surrounding.push([x, y + 1]);
	surrounding.push([x + 1, y - 1]);
	surrounding.push([x + 1, y]);
	surrounding.push([x + 1, y + 1]);

	return surrounding;
}

function gen_surrounding(board: Cell[][], xi: number, yi: number) {
	const surrounding: Cell[] = [];

	for (const [x, y] of gen_surrounding_indexes(xi, yi)) {
		if (board[x]?.[y]) surrounding.push(board[x][y]);
	}

	return surrounding;
}

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

		return { ...game, board, game_state: 'none' };
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

				for (const cell of gen_surrounding(board, x, y)) {
					if (cell.value === -1) board_value++;
				}

				board[x][y].value = board_value;
			}
		}

		return { ...game, board };
	});
}

function should_check(board: Cell[][], x: number, y: number) {
	if (board[x]?.[y]?.value === -1) return false;
	if (board[x]?.[y]?.revealed) return false;
	if (board[x]?.[y]?.flagged) return false;
	return true;
}

// check if every bomb has been flagged, or every non-bomb has been revealed
function has_won(board: Cell[][]) {
    let unflagged_mines = false;
    let unrevealed_cells = false;

	for (const row of board) {
		for (const cell of row) {
            if (unflagged_mines && unrevealed_cells) return false;
            if (cell.value === -1 && !cell.flagged) unflagged_mines = true;
            if (cell.value !== -1 && !cell.revealed) unrevealed_cells = true; 
		}
	}

    if (unrevealed_cells) return false;

	return true;
}

function reveal_impl(board: Cell[][], xi: number, yi: number) {
	if (!board[xi]?.[yi]) return;

	board[xi][yi].revealed = true;

	if (board[xi][yi].value === 0) {
		for (const [x, y] of gen_surrounding_indexes(xi, yi)) {
			if (should_check(board, x, y)) reveal_impl(board, x, y);
		}
	}
}

function reveal(cell: Cell) {
	game_store.update((game) => {
		const board = game.board;
		const x = cell.x;
		const y = cell.y;

		if (board[x][y].revealed) {
			if (board[x][y].value > 0) {
				// count the flags around
				let flags = 0;
				let hit_a_mine = false;

				for (const cell of gen_surrounding(board, x, y)) {
					if (cell.flagged) flags++;
					else if (cell.value === -1) hit_a_mine = true;
				}

				if (flags === board[x][y].value) {
					if (hit_a_mine) return { ...game, game_state: 'lost' };

					for (const [xi, yi] of gen_surrounding_indexes(x, y)) {
						if (should_check(board, xi, yi)) reveal_impl(board, xi, yi);
					}
				}
			}

			return game;
		}

		if (board[x][y].flagged) return game;

		if (board[x][y].value === -1) {
			return { ...game, game_state: 'lost' };
		}

		reveal_impl(board, x, y);

        if (has_won(board)) return { ...game, game_state: 'won' };

		return { ...game, board };
	});
}

function flag(cell: Cell) {
	game_store.update((game) => {
        if (game.game_state === 'lost' || game.game_state === 'won') return game;

		const board = game.board;
		const x = cell.x;
		const y = cell.y;

		if (board[x][y].revealed) return game;

		board[x][y].flagged = !board[x][y].flagged;

        if (has_won(board)) return { ...game, game_state: 'won' };

		return { ...game, board };
	});
}

// Make sure this wonderful side effect only runs once
let handled_game_end = false;

// Handle everything if lost or won
game_store.subscribe((game) => {
	if (game.game_state === 'none') handled_game_end = false;
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

import type { Writable } from 'svelte/store';

export type Cell = { value: number; revealed: boolean; flagged: boolean; x: number; y: number };

export type GameState = {
    width: number;
    height: number;
    board: Cell[][];
    game_state: 'none' | 'won' | 'lost';
    percentage: number;
};

function should_check(board: Cell[][], x: number, y: number) {
    const v = board[x]?.[y];
    if (!v) return false;
    if (v.value === -1) return false;
    if (v.revealed) return false;
    if (v.flagged) return false;
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

function reveal_impl(board: Cell[][], x: number, y: number) {
    if (!board[x]?.[y]) return;

    board[x][y].revealed = true;

    if (board[x][y].value === 0) {
        if (should_check(board, x - 1, y - 1)) reveal_impl(board, x - 1, y - 1);
        if (should_check(board, x - 1, y)) reveal_impl(board, x - 1, y);
        if (should_check(board, x - 1, y + 1)) reveal_impl(board, x - 1, y + 1);
        if (should_check(board, x, y - 1)) reveal_impl(board, x, y - 1);
        if (should_check(board, x, y + 1)) reveal_impl(board, x, y + 1);
        if (should_check(board, x + 1, y - 1)) reveal_impl(board, x + 1, y - 1);
        if (should_check(board, x + 1, y)) reveal_impl(board, x + 1, y);
        if (should_check(board, x + 1, y + 1)) reveal_impl(board, x + 1, y + 1);
    }
}

function impl_populate_board_with_mines(game: GameState) {
    game.board = [];
    game.game_state = 'none';
    const board = game.board;
    const height = game.height;
    const width = game.width;
    const percentage = game.percentage;

    for (let x = 0; x < height; x++) {
        board[x] = [];
        for (let y = 0; y < width; y++) {
            board[x][y] = {
                value: Math.random() < percentage ? -1 : 0,
                revealed: false,
                flagged: false,
                x,
                y,
            };
        }
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

    return game;
}

export const game_attach = (game_store: Writable<GameState>) => ({
    populate_board_with_mines() {
        game_store.update((game) => {
            return impl_populate_board_with_mines(game);
        });
    },
    flag(cell: Cell) {
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
    },
    reveal(cell: Cell) {
        game_store.update((game) => {
            const board = game.board;
            const x = cell.x;
            const y = cell.y;

            if (board[x][y].revealed) {
                if (board[x][y].value > 0) {
                    // count the flags around
                    let flags = 0;
                    let hit_a_mine = false;

                    for (const cell of [
                        board[x - 1]?.[y - 1],
                        board[x - 1]?.[y],
                        board[x - 1]?.[y + 1],
                        board[x]?.[y - 1],
                        board[x]?.[y + 1],
                        board[x + 1]?.[y - 1],
                        board[x + 1]?.[y],
                        board[x + 1]?.[y + 1],
                    ]) {
                        if (!cell) continue;
                        if (cell.flagged) flags++;
                        else if (cell.value === -1) hit_a_mine = true;
                    }

                    if (flags === board[x][y].value) {
                        if (hit_a_mine) return { ...game, game_state: 'lost' };

                        if (should_check(board, x - 1, y - 1)) reveal_impl(board, x - 1, y - 1);
                        if (should_check(board, x - 1, y)) reveal_impl(board, x - 1, y);
                        if (should_check(board, x - 1, y + 1)) reveal_impl(board, x - 1, y + 1);
                        if (should_check(board, x, y - 1)) reveal_impl(board, x, y - 1);
                        if (should_check(board, x, y + 1)) reveal_impl(board, x, y + 1);
                        if (should_check(board, x + 1, y - 1)) reveal_impl(board, x + 1, y - 1);
                        if (should_check(board, x + 1, y)) reveal_impl(board, x + 1, y);
                        if (should_check(board, x + 1, y + 1)) reveal_impl(board, x + 1, y + 1);
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
    },
    setup_subscription() {
        let old_width = 0;
        let old_height = 0;
        let old_percentage = 0;

        game_store.subscribe((game) => {
            if (
                game.width !== old_width ||
                game.height !== old_height ||
                game.percentage !== old_percentage
            ) {
                old_width = game.width;
                old_height = game.height;
                old_percentage = game.percentage;
                return impl_populate_board_with_mines(game);
            }

            if (game.game_state === 'lost' || game.game_state === 'won') {
                // reveal everything
                game.board.forEach((row) => {
                    row.forEach((cell) => {
                        cell.revealed = true;
                    });
                });
            }
        });
    },
});

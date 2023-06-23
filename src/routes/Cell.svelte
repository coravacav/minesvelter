<script lang="ts">
	import { getContext } from 'svelte';
	import { game_attach, type GameState } from './game';
	import type { Writable } from 'svelte/store';
	export let x: number;
	export let y: number;

	const game_store = getContext<Writable<GameState>>('game');

	const cell = $game_store.board[x][y];

	const game = game_attach(game_store);

	let visual_value: number | string = '';
	$: {
		if (cell.revealed) {
			if (cell.value === -1) {
				visual_value = '💣';
			} else if (cell.value !== 0) {
				visual_value = cell.value;
			}
		} else if (cell.flagged) {
			visual_value = '🚩';
		}
	}
</script>

<button
	class="bg-slate-900 text-xl leading-[0] text-white"
	on:click={() => game.reveal(cell)}
	on:contextmenu={(e) => {
		game.flag(cell);
		e.preventDefault();
	}}
	class:bg-slate-600={!cell.revealed && $game_store.game_state !== 'won'}
	class:bg-red-700={$game_store.game_state === 'lost'}
	class:bg-opacity-50={$game_store.game_state === 'lost'}
	class:bg-green-700={$game_store.game_state === 'won'}
>
	{visual_value}
</button>

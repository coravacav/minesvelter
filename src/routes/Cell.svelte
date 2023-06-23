<script lang="ts">
	import { getContext } from 'svelte';
	import { game_attach, type Cell, type GameState } from './game';
	import type { Writable } from 'svelte/store';

	const game_store = getContext<Writable<GameState>>('game');

	export let cell: Cell;

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
	class="text-xl leading-[0] text-white"
	on:click={() => game.reveal(cell)}
	on:contextmenu={(e) => {
		game.flag(cell);
		e.preventDefault();
	}}
    class:bg-slate-900={!cell.revealed && $game_store.game_state === 'none'}
	class:bg-slate-600={cell.revealed && $game_store.game_state !== 'won'}
	class:bg-red-700={$game_store.game_state === 'lost'}
	class:bg-opacity-50={$game_store.game_state === 'lost'}
	class:bg-green-700={$game_store.game_state === 'won'}
>
	{visual_value}
</button>

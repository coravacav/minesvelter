<script lang="ts">
	import { game_attach } from './game';
	import Cell from './Cell.svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const game_store = writable<import('./game').GameState>({
		width: 20,
		height: 10,
		board: [[]],
		game_state: 'none',
		percentage: 0.1,
	});
	setContext('game', game_store);

	const game = game_attach(game_store);
	game.setup_subscription();

	game.populate_board_with_mines();
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === ' ') {
			game.populate_board_with_mines();
		}
	}}
/>

<div class="flex h-full flex-col items-center overflow-hidden bg-slate-700">
	<div class="grid w-full grid-cols-3 px-16">
		<div />
		<div class="flex flex-col items-center">
			<h1 class="pt-8 text-4xl text-white">Minesweeper</h1>
			<caption class="pt-1 text-gray-400">Click to reveal, right-click to flag</caption>
			<caption class="text-gray-400">Press space to reset</caption>
		</div>
		<div class="flex flex-col gap-4 pt-8">
			<div class="flex items-baseline gap-4">
				<h3 class="text-3xl text-white">Options</h3>
				<caption class="whitespace-nowrap pt-1 text-gray-400">Changing any resets the game</caption>
			</div>
			<div class="grid h-min grid-cols-[min-content,1fr] items-center gap-4 px-4 text-white">
				<label for="width">Width:</label>
				<input id="width" type="range" min="10" max="50" bind:value={$game_store.width} />
				<label for="height">Height:</label>
				<input id="height" type="range" min="5" max="25" bind:value={$game_store.height} />
				<label for="difficulty">Difficulty:</label>
				<input
					id="difficulty"
					type="range"
					min="0.05"
					max="0.3"
					step="0.01"
					bind:value={$game_store.percentage}
				/>
			</div>
		</div>
	</div>
	<div
		style:grid-template-columns="repeat({$game_store.width}, 1fr)"
		style:grid-template-rows="repeat({$game_store.height}, 1fr)"
		class="mx-auto grid h-full w-full gap-1 p-8"
	>
		{#key $game_store.board}
			{#each $game_store.board as row}
				{#each row as cell}
					<Cell {cell} />
				{/each}
			{/each}
		{/key}
	</div>
</div>

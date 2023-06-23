<script lang="ts">
	import { game_attach } from './game';
	import Cell from './Cell.svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	// -1 will be a mine
	const game_store = writable<import('./game').GameState>({
		width: 3,
		height: 5,
		board: [[]],
		game_state: 'none',
	});

	setContext('game', game_store);

	const game = game_attach(game_store);

    game.setup_subscription();

	game.create_board();
	game.populate_board_with_mines(0.2);
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === ' ') {
			game.create_board();
			game.populate_board_with_mines(0.2);
			game.reset_board();
		}
	}}
/>

<div class="flex h-full flex-col items-center overflow-hidden bg-slate-700">
	<div class="flex w-full justify-between px-16">
		<div class="h-full">
			<h3 class="my-auto text-2xl">Game state: {$game_store.game_state}</h3>
		</div>
		<div class="flex flex-col">
			<h1 class="pt-8 text-4xl text-white">Minesweeper</h1>
			<caption class="pt-1 text-gray-400">Click to reveal, right-click to flag</caption>
			<caption class="text-gray-400">Press space to reset</caption>
		</div>
		<div />
	</div>
	<div
		style:grid-template-columns="repeat({$game_store.width}, 1fr)"
		style:grid-template-rows="repeat({$game_store.height}, 1fr)"
		style:aspect-ratio="{$game_store.width} / {$game_store.height}"
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

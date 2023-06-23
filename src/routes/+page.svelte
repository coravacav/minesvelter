<script>
	import { game } from './game';
	import Cell from './Cell.svelte';

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
	<h1 class="pt-8 text-4xl text-white">Minesweeper</h1>
	<caption class="pt-1 text-gray-400">Click to reveal, right-click to flag</caption>
	<caption class="text-gray-400">Press space to reset</caption>
	<div
		style:grid-template-columns="repeat({$game.width}, 1fr)"
		style:grid-template-rows="repeat({$game.height}, 1fr)"
		style:aspect-ratio="{$game.width} / {$game.height}"
		class="mx-auto grid h-full w-full gap-1 p-8"
	>
		{#key $game.board}
			{#each $game.board as row}
				{#each row as cell}
					<Cell {cell} />
				{/each}
			{/each}
		{/key}
	</div>
</div>

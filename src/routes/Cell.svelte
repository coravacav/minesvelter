<script lang="ts">
	import { game } from './game';
	export let cell: import('./game').Cell;

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
	class="bg-red-500 leading-[0]"
	on:click={() => game.reveal(cell)}
	on:contextmenu={(e) => {
		game.flag(cell);
		e.preventDefault();
	}}
	class:bg-red-600={!cell.revealed}
>
	{visual_value}
</button>

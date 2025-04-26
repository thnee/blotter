<script lang="ts">
	import type { Snippet } from "svelte";
	let {
		level,
		children,
	}: {
		level: string;
		children: Snippet;
	} = $props();

	let bgColor = $state();
	let borderColor = $state();

	let colors: {[key:string]: any} = {
		"good": {
			"bg": "bg-emerald-500/10",
			"border": "border-emerald-500/20",
		},
		"info": {
			"bg": "bg-sky-500/10",
			"border": "border-sky-500/20",
		},
		"warning": {
			"bg": "bg-amber-500/10",
			"border": "border-amber-500/20",
		},
		"danger": {
			"bg": "bg-red-500/10",
			"border": "border-red-500/20",
		},
	};

	$effect(() => {
		bgColor = colors[level]["bg"];
		borderColor = colors[level]["border"];
	});

</script>

<div class="note p-2 px-3.5 rounded-xs border {bgColor} {borderColor}">
	{@render children()}
</div>

<style>
:global(.note > :last-child) {
	margin-bottom: 0;
}
</style>

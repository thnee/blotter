<script lang="ts">
	import type { Snippet } from "svelte";
	let {
		label = "",
		children
	}: {
		label?: string;
		children: Snippet;
	} = $props();
</script>

<div class="
	flex flex-col
	lg:items-center lg:flex-row lg:gap-2
	mb-1 px-3 py-0.5
	bg-neutral-500/15 rounded-sm
">
	{#if label}
		<div class="w-[240px] p-0.5">
			{label}
		</div>
	{/if}

	<div class="p-0.5">
		{@render children()}
	</div>
</div>

<script>
	let { data } = $props();
	let mdMeta = data.mdMeta;
</script>

<div class="flex flex-col gap-4 mt-10 border-b border-red-700/50 pb-4">
	<h1 class="text-4xl font-semibold">
		{mdMeta.title}
	</h1>

	<div>
		{mdMeta.description}
	</div>

	<div class="flex items-center gap-2 flex-wrap">
		<div>
			{mdMeta.date}
		</div>

		{#each mdMeta.tags as tag}
			<div class="badge">
				{tag}
			</div>
		{/each}
	</div>
</div>

<div class="article mt-4">
	<svelte:component this={data.pageComp} />
</div>

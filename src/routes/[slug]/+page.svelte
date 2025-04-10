<script>
	let { data } = $props();
	let mdMeta = data.mdMeta;
</script>

<div class="article">
	<h1 class="text-4xl mb-4 mt-0">
		{mdMeta.title}
	</h1>

	<div class="mb-4">
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

	<hr>

	<data.pageComp />
</div>

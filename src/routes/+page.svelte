<script>
	let { data } = $props();
</script>

<div class="flex flex-col gap-4">
	{#each data.articles as article}
		<div class="
			flex flex-col gap-2 pb-4
			border-b border-red-700/50
		">
			<a
				class="text-2xl"
				href={article.url}
			>
				{article.title}
			</a>
			<div>
				{article.description}
			</div>

			<div class="flex items-center flex-wrap gap-2">
				<div>
					{article.date}
				</div>

				{#each article.tags as tag}
					<div class="badge">
						{tag}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

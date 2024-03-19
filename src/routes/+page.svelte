<script>
	export let data;
</script>

<div class="flex flex-col gap-10">
	{#each data.articles as article}
		<div class="flex flex-col items-center gap-2">
			<a
				class="text-2xl"
				href={article.metadata.url}
			>
				{article.metadata.title}
			</a>

			<div>
				{article.metadata.date}
			</div>

			<div class="flex gap-2">
				{#each article.metadata.tags as tag}
					<div class="badge">
						{tag}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

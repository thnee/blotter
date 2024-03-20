<script>
	export let data;
</script>

<div class="flex flex-col gap-10">
	{#each data.articles as article}
		<div class="flex flex-col items-center gap-2">
			<a
				class="text-2xl"
				href={article.url}
			>
				{article.title}
			</a>

			<div>
				{article.date}
			</div>

			<div class="flex gap-2">
				{#each article.tags as tag}
					<div class="badge">
						{tag}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

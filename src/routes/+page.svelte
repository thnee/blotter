<script>
	import Seo from "$lib/Seo.svelte";

	export let data;
</script>

<Seo
	title="Tech blog"
/>

<div class="flex flex-col gap-10">
	{#each data.articles as article}
		<div class="flex flex-col items-center gap-2 text-center">
			<a
				class="text-2xl"
				href={article.url}
			>
				{article.title}
			</a>

			<div>
				{article.date}
			</div>

			<div class="flex items-center flex-wrap gap-2 justify-center">
				{#each article.tags as tag}
					<div class="badge">
						{tag}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

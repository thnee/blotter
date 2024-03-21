<script>
	import Seo from "$lib/Seo.svelte";

	let { title, date, description, tags } = $props();
</script>

<Seo
	title={title}
	description={description}
	keywords={tags}
/>

<div class="flex flex-col gap-4 mt-10 border-b border-red-700/50 pb-4">
	<h1 class="text-4xl font-semibold">
		{title}
	</h1>

	<div>
		{description}
	</div>

	<div class="flex items-center gap-2 flex-wrap">
		<div>
			{date}
		</div>

		{#each tags as tag}
			<div class="badge">
				{tag}
			</div>
		{/each}
	</div>

</div>

<div class="article mt-4">
	<slot />
</div>

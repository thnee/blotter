<script>
	import Seo from "$lib/Seo.svelte";

	let { title, date, tags } = $props();
</script>

<Seo
	title={title}
/>

<div class="flex flex-col gap-4 mt-10">
	<h1 class="text-4xl font-semibold">
		{title}
	</h1>

	<div class="flex items-center gap-4">
		<div>
			{date}
		</div>

		<div class="flex gap-2">
			{#each tags as tag}
				<div class="badge">
					{tag}
				</div>
			{/each}
		</div>
	</div>
</div>

<div class="article mt-10">
	<slot />
</div>

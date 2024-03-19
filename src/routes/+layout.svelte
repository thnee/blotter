<script>
	import { page } from "$app/stores";
	import "$lib/styles/main.css";
	import "unfonts.css";

	let menu = {
		"/": "Articles",
		"/about": "About",
	};
</script>

<div class="max-w-[1200px] mx-auto my-12">
	<div class="flex flex-col items-center mb-12">
		<h1
			class="text-6xl"
			style="font-family: 'Abril Fatface';"
		>
			thnee<span class="text-red-500">.</span>se
		</h1>

		<div class="flex gap-6 mt-4 text-2xl">
			{#each Object.keys(menu) as key}
				<a
					href={key}
					class:activeMenuItem={key == $page.route.id}
				>
					{menu[key]}
				</a>
			{/each}
		</div>
	</div>

	<slot />
</div>

<script>
	import { page } from "$app/stores";

	import "prismjs/themes/prism-tomorrow.css"

	import "$lib/styles/main.css";

	let { data } = $props();

	let siteName = "thnee.se";
	let defaultKeywords = [
		"programming",
		"software engineering",
		"devops",
		"system administration",
		"computer technology",
		"blog",
		"articles",
	];
	let author = "Mattias Lindvall";

	let head = $state({});

	let setHead = () => {
		if ($page.data.pageMeta.title) {
			head.title = $page.data.pageMeta.title + " • " + siteName;
		} else {
			head.title = siteName;
		}
		if ($page.data.pageMeta.description) {
			head.description = $page.data.pageMeta.description;
		} else {
			head.description = undefined;
		}
		if ($page.data.pageMeta.keywords) {
			head.keywords = [...defaultKeywords, ...$page.data.pageMeta.keywords || []];
		} else {
			head.keywords = defaultKeywords;
		}
		head.author = author;
	};

	setHead();
	$effect(setHead);

	let menu = {
		"/": "Articles",
		"/about": "About",
	};
</script>

<div class="max-w-[1200px] mx-auto my-12 px-4">
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

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=IBM+Plex+Mono&family=IBM+Plex+Sans&display=swap" rel="stylesheet">

	<title>{head.title}</title>
	{#if head.description}
		<meta name="description" content={head.description}>
	{/if}
	{#if head.keywords}
		<meta name="keywords" content={head.keywords.join(" ")}>
	{/if}
	{#if head.author}
		<meta name="author" content={head.author}>
	{/if}

	{#if data.ENABLE_GA == "true"}
		<!-- Google tag (gtag.js) -->
		<script async src="https://www.googletagmanager.com/gtag/js?id=G-3XQTGB5VFR"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', 'G-3XQTGB5VFR');
		</script>
	{/if}
</svelte:head>

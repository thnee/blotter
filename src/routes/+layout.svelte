<script>
	import { page } from "$app/stores";
	import GithubIcon from "~icons/fa-brands/github";

	import "$lib/styles/main.css";

	let { data, children } = $props();

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

<div class="min-h-full flex flex-col">
	<header class="min-w-0 flex flex-col items-center py-12">
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
	</header>

	<main class="grow self-center w-full min-w-0 max-w-[1200px] px-4">
		{@render children()}
	</main>

	<footer class="
		min-w-0
		p-4 px-12 mt-10
		bg-neutral-900
		border-t-1 border-neutral-800
		select-none
	">
		 <div class="
			w-full max-w-[1200px] mx-auto
			flex justify-center
		">
			<a
				href="https://github.com/thnee/blotter"
				class="
				text-white no-underline
					p-1.5 px-2.5 rounded-sm hover:bg-neutral-700/15
					flex items-center gap-2.5
				"
			>
				<GithubIcon />
				<div class="
					flex gap-1.5
					text-sm text-white/80
				">
					<span>thnee</span>
					<span class="text-white/30 ">/</span>
					<span class="font-semibold">blotter</span>
				</div>
			</a>
		</div>
	</footer>
</div>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=IBM+Plex+Mono&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Serif&display=swap" rel="stylesheet">

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

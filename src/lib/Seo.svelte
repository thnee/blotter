<script>
	let {
		title = "",
		description = "",
		keywords = [],
	} = $props();

	let author = "Mattias Lindvall";

	if (title) {
		title = title + " • thnee.se";
	} else {
		title = "thnee.se";
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description}>
	<meta name="keywords" content={keywords.join(" ")}>
	<meta name="author" content={author}>
</svelte:head>

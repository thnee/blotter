<script>
	let {
		title = "",
	} = $props();

	if (title) {
		title = title + " • thnee.se";
	} else {
		title = "thnee.se";
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

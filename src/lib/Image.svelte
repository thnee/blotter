<script>
	let { src, alt = "" } = $props();
</script>

<a
	href={src}
	class="
		image
		block
		w-fit h-fit
		border-4 border-neutral-500/30
		rounded-xs
	"
>
	<img
		src={src}
		alt={alt}
		class="block"
	/>
</a>

<style>
	.image {
		max-width: var(--max-width, 700px);
	}
</style>

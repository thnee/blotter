<script>
	let { src, alt = "" } = $props();
</script>

<a
	href={src}
	class="
		image
		block my-2
		border-4 border-neutral-600
		w-max h-max
	"
>
	<img
		src={src}
		alt={alt}
		class="block max-w-[700px]"
	/>
</a>

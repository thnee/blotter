<script>
	const props = $props();
</script>

<div class="flex">
	<a
		class="flex flex-none shrink grow-0 gap-1.5 items-center"
		href={props.href}
	>
	<div class="h-[42px] w-[42px] flex items-center justify-center">
		<props.icon style="font-size: {props.iconSize}; color: {props.iconColor};" />
	</div>
	{ props.label }
</a>
</div>

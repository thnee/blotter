<script lang="ts">
	let {
		value = $bindable(),
		valid = $bindable(),
		oninput,
		classes = "",
		...attrs
	}: {
		value: any;
		valid: boolean;
		oninput?: Function;
		classes?: string;
		[key: string]: unknown;
	} = $props();

	let invalidClasses = $state("");

	$effect(() => {
		if (!valid) {
			invalidClasses = "border-red-500";
		} else {
			invalidClasses = "";
		}
	});

	function _oninput(e: Event) {
		let target = e.target as HTMLInputElement;
		if (oninput) {
			oninput(e);
		} else {
			value = target.value;
		}
	}
</script>

<input
	{...attrs}
	value={value}
	oninput={(e) => {_oninput(e)}}
	class={`
		border border-neutral-500/80 bg-black rounded-xs
		text-right
		box-content
		px-2 py-0.5
		font-mono
		${classes}
		${invalidClasses}
	`}
/>

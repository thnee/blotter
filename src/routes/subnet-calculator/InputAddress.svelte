<script lang="ts">
	import Input from "./Input.svelte";

	let {
		value = $bindable(),
		valid = $bindable(),
		...attrs
	}: {
		value: string;
		valid: boolean;
		[key: string]: unknown;
	} = $props();

	function validate(value: string): boolean {
		let find = value.search(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/);
		return find != -1;
	}

	$effect(() => {
		valid = validate(value);
	});
</script>

<Input
	bind:value={value}
	bind:valid={valid}
	type="text"
	{...attrs}
/>

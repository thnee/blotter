<script lang="ts">
	import { Address } from "./Network.svelte";

	let {
		address,
		showFooter = true,
		bitsReserved = $bindable(0),
		bitsUsable = $bindable(0),
		bitsHost = $bindable(0),
	}: {
		address: Address;
		showFooter?: boolean;
		bitsReserved?: number;
		bitsUsable?: number;
		bitsHost?: number;
	} = $props();

	let colors = {
		reserved: "text-amber-400",
		usable: "text-sky-400",
		host: "text-rose-400",
	};

	type Digit = {
		value: string;
		color: string;
	};

	let digits: Array<Digit> = $state([]);

	$effect(() => {
		let newDigits: Array<Digit> = [];

		let valueDigits = (address.value >>> 0).toString(2).padStart(32, "0");
		for (let i = 0; i < valueDigits.length; i++) {
			let color = "";

			if (i + 1 <= bitsReserved) {
				color = colors.reserved;
			} else if (i + 1 <= bitsReserved + bitsUsable) {
				color = colors.usable;
			} else if (i + 1 <= bitsReserved + bitsUsable + bitsHost) {
				color = colors.host;
			}

			newDigits.push({
				value: valueDigits[i],
				color: color,
			});

			if (i < valueDigits.length - 1 && i % 8 == 7) {
				newDigits.push({
					value: ".",
					color: "",
				});
			}
		}

		digits = newDigits;
	});
</script>

<div class="flex font-mono">
	{#each digits as digit}
		<span class="{digit.color}">
			{digit.value}
		</span>
	{/each}
</div>

{#snippet description(
	label: string,
	value: number,
	color: string,
)}
	<div>
		<div class="inline-flex">
			<span class="{color}">{label}</span>
			<span>:</span>
		</div>
		{value} bits
	</div>
{/snippet}

{#if showFooter}
	<div class="flex gap-3 text-sm font-sans">
		{@render description(
			"Network reserved",
			bitsReserved,
			colors.reserved,
		)}
		{@render description(
			"Network usable",
			bitsUsable,
			colors.usable,
		)}
		{@render description(
			"Host",
			bitsHost,
			colors.host,
		)}
	</div>
{/if}

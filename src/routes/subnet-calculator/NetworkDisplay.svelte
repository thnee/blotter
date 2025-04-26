<script lang="ts">
	import { Address, Netmask } from "./Network.svelte";

	let {
		address,
		netmask = undefined,
		base = 10,
		pad = 0,
	}: {
		address: Address;
		netmask?: Netmask;
		base?: number;
		pad?: number;
	} = $props();

	let octets: Array<number> = $state([]);

	$effect(() => {
		octets = address.toOctets();
	});
</script>

<div class="flex font-mono">
	{#each octets as octet, index}
		<span>
			{octet.toString(base).padStart(pad, "0").toUpperCase()}
		</span>
		{#if index < octets.length - 1}
			<span>
				.
			</span>
		{/if}
	{/each}

	{#if netmask}
		<span>
			/
		</span>
		<span>
			{netmask.bitsTotal}
		</span>
	{/if}
</div>

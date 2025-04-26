<script lang="ts">
	import OutputIcon from "~icons/mdi/output";
	import InputIcon from "~icons/mdi/input";

	import Note from "$lib/Note.svelte";

	import Network from "./Network.svelte";

	import Row from "./Row.svelte";
	import InputAddress from "./InputAddress.svelte";
	import InputNumber from "./InputNumber.svelte";
	import NetworkDisplay from "./NetworkDisplay.svelte";
	import NetworkDisplayBinary from "./NetworkDisplayBinary.svelte";

	let address: string = $state("10.0.0.0");
	let addressValid: boolean = $state(false);

	let bitsTotal: number = $state(0);
	let bitsTotalMin: number = $state(0);
	let bitsTotalMax: number = $state(32);
	let bitsTotalValid: boolean = $state(false);

	let bitsReserved: number = $state(0);
	let bitsReservedMin: number = $state(0);
	let bitsReservedMax: number = $state(32);
	let bitsReservedValid: boolean = $state(false);

	let network: Network = $state(new Network());

	$effect(() => {
		if (addressValid && bitsTotalValid && bitsReservedValid) {
			network.update(address, bitsTotal, bitsReserved);
		}

		bitsTotalMin = bitsReserved;
		bitsReservedMax = bitsTotal;
	});

	let templateInputs = [
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
	];

	function inputTemplate(index: number) {
		let value = templateInputs[index];
		let parts = value.split("/");
		address = parts[0];
		bitsReserved = parseInt(parts[1]);
		if (index == 0) {
			bitsTotal = 20;
		}
		if (index == 1) {
			bitsTotal = 22;
		}
		if (index == 2) {
			bitsTotal = 24;
		}
	}

	inputTemplate(0);
</script>

<div class="min-w-[500px] max-w-[900px] mx-auto">
	<div class="mb-2">
		<h1 class="text-4xl">CIDR Subnet Calculator</h1>

		<Note level="info" class="mt-2 mb-6">
			<ul class="text-sm list-disc pl-4">
				<li>
					Click the buttons under Template inputs
					to populate input fields with example values.<br>
					After that, inputs can also be modified manually.
				</li>
				<li>
					The CIDR must be larger than or equal to the Reserved CIDR.<br>
					The Reserved CIDR must be smaller than or equal to the CIDR.
				</li>
				<li>
					See also:
					<a
						href="https://www.arin.net/reference/research/statistics/address_filters/"
					>ARIN - IPv4 Private Address Space and Filtering</a>
				</li>
			</ul>
		</Note>
	</div>

	<div class="flex items-center gap-2 mt-2 mb-1">
		<InputIcon class="size-6" />
		Input
	</div>

	<Row label="Template inputs">
		<div class="flex flex-col lg:flex-row items-start lg:items-center gap-2">
			{#each templateInputs as input, index}
				<button
					onclick={() => {inputTemplate(index)}}
					class="
						px-2.5 py-1
						rounded
						cursor-pointer
						font-mono
						border
						border-neutral-600
						bg-neutral-900
						hover:bg-neutral-800
						hover:border-neutral-500
					"
				>
					{input}
				</button>
			{/each}
		</div>
	</Row>

	<Row>
		<div class="flex flex-col lg:flex-row lg:gap-22">
			<div class="self-start flex items-center gap-2">
				<label class="w-[150px] lg:w-[240px] p-0.5" for="address">
					Network Address
				</label>
				<div class="">
					<InputAddress
						id="address"
						classes="w-[162px]"
						bind:value={address}
						bind:valid={addressValid}
					/>
				</div>
			</div>

			<div class="flex flex-col">
				<div class="flex items-center gap-2">
					<label class="w-[150px] p-0.5" for="bitsReserved">
						Reserved CIDR
					</label>
					<InputNumber
						id="bitsReserved"
						min={bitsReservedMin}
						max={bitsReservedMax}
						bind:value={bitsReserved}
						bind:valid={bitsReservedValid}
					/>
				</div>

				<div class="flex items-center gap-2">
					<label class="w-[150px] p-0.5" for="bitsTotal">
						CIDR
					</label>
					<InputNumber
						id="bitsTotal"
						min={bitsTotalMin}
						max={bitsTotalMax}
						bind:value={bitsTotal}
						bind:valid={bitsTotalValid}
					/>
				</div>
			</div>
		</div>
	</Row>

	<div class="flex items-center gap-2 mt-2 mb-1">
		<OutputIcon class="size-6" />
		Address
	</div>
	<Row label="Decimal">
		<NetworkDisplay
			address={network.address}
			base={10}
		/>
	</Row>
	<Row label="Hexadecimal">
		<NetworkDisplay
			address={network.address}
			base={16}
			pad={2}
		/>
	</Row>
	<Row label="Binary">
		<NetworkDisplayBinary
			address={network.address}
			bitsReserved={network.netmask.bitsReserved}
			bitsUsable={network.netmask.bitsUsable}
			bitsHost={network.netmask.bitsHost}
		/>
	</Row>

	<div class="flex items-center gap-2 mt-2 mb-1">
		<OutputIcon class="size-6" />
		Netmask
	</div>
	<Row label="Decimal">
		<NetworkDisplay
			address={network.netmask.toAddress()}
			base={10}
		/>
	</Row>
	<Row label="Hexadecimal">
		<NetworkDisplay
			address={network.netmask.toAddress()}
			base={16}
			pad={2}
		/>
	</Row>
	<Row label="Binary">
		<NetworkDisplayBinary
			address={network.netmask.toAddress()}
			bitsReserved={network.netmask.bitsReserved}
			bitsUsable={network.netmask.bitsUsable}
			bitsHost={network.netmask.bitsHost}
		/>
	</Row>

	<div class="flex items-center gap-2 mt-2 mb-1">
		<OutputIcon class="size-6" />
		Number of networks
	</div>
	<Row label="Total">
		{network.numberOfNetworksTotal.toLocaleString("en-US")}
	</Row>
	<Row label="Reserved">
		{network.numberOfNetworksReserved.toLocaleString("en-US")}
	</Row>
	<Row label="Usable">
		{network.numberOfNetworksUsable.toLocaleString("en-US")}
	</Row>

	<div class="flex items-center gap-2 mt-2 mb-1">
		<OutputIcon class="size-6" />
		Number of hosts per network
	</div>
	<Row label="Total">
		{network.numberofHostsPerNetworkTotal.toLocaleString("en-US")}
	</Row>
	<Row label="Usable">
		{network.numberOfHostsPerNetworkUsable.toLocaleString("en-US")}
	</Row>

	<div class="flex items-center gap-2 mt-2 mb-1">
		<OutputIcon class="size-6" />
		Subnet list
	</div>

	<Row>
		{@const subnets = network.getSubnets(256)}
		{#each subnets.start as subnet}
			<NetworkDisplay
				address={subnet.address}
				netmask={subnet.netmask}
			/>
		{/each}
		{#if subnets.end.length > 0}
			<div class="text-fg/70 my-2">
				({subnets.excluded} rows hidden, out of {subnets.total} rows total)
			</div>
		{/if}
		{#each subnets.end.reverse() as subnet}
			<NetworkDisplay
				address={subnet.address}
				netmask={subnet.netmask}
			/>
		{/each}
	</Row>
</div>

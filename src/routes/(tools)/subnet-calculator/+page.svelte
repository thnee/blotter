<script>
	// function show_mem_rep(start, n) {
	// 	for (let i = 0; i < n; i++) {
	// 			// Print the byte at index i in hexadecimal format with 2 digits
	// 			console.log(` ${start[i].toString(16).padStart(2, '0')}`);
	// 	}
	// 	console.log("\n");
	// }

	// // Main function to call above function for 0x01234567
	// function main() {
	// 		// In JavaScript, we don't have specific data types like int or char, so we use numbers
	// 		// let i = 0x01234567;
	// 		let i = 1;

	// 		// When accessing memory in JavaScript, we use Typed Arrays
	// 		// Here, we create a Uint8Array view of the memory where `i` is stored
	// 		let x = new Uint32Array([i]);
	// 		console.log(x);
	// 		let y = x.buffer;
	// 		console.log(y);
	// 		let byteArray = new Uint8Array(y);

	// 		// Call the show_mem_rep function with the byteArray and its length
	// 		show_mem_rep(byteArray, byteArray.length);
	// }
	// main();

	function checkEndian() {
    var arrayBuffer = new ArrayBuffer(2);
    var uint8Array = new Uint8Array(arrayBuffer);
    var uint16array = new Uint16Array(arrayBuffer);
    uint8Array[0] = 0xAA; // set first byte
    uint8Array[1] = 0xBB; // set second byte
    if(uint16array[0] === 0xBBAA) return "little endian";
    if(uint16array[0] === 0xAABB) return "big endian";
    else throw new Error("Something crazy just happened");
	}
	// console.log(checkEndian());

	let x = new Array(4).fill(0);
	x[2] = 7;

	function byteToBinary(byte) {
		let s = "";
		for (let i = 0; i < 8; i++) {
			let value = 1 & (byte >> i);
			s = value.toString() + s;
		}
		return s.toString();
	}

	let k = x.map((v) => byteToBinary(v));
	// let k = y.map((v) => { return byteToBinary(v);});
	console.log(k);
	// byteToBinary(2);
	// let k = 6 & 2;

	let input = $state("10.0.0.0/20");
	let error = $state("");
	let warning = $state("");

	let addr = $state(0);
	let mask = $state(0);

	function updateInternal() {
		addr = 0;
		mask = 0;
		let parts = input.split("/");
		mask = parseInt(parts[1]);

		let addrParts = parts[0].split(".");
		for (let i = addrParts.length; i > 0; i--) {
			let num = parseInt(addrParts[i - 1]);
			// console.log(i, num);
			// console.log(i, addrParts.length - i);
			// console.log(num, ((addrParts.length - i) * 8));
			addr += num << ((addrParts.length - i) * 8);
		}
		// console.log(addr);
		// addr = (addr4 << 0) + (addr3 << 8) + (addr2 << 16) + (addr1 << 24);
	}

	function updateInput() {
		input = num2ip(addr) + "/" + mask;
	}

	updateInternal();

	function up() {
		console.log("up?");
		mask += 1;
		if (mask > 32) {
			mask = 32;
		}
		// updateInternal();
		updateInput();
	}

	function down() {
		console.log("down?");
		mask -= 1;
		if (mask < 1) {
			mask = 1;
		}
		// updateInternal();
		updateInput();
	}

	function getByteFromNum(num, byte) {

	}


	let addressBinary = $derived.by(() => {
		let digits = [];
		for (var i = 31; i >= 0; i--) {
			var value = addr >> i & 1;
			digits.push({value});
			if (i > 0 && i % 8 == 0) {
				digits.push({value: ".", class: ""});
			}
		}
		return digits;
	});

	let netmaskBinary = $derived.by(() => {
		let digits = [];
		for (var i = 31; i >= 0; i--) {
			if (32 - i <= mask) {
				digits.push({value: 1});
			} else {
				digits.push({value: 0});
			}
			if (i > 0 && i % 8 == 0) {
				digits.push({value: ".", class: ""});
			}
		}
		return digits;
	});

	let netmaskDecimal = $derived.by(() => {
		for (var i = 31; i >= 0; i--) {
			if (32 - 1 <= mask) {

			}
		}
		return [{value: "a"}, {value: "s"}, {value: "d"}];
	});

	let totalNetworks = $derived.by(() => {
		return 42;
	});

	let totalHosts = $derived.by(() => {
		return 33;
	});

	let exampleNetworks = $derived.by(() => {
		return ["asdf", "qwer"];
	});

	// let ip = $derived.by(() => {

	// });
	// let netmask = $derived.by(() => {

	// });

	function dec2bin(dec, padding) {
		return (dec >>> 0).toString(2).padStart(padding, "0");
	}

	function bits2num(size) {
		var result = 0;
		for (var i = 0; i < size; i++) {
			result += 1 << i;
		}
		return result >>> 0;
	}

	function num2ip(number) {
		return (
			((number >> 24) & 255) + "." +
			((number >> 16) & 255) + "." +
			((number >> 8) & 255) + "." +
			((number >> 0) & 255)
		);
	}

</script>

<div>
	<div class="mb-10">
		The following address ranges are
		<a
			href="https://www.arin.net/reference/research/statistics/address_filters/"
		>reserved for private networks</a>.

		<ul>
			<li><code>10.0.0.0/8</code></li>
			<li><code>172.16.0.0/12</code></li>
			<li><code>192.168.0.0/16</code></li>
		</ul>
	</div>

	<dl class="grid grid-cols-[400px_auto] gap-4">
		<dt>Input network</dt>
		<dd>
			<div class="ip-input">
				<input placeholder="10.0.0.0/20" bind:value={input} on:input={updateInternal}>
				<div class="buttons">
					<button class="up" on:click={up}>&#x25b2;</button>
					<button class="down" on:click={down}>&#x25bc;</button>
				</div>
				<span class="input-error">{error}</span>
				<span class="input-warning">{warning}</span>
			</div>
		</dd>

		<dt>Address in binary</dt>
		<dd>
			<div class="code">
				{#each addressBinary as digit}
					<span class={digit.class}>{digit.value}</span>
				{/each}
			</div>
			<small>
				<span class="base">Reserved range</span>.
				<span class="net">Network range</span>.
				<span class="host">Host range</span>.
			</small>
		</dd>

		<dt>Netmask in binary IP</dt>
		<dd>
			<div class="code">
				{#each netmaskBinary as digit}
					{digit.value}
				{/each}
				({mask} bits)
			</div>
		</dd>

		<dt>Netmask in decimal IP</dt>
		<dd>
			<div class="code">
				{#each netmaskDecimal as digit}
					{digit.value}
				{/each}
			</div>
		</dd>

		<dt>Total number of networks</dt>
		<dd><code>{totalNetworks}</code></dd>

		<dt>Total number of hosts per network</dt>
		<dd>
			<div class="code">{totalHosts}</div>
			<div class="text-sm">
				Note: The first and last host address are reserved for network and broadcast,
				so in practice the actual number is 2 less than what is shown here.
			</div>
		</dd>

		<dt>Example networks</dt>
		<dd>
			{#each exampleNetworks as net}
				<div>{net}</div>
			{/each}
		</dd>
	</dl>
</div>

<style lang="postcss">
	dl {
		input {
			@apply bg-neutral-700;
		}
		dt {
		}
		dd {
			@apply bg-neutral-800 p-2;
		}
	}
	.code {
		font-family: monospace;
		font-size: 20px;
	}
</style>

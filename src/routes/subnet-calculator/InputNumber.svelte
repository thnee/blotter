<script lang="ts">
	import ArrowUpBoldCircle from "~icons/mdi/arrow-up-bold-circle";
	import ArrowDownBoldCircle from "~icons/mdi/arrow-down-bold-circle";

	import Input from "./Input.svelte";

	let {
		value = $bindable(),
		valid = $bindable(),
		min = $bindable(),
		max = $bindable(),
		...attrs
	}: {
		value: number;
		valid: boolean;
		min: number;
		max: number;
		[key: string]: unknown;
	} = $props();

	function oninput(e: InputEvent) {
		let target = e.target as HTMLInputElement;
		value = parseInt(target.value);
	}

	function adjustValue(direction: string) {
		let newValue: number = 0;

		if (value < min) {
			newValue = min;
		} else if (value > max) {
			newValue = max;
		} else {
			if (direction == "up") {
				newValue = value + 1;
			}
			if (direction == "down") {
				newValue = value - 1;
			}
		}

		if (validate(newValue)) {
			value = newValue;
		}
	}

	function validate(value: number): boolean {
		if (value < min) {
			return false;
		}
		if (value > max) {
			return false;
		}
		return true;
	}

	$effect(() => {
		valid = validate(value);
	});
</script>

<div class="flex items-center gap-2">
	<div>
		<Input
			value={value}
			oninput={oninput}
			bind:valid={valid}
			type="text"
			maxLength="2"
			classes="w-[22px]"
			{...attrs}
		/>
	</div>

	<div class="p-0.5 flex items-center gap-2">
		<button
			onclick={() => {adjustValue("down")}}
			class="hover:cursor-pointer"
		>
			<ArrowDownBoldCircle class="w-9 h-9" />
		</button>

		<button
			onclick={() => {adjustValue("up")}}
			class="hover:cursor-pointer"
		>
			<ArrowUpBoldCircle class="w-9 h-9" />
		</button>
	</div>
</div>

<script lang="ts">
	import FishIcon from "~icons/lucide/fish-symbol";

	import Window from "$lib/items/Win/Window.svelte";

	import Dialog, {
		dialogOpen,
		dialogClose,
		dialogOnMoveStart,
	} from "../Dialog.svelte";

	import img from "./img.png";
	import warn from "./warn.png";
</script>

<div
	ondblclick={dialogOpen}
	aria-hidden="true"
	class="h-6 flex items-center overflow-hidden"
>
	<FishIcon class="size-11 text-neutral-500/12 hover:text-neutral-500/28"/>
</div>

<Dialog>
	<Window
		title="WARNING"
		onminimize={dialogClose}
		onclose={dialogClose}
		ontitlemousedown={dialogOnMoveStart}
		class="w-[290px]"
	>
		<div class="relative h-[95px]">
			<img
				class="
					absolute top-[10px] left-[10px] w-[30px]
				"
				src={warn}
				alt=""
			/>

			<img
				class="
					absolute left-1/2 -translate-x-1/2 top-[30px]
				"
				src={img}
				alt=""
			/>

			<div
				class="
					absolute left-[70px] top-[15px]
				"
			>
				fissh
			</div>

			<div
				class="
					absolute top-[74px] left-[70px]
					bg-black size-[1px]
				"
			></div>
		</div>

		<div class="flex justify-center gap-4 mt-1 mb-2">
			<button onclick={dialogClose}>
				ok
			</button>
			<button onclick={dialogClose}>
				ok
			</button>
			<button onclick={dialogClose}>
				dont
			</button>
		</div>
	</Window>
</Dialog>

<script lang="ts" module>
	let dialog: HTMLDialogElement;

	let posX = 0;
	let posY = 0;

	export function dialogSetInitialPosition() {
		posX = document.documentElement.clientWidth / 2;
		posY = document.documentElement.clientHeight / 2;
	}

	export function dialogOpen() {
		dialogSetInitialPosition();
		dialogRenderPosition();
		dialog.showModal();
		document.addEventListener("mouseup", dialogOnMoveEnd);
		window.addEventListener("resize", dialogOnResize);
	}

	export function dialogClose() {
		dialog.close();
		window.removeEventListener("resize", dialogOnResize);
	}

	export function dialogOnMoveStart() {
		document.addEventListener("mousemove", dialogOnMove);
	}

	export function dialogOnMoveEnd() {
		document.removeEventListener("mousemove", dialogOnMove);
	}

	export function dialogOnResize() {
		dialogSetInitialPosition();
		dialogRenderPosition();
	}

	export function dialogOnMove(e: MouseEvent) {
		posX = posX + e.movementX;
		posY = posY + e.movementY;

		dialogRenderPosition();
	}

	export function dialogRenderPosition () {
		dialog.style.left = `${posX}px`;
		dialog.style.top = `${posY}px`;
	}
</script>

<script lang="ts">
	import { type Snippet } from "svelte";

	let {
		children,
		...rest
	}: {
		children: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<dialog
	bind:this={dialog}
	{...rest}
>
	{@render children()}
</dialog>

<style>
	dialog {
		transform: translateX(-50%) translateY(-50%);

		&::backdrop {
			background: rgba(0, 0, 0, 0.7);
		}
	}
</style>

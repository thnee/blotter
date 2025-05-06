<script lang="ts">
	import type { Snippet } from "svelte";

	import "./win98.css";

	import type { MouseEventHandler } from "svelte/elements";

	let {
		title,
		children,
		onminimize = () => {},
		onclose = () => {},
		ontitlemousedown = () => {},
		...rest
	}: {
		title: string;
		children: Snippet;
		onminimize?: CallableFunction;
		onclose?: CallableFunction;
		ontitlemousedown?: MouseEventHandler<HTMLElement>;
		[key: string]: unknown;
	} = $props();
</script>

<div class="win-window {rest.class}">
	<div
		class="win-window-title-bar"
		onmousedown={ontitlemousedown}
		aria-hidden="true"
	>
		<div class="win-window-title-bar-text">
			{title}
		</div>
		<div
			class="win-window-title-bar-controls"
		>
			<button
				aria-label="Minimize"
				onclick={(e) => {onminimize(e)}}
				onmousedown={(e) => {e.stopPropagation()}}
			></button>
			<button
				aria-label="Close"
				onclick={(e) => {onclose(e)}}
				onmousedown={(e) => {e.stopPropagation()}}
			></button>
		</div>
	</div>

	<div class="win-window-body">
		{@render children()}
	</div>
</div>

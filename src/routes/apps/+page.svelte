<script>
	import ArrowIcon from "~icons/mdi/arrow-right-thick";
</script>

{#snippet card({title, href, description})}
		<div class="
			flex flex-col items-start gap-2
			p-4 w-[400px]
			border border-neutral-500/50
			bg-neutral-500/10
			rounded-sm
		">
			<a
				href={href}
				class="text-2xl flex items-center gap-2"
			>
				{title}
				<ArrowIcon class="text-fg w-6" />
			</a>
			<div>
				{description}
			</div>
		</div>
{/snippet}

<div class="flex flex-col items-center gap-4">
	{@render card({
		title: "CIDR Subnet Calculator",
		href: "/subnet-calculator",
		description: "Interactive CIDR subnet calculator.",
	})}

	{@render card({
		title: "Make The News",
		href: "https://makethenews.pages.dev",
		description: "Interactive news image generator.",
	})}
</div>

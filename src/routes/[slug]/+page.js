export async function load({params}) {
	let mod = await import(`../../lib/articles/${params.slug}.md`);

	return {
		mdMeta: mod.metadata,
		pageComp: mod.default,
		pageMeta: {
			title: mod.metadata.title,
			description: (mod.metadata.description || "").trim(),
			keywords: mod.metadata.tags || [],
		},
	};
}

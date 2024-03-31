export function load({route}) {
	const mods = import.meta.glob("../**/+page.md", {eager: true});

	let mdMeta;

	for (const [_, mod] of Object.entries(mods)) {
		if (route.id == `/(articles)/${mod.metadata.url}`) {
			mdMeta = mod.metadata;
		}
	}

	return {
		mdMeta: mdMeta,
		pageMeta: {
			title: mdMeta.title,
			description: mdMeta.description.trim(),
			keywords: mdMeta.tags,
		},
	};
}

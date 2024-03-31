export function load() {
	const mods = import.meta.glob("../lib/articles/*.md", {eager: true});

	let articles = [];

	for (const [_, mod] of Object.entries(mods)) {
		articles.push({
			date: mod.metadata.date,
			dateObj: new Date(mod.metadata.date),
			url: `/${mod.metadata.slug}`,
			title: mod.metadata.title,
			description: mod.metadata.description || "",
			tags: mod.metadata.tags || [],
		});
	}

	articles = articles.sort((a, b) => {
		if (a.dateObj < b.dateObj) {
			return 1;
		} else {
			return -1;
		}
	});

	return {
		articles: articles,
		pageMeta: {
			title: "Tech blog",
			description: "Articles about technology.",
		},
	};
}

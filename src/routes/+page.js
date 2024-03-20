export function load() {
	const mods = import.meta.glob("../**/+page.md", {eager: true});

	let articles = [];

	for (const [path, mod] of Object.entries(mods)) {
		if (path.includes("(articles)")) {
			articles.push({
				date: new Date(mod.metadata.date),
				metadata: mod.metadata,
				component: mod.default,
			});
		}
	}

	articles.sort((a, b) => {
		return a.date.getTime() < b.date.getTime();
	});

	return {
		articles,
	}
}

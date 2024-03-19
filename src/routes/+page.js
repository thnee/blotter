export function load() {
	const mods = import.meta.glob("../**/+page.md", {eager: true});

	let articles = [];

	for (const [path, mod] of Object.entries(mods)) {
		if (path.includes("(articles)")) {
			articles.push({
				metadata: mod.metadata,
				component: mod.default,
			});
		}
	}
	return {
		articles,
	}
}

export function load() {
	const mods = import.meta.glob("../**/+page.md", {eager: true});

	let articles = [];

	for (const [path, mod] of Object.entries(mods)) {
		if (path.includes("(articles)")) {
			articles.push({
				date: mod.metadata.date,
				dateObj: new Date(mod.metadata.date),
				url: `/${mod.metadata.url}`,
				title: mod.metadata.title,
				tags: mod.metadata.tags,
			});
		}
	}

	articles = articles.sort((a, b) => {
		if (a.dateObj < b.dateObj) {
			return 1;
		} else {
			return -1;
		}
	});

	return {
		articles,
	}
}

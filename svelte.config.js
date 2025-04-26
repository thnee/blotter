import adapter from "@sveltejs/adapter-static";
import { mdsvex } from "mdsvex";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
	extensions: [".svelte", ".md"],

	preprocess: [
		vitePreprocess(),

		mdsvex({
			extensions: [".md"],
		}),
	],

	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			precompress: true,
			strict: true,
		}),
	},
};

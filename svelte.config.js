import adapter from "@sveltejs/adapter-static";
import { mdsvex } from "mdsvex";

export default {
	extensions: [".svelte", ".md"],

	preprocess: [
		mdsvex({
			extensions: [".md"],
		}),
	],

	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			precompress: true,
		}),
	},
};

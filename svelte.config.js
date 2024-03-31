import path from "path";
import { fileURLToPath } from "url";

import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { mdsvex } from "mdsvex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
	extensions: [".svelte", ".md"],

	preprocess: [
		preprocess({
			postcss: {
				configFilePath: path.resolve(__dirname, "postcss.config.js"),
			}
		}),
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

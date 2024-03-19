import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Unfonts from "unplugin-fonts/vite";

export default defineConfig({
	plugins: [
		sveltekit(),
		Unfonts({
			fontsource: {
				families: [
					{
						name: "Abril Fatface",
						weights: [400],
						styles: ["normal"],
					},
					{
						name: "IBM Plex Sans",
						weights: [100, 200, 300, 400, 500, 600, 700],
						styles: ["normal"],
					},
					{
						name: "IBM Plex Mono",
						weights: [100, 200, 300, 400, 500, 600, 700],
						styles: ["normal"],
					},
				],
			},
		}),
	]
});

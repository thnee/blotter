import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (ctx) => {
	let lightningcss = false;

	if (ctx.env === "production") {
		lightningcss = {};
	}

	return {
		plugins: {
			"tailwindcss/nesting": {},
			"tailwindcss": path.resolve(__dirname, "./tailwind.config.js"),
			"postcss-import": {},
			"postcss-preset-env": {},
			"postcss-lightningcss": lightningcss,
		},
	};
};

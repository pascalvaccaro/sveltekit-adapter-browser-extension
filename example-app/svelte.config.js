import adapter from 'sveltekit-adapter-browser-extension';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter({
			// default options are shown
			pages: 'build', // the output directory for the pages of your extension
			assets: undefined, // the asset output directory is derived from pages if not specified explicitly
			fallback: undefined, // set to true to output an SPA-like extension
			manifestVersion: 3 // the version of the automatically generated manifest (Version 3 is required by Chrome).
		}),
		appDir: 'ext', // This is important - chrome extensions can't handle the default _app directory name.
		prerender: {
			default: true
		}
	}
};

export default config;

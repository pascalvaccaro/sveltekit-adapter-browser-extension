import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	logLevel: 'info',
	plugins: [sveltekit()]
};

export default config;

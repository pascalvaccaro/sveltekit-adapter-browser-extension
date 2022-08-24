import { join, basename, resolve, extname } from 'node:path';
import { writeFile, readFile, stat } from 'node:fs/promises';
import ts from 'typescript';
import glob from 'tiny-glob';
import sjcl from 'sjcl';
import * as cheerio from 'cheerio';
import { applyToDefaults } from '@hapi/hoek';

const manifest_filename = 'manifest.json';

function hash_script(s) {
	const hashed = sjcl.hash.sha256.hash(s);
	return sjcl.codec.base64.fromBits(hashed);
}

/**
 * Generates the Content-Security-Policy string
 * @param {String} html 
 * @returns {String}
 */
function generate_csp(html) {
	const $ = cheerio.load(html);
	const csp_hashes = $('script[type="module"]')
		.map((_, el) => hash_script($(el).text()))
		.toArray()
		.map((h) => `'sha256-${h}'`)
		.join(' ');
	return `script-src 'self' ${csp_hashes}; object-src 'self'`;
}

/**
 * Generates the final manifest file
 * @param {String} html 
 * @param {Number} manifest_version 
 * @returns {Object}
 */
function generate_manifest(html, manifest = {}) {
	if (manifest.version === 2) {
		return {
			manifest_version: 2,
			browser_action: {
				default_title: 'SvelteKit',
				default_popup: 'index.html',
			},
			content_security_policy: generate_csp(html),
			...manifest,
		};
	}
	return {
		manifest_version: 3,
		action: {
			default_title: 'SvelteKit',
			default_popup: 'index.html',
		},
		...manifest,
		content_security_policy: {
			extension_pages: "script-src 'self'; object-src 'self'",
			...(manifest.content_security_policy || {}),
		},
	};
}

/**
 * 
 * @returns {Promise<Record<string, unknown>>}
 */
async function load_manifest() {
	const stats = await stat(manifest_filename);
	if (stats.isFile()) {
		const content = await readFile(manifest_filename, 'utf-8');
		const json = JSON.parse(content);
		delete json.$schema;
		return json;
	}

	return {};
}

/**
 * 
 * @desc Quick and dirty helper function to externalize scripts. Will become obsolete once kit provides a config option to do this ahead of time.
 * @param {String} html 
 * @param {String} assets 
 * @returns {Promise<String>}
 */
async function externalizeScript(html, assets) {
	let hash = '';
	let innerText = '';
	const updated = html.replace(
		/<script type="module" data-sveltekit-hydrate="([\s\S]+)">([\s\S]+)<\/script>/,
		(_, hydrationTarget, content) => {
			innerText = content;
			hash = Buffer.from(hash_script(content), 'base64').toString('hex');
			return `<script type="module" data-sveltekit-hydrate="${hydrationTarget}" src="${hash}.js"></script>`;
		}
	);
	const externalized_scriptsPath = join(assets, `${hash}.js`);
	await writeFile(externalized_scriptsPath, innerText);
	return updated;
}

/**
 * Another helper to build and copy assets referenced as background & content_scripts 
 * @typedef {(sourcePath: String, tsConfig: Object) => Promise<string>} Extractor
 * @param {import('@sveltejs/kit').Builder} builder The SvelteKit Builder
 * @param {String} buildDir The 'build' directory
 * @returns {{ js: Extractor; css: Extractor }}
 */
function extractorFactory(builder, buildDir) {
	const extractTo = (targetDir) => {
		const outDir = join(buildDir, targetDir);
		builder.mkdirp(outDir);
		return async (sourcePath, tsConfig = {}) => {
			const fullSourcePath = resolve(process.cwd(), sourcePath);
			const isTypescript = extname(fullSourcePath) === '.ts';
			const targetFileName = isTypescript ? basename(fullSourcePath, '.ts').concat('.js') : basename(fullSourcePath);
			if (isTypescript) {
				const content = await readFile(fullSourcePath);
				const js = ts.transpile(content.toString(), { allowJS: true, ...tsConfig });
				await writeFile(join(outDir, targetFileName), js.toString());
			} else {
				builder.copy(fullSourcePath, join(outDir, targetFileName));
			}
			return join(targetDir, targetFileName);
		};
	};

	return {
		js: extractTo('scripts'),
		css: extractTo('styles'),
	}
}

/**
 * SvelteKit Web Extension Adapter
 * @param {{
 * 	pages: String,
 * 	assets: String,	
 * 	fallback: String,
 * 	manifest: Record<string, unknown>,
 * }} opts
 * @returns 
 */
export default function (opts = {}) {
	const {
		pages = 'build',
		assets = pages,
		fallback = '',
		manifest = {}
	} = opts;
	return {
		name: 'sveltekit-adapter-webext',

		/**
		 * 
		 * @param {import('@sveltejs/kit').Builder} builder 
		 */
		async adapt(builder) {
			if (!fallback && !builder.config.kit.prerender.default) {
				builder.log.warn(
					'You should set `config.kit.prerender.default` to `true` if no fallback is specified'
					);
				}
			builder.rimraf(assets);
			builder.rimraf(pages);
			builder.writeClient(assets);
			builder.writePrerendered(pages, { fallback });
			
			const index_page = join(assets, 'index.html');
			const [index, provided_manifest] = await Promise.all([
				readFile(index_page),
				load_manifest(),
			]);
			const generated_manifest = generate_manifest(index.toString(), manifest);
			const merged_manifest = applyToDefaults(generated_manifest, provided_manifest, { nullOverride: true });
			/** The content security policy of manifest_version 3 does not allow for inlined scripts.
			 Until kit implements a config option (#1776) to externalize scripts, the below code block should do 
			 for a quick and dirty externalization of the scripts' contents **/
			if (merged_manifest.manifest_version !== 2) {
				const HTML_files = await glob('**/*.html', {
					cwd: pages,
					dot: true,
					absolute: true,
					filesOnly: true
				});
				await Promise.all(HTML_files.map((path) =>
					readFile(path, { encoding: 'utf8' })
						.then(result => externalizeScript(result, assets))
						.then(html => writeFile(path, html))
				));
			}

			/**
			 * All scripts referenced in the `background` and `content_scripts` keys of the manifest
			 * should be copied to the destination directory, after being transpiled if necessary (TypeScript)
			 * 
			 * /!\ Content Scripts cannot be bundled as ES modules. Background Scripts can be modules in manifest V3
			 */
			const extractor = extractorFactory(builder, pages);
			const { background, content_scripts } = merged_manifest;
			if (background) {
				if (merged_manifest.manifest_version === 3 && 'service_worker' in background) {
					const { service_worker: sourcePath, type } = background;
					merged_manifest.background.service_worker = await extractor.js(sourcePath, { module: type === 'module' ? ts.ModuleKind.ES2022 : ts.ModuleKind.None });
				} else if ('scripts' in background) {
					const { scripts } = background;
					merged_manifest.background.scripts = await Promise.all(scripts.map(sourcePath => extractor.js(sourcePath, { module: ts.ModuleKind.None, target: 'ES5' })));
				}
			}
			if (Array.isArray(content_scripts)) {
				merged_manifest.content_scripts = await Promise.all(content_scripts.map(async (config) => {
					if (!config) return config;
					const [js, css] = await Promise.all(
						['js', 'css'].map(prop =>
							Promise.all((config[prop] || []).map(
								sourcePath => extractor[prop](sourcePath, { module: ts.ModuleKind.None, target: 'ES5' }))
							)));
					return { ...config, js, css };
				}));
			}

			await writeFile(join(assets, manifest_filename), JSON.stringify(merged_manifest));
			builder.rimraf(join(assets, '_app'));
		}
	};
}

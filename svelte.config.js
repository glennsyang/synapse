import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),

		// Nonce-based CSP. SvelteKit generates a per-request nonce, injects it into the
		// inline <script>/<style> it emits during SSR, and sets the Content-Security-Policy
		// header itself — hooks.server.ts must NOT set that header. Cross-repo strategy and
		// the per-app allowance table live in sheppakai-budget's docs/CSP.md.
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				// No unsafe-eval: layerchart/d3-scale/d3-shape do not use Function()/eval();
				// the nonce covers SvelteKit-injected scripts. sveltekit-superforms -> arktype
				// (@ark/util) fires a one-shot `new Function("return false")()` CSP probe on
				// first import — CSP blocks it (expected), ArkType catches it and runs jitless
				// for the session. The console warning is benign; do NOT add 'unsafe-eval'.
				'script-src': ['self'],
				// <style> elements: nonce covers SSR-injected ones. unsafe-inline retained for
				// chart-style.svelte, which injects <style> at runtime after SSR (no nonce
				// available). fonts.googleapis.com: Google Fonts stylesheet loaded in app.html.
				'style-src-elem': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				// style="" attributes: unsafe-inline for runtime-computed CSS custom properties
				// (bits-ui, chart colour vars) that cannot be hashed ahead of time.
				'style-src-attr': ['unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				'connect-src': [
					'self',
					'https://*.ingest.us.sentry.io',
					'https://*.ingest.sentry.io',
					'https://nominatim.openstreetmap.org',
					'https://api.open-meteo.com'
				],
				'manifest-src': ['self'],
				'worker-src': ['self'],
				'frame-ancestors': ['none'],
				'frame-src': ['none'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		},

		experimental: {
			explicitEnvironmentVariables: true
		}
	}
};

export default config;

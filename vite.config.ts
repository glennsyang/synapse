import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			ignored: ['**/data/**', '**/node_modules/**']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte.ts}'],
			exclude: [
				'src/**/*.test.ts',
				'src/**/*.d.ts',
				'src/routes/**',
				'src/lib/components/ui/**',
				'src/app.ts',
				'src/service-worker.ts'
			],
			reporter: ['text', 'lcov', 'html', 'json-summary', 'json'],
			thresholds: {
				statements: 30,
				branches: 30,
				functions: 30,
				lines: 30
			}
		},
		reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default']
	}
});

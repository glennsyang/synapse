import { build } from 'esbuild';

try {
	await build({
		entryPoints: ['src/lib/scripts/email-notifications.ts'],
		bundle: true,
		platform: 'node',
		target: 'node22',
		outfile: 'build/scripts/email-notifications.js',
		format: 'esm',
		external: ['better-sqlite3', 'resend'], // Keep native modules external
		banner: {
			js: '#!/usr/bin/env node'
		},
		minify: false, // Keep readable for debugging
		sourcemap: true
	});
	console.log('✅ Scripts built successfully');
} catch (error) {
	console.error('❌ Script build failed:', error);
	process.exit(1);
}

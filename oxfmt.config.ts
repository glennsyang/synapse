import { defineConfig } from 'oxfmt';

export default defineConfig({
	arrowParens: 'always',
	ignorePatterns: [
		'.claude',
		'.fallow',
		'.svelte-kit',
		'.wrangler',
		'build',
		'coverage',
		'data',
		'node_modules',
		'package-lock.json',
		'/static',
		'/drizzle',
		'src/lib/components/ui/',
		'/.github/skills/',
		'/AGENTS.md',
		'*.toml'
	],
	printWidth: 100,
	semi: true,
	singleQuote: true,
	sortImports: true,
	sortTailwindcss: true,
	svelte: true,
	tabWidth: 2,
	trailingComma: 'none',
	useTabs: true
});

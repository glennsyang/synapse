import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	{
		ignores: ['src/lib/components/ui/**']
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			// Disable resolve() requirement for internal navigation (not using base path)
			'svelte/no-navigation-without-resolve': 'off',
			// Allow unused variables that start with underscore
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						// Side effect imports at the start
						['^\\u0000'],
						// Node.js builtins prefixed with `node:`
						['^node:'],
						// Packages (things that start with a letter, digit, underscore, or `@`)
						['^@?\\w'],
						// Internal packages and absolute imports
						['^(\\$lib|\\$app)(/.*|$)'],
						// Parent imports (../)
						['^\\.\\.(?!/?$)', '^\\.\\./?$'],
						// Other relative imports (./)
						['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
						// Type imports
						['^.+\\.?(css|scss|sass|less)$']
					]
				}
			],
			'simple-import-sort/exports': 'error'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);

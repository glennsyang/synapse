/** @type {import('lint-staged').Configuration} */
const config = {
	'*.{js,ts,svelte}': [
		'npm run fmt',
		() => 'npm run lint'
	],
	'*.svelte': () => 'svelte-check --threshold error',
	'*.{json,md,css,html,svg}': ['npm run fmt']
};

export default config;

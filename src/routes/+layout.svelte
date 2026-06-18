<script lang="ts">
	import { browser, dev } from '$app/env';

	let { children } = $props();

	if (browser && 'serviceWorker' in navigator) {
		void navigator.serviceWorker
			.register('/service-worker.js', {
				type: dev ? 'module' : 'classic'
			})
			.catch(() => {
				// Registration can fail in unsupported/private contexts; fail silently.
			});
	}
</script>

{@render children()}

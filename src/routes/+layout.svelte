<script lang="ts">
	import { browser, dev } from '$app/env';
	import { ModeWatcher } from 'mode-watcher';

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

<!-- Head script disabled: app.html runs a nonced copy so CSP doesn't block it. -->
<ModeWatcher disableHeadScriptInjection />
{@render children()}

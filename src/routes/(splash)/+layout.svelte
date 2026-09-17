<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

	import '../../app.css';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/icons/icon-192.png" type="image/png" /></svelte:head>

<ModeWatcher />
{@render children()}

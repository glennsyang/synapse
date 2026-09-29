<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/icons/icon-192.png" type="image/png" /></svelte:head>

{@render children()}

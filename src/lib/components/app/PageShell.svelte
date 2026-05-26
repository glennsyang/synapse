<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class={`mobile-container mx-auto w-full max-w-7xl min-w-0 py-4 sm:py-8 ${className}`.trim()}>
	{@render children?.()}
</div>

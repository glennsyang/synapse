<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class={`mx-auto w-full max-w-7xl min-w-0 ${className}`.trim()}>
	{@render children?.()}
</div>

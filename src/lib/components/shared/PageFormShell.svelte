<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		class?: string;
		maxWidth?: '2xl' | '3xl';
	}

	let { children, class: className = '', maxWidth = '2xl' }: Props = $props();

	const maxWidthClass = $derived(maxWidth === '3xl' ? 'max-w-3xl' : 'max-w-2xl');
</script>

<div class={cn('container mx-auto py-8', maxWidthClass, className)}>{@render children?.()}</div>

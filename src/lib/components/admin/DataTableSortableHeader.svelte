<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	let {
		label,
		sorted,
		onclick
	}: {
		label: string;
		sorted: false | 'asc' | 'desc';
		onclick: (event: MouseEvent) => void;
	} = $props();
</script>

<Button variant="ghost" size="sm" class="-ml-3 h-8" {onclick}>
	{label}
	{#if sorted === 'asc'}
		<ArrowUp class="ml-2 size-4" />
	{:else if sorted === 'desc'}
		<ArrowDown class="ml-2 size-4" />
	{:else}
		<ArrowUpDown class="ml-2 size-4" />
	{/if}
</Button>

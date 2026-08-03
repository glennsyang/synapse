<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import type { ComponentProps } from 'svelte';

	interface DataTableSortButtonProps extends ComponentProps<typeof Button> {
		columnName: string;
		iconPosition?: 'left' | 'right';
	}

	let {
		variant = 'ghost',
		columnName,
		iconPosition = 'right',
		...restProps
	}: DataTableSortButtonProps = $props();
</script>

<Button {variant} {...restProps}>
	{#if iconPosition === 'left'}
		<ArrowUpDownIcon class="me-2" />
		{columnName}
	{:else}
		{columnName}
		<ArrowUpDownIcon class="ms-2" />
	{/if}
</Button>

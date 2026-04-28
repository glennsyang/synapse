<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	let {
		color = 'teal',
		showIcon = true,
		class: className,
		...restProps
	}: {
		color?: 'teal' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';
		showIcon?: boolean;
		class?: string;
	} = $props();
</script>

<div class={cn('rounded-lg border bg-card p-6 shadow-xs', className)} {...restProps}>
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1 space-y-3">
			<Skeleton class="h-4 w-24" />
			<Skeleton class="h-9 w-20" />
			<Skeleton class="h-4 w-32" />
		</div>
		{#if showIcon}
			<Skeleton class="size-12 rounded-full bg-[oklch(var(--color-{color})/0.2)]" />
		{/if}
	</div>
</div>

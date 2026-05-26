<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	let {
		showBreadcrumb = false,
		color = 'teal',
		class: className,
		...restProps
	}: {
		showBreadcrumb?: boolean;
		color?: 'teal' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';
		class?: string;
	} = $props();
</script>

<div class={cn('space-y-6', className)} {...restProps}>
	<!-- Breadcrumb Skeleton (optional) -->
	{#if showBreadcrumb}
		<div class="flex items-center gap-2">
			<Skeleton class="h-4 w-20" />
			<Skeleton class="h-4 w-4" />
			<Skeleton class="h-4 w-32" />
		</div>
	{/if}

	<!-- Header Skeleton -->
	<div class="space-y-4">
		<div class="flex items-center gap-3">
			<Skeleton class="h-1 w-12 rounded-full bg-[oklch(var(--color-{color})/0.3)]" />
			<Skeleton class="h-8 w-48 md:h-10 md:w-64" />
		</div>
		<Skeleton class="h-5 w-full max-w-xl" />
		<Skeleton class="h-1 w-full rounded-full bg-[oklch(var(--color-{color})/0.3)]" />
	</div>

	<!-- Content Area Skeleton -->
	<div class="space-y-4">
		{#each [1, 2, 3] as _ (_)}
			<div class="bg-card rounded-lg border p-6 shadow-xs">
				<Skeleton class="mb-3 h-6 w-40" />
				<div class="space-y-2">
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-3/4" />
				</div>
			</div>
		{/each}
	</div>
</div>

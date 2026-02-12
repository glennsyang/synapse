<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		...restProps
	}: {
		class?: string;
	} = $props();
</script>

<div class={cn('space-y-6', className)} {...restProps}>
	<!-- Hero Section Skeleton -->
	<div class="space-y-4">
		<div class="flex items-center gap-3">
			<Skeleton class="h-1 w-12 rounded-full bg-[oklch(var(--color-teal)/0.3)]" />
			<Skeleton class="h-10 w-64 md:h-12 md:w-96" />
		</div>
		<Skeleton class="h-6 w-48" />
	</div>

	<!-- Quick Stats Row Skeleton -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each [1, 2, 3] as _ (_)}
			<div class="rounded-lg border bg-card p-6 shadow-xs">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 space-y-3">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-9 w-16" />
						<Skeleton class="h-4 w-32" />
					</div>
					<Skeleton class="size-12 rounded-full bg-[oklch(var(--color-teal)/0.2)]" />
				</div>
			</div>
		{/each}
	</div>

	<!-- Feature Navigation Skeleton -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each [1, 2, 3, 4, 5, 6] as _, i (_)}
			{@const colors = ['teal', 'blue', 'orange', 'green', 'purple', 'pink']}
			{@const color = colors[i % colors.length]}
			<div class="rounded-lg border bg-card p-6 shadow-xs">
				<div class="space-y-4">
					<Skeleton class="size-16 rounded-2xl bg-[oklch(var(--color-{color})/0.2)]" />
					<div class="space-y-2">
						<Skeleton class="h-6 w-32" />
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-3/4" />
					</div>
					<Skeleton class="h-8 w-20" />
				</div>
			</div>
		{/each}
	</div>

	<!-- Chart Placeholder Skeleton -->
	<div class="rounded-lg border bg-card p-6 shadow-xs">
		<Skeleton class="mb-4 h-6 w-48" />
		<Skeleton class="h-64 w-full rounded-md" />
	</div>

	<!-- Calendar Skeleton -->
	<div class="rounded-lg border bg-card p-6 shadow-xs">
		<Skeleton class="mb-4 h-6 w-40" />
		<div class="grid grid-cols-7 gap-2">
			{#each Array(35) as _ (_)}
				<Skeleton class="aspect-square w-full rounded-md" />
			{/each}
		</div>
	</div>
</div>

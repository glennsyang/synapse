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

<div class={cn('space-y-8', className)} {...restProps}>
	<!-- Hero Band Skeleton -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-2">
			<Skeleton class="h-10 w-72 md:h-12 md:w-96" />
			<Skeleton class="h-4 w-40" />
		</div>
	</div>

	<!-- Command Strip: 3 Stat Cards Skeleton -->
	<div class="grid gap-4 sm:grid-cols-3">
		{#each [1, 2, 3] as i (i)}
			<div class="rounded-2xl border bg-card p-5 shadow-xs">
				<div class="flex items-start justify-between">
					<Skeleton class="size-10 rounded-xl" />
					<Skeleton class="h-5 w-12 rounded-full" />
				</div>
				<div class="mt-4 space-y-2">
					<Skeleton class="h-10 w-16" />
					<Skeleton class="h-4 w-40" />
				</div>
			</div>
		{/each}
	</div>

	<!-- Analytics Row 1 Skeleton -->
	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-2xl border bg-card p-5 shadow-xs">
			<div class="mb-4 flex items-center gap-2">
				<Skeleton class="size-7 rounded-lg" />
				<div class="space-y-1">
					<Skeleton class="h-4 w-40" />
					<Skeleton class="h-3 w-20" />
				</div>
			</div>
			<Skeleton class="h-12 w-24" />
			<Skeleton class="mt-3 h-32 w-full rounded-lg" />
		</div>
		<div class="rounded-2xl border bg-card p-5 shadow-xs">
			<div class="mb-4 flex items-center gap-2">
				<Skeleton class="size-7 rounded-lg" />
				<div class="space-y-1">
					<Skeleton class="h-4 w-24" />
					<Skeleton class="h-3 w-32" />
				</div>
			</div>
			<div class="space-y-4">
				{#each [1, 2, 3, 4] as i (i)}
					<div class="flex items-center justify-between">
						<Skeleton class="h-4 w-36" />
						<Skeleton class="h-8 w-12" />
					</div>
					{#if i < 4}
						<Skeleton class="h-px w-full" />
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Analytics Row 2 Skeleton -->
	<div class="grid gap-4 md:grid-cols-2">
		{#each [1, 2] as i (i)}
			<div class="rounded-2xl border bg-card p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<Skeleton class="size-7 rounded-lg" />
					<div class="space-y-1">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-3 w-24" />
					</div>
				</div>
				<Skeleton class="h-12 w-20" />
				<Skeleton class="mt-3 h-32 w-full rounded-lg" />
			</div>
		{/each}
	</div>

	<!-- Activity Feed Skeleton -->
	<div class="rounded-2xl border bg-card shadow-xs">
		<div class="border-b px-5 py-4">
			<Skeleton class="h-4 w-32" />
		</div>
		{#each [1, 2, 3, 4, 5] as i (i)}
			<div class="flex items-start gap-3 px-5 py-3.5">
				<Skeleton class="mt-0.5 size-7 shrink-0 rounded-md" />
				<div class="flex-1 space-y-1.5">
					<Skeleton class="h-4 w-3/4" />
					<Skeleton class="h-3 w-40" />
				</div>
			</div>
		{/each}
	</div>
</div>

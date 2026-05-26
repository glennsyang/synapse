<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	interface VisitHealthCounts {
		critical: number;
		overdue: number;
		healthy: number;
		noVisits: number;
		total: number;
	}

	interface VisitHealthNames {
		critical: string[];
		overdue: string[];
		healthy: string[];
		noVisits: string[];
	}

	let {
		counts,
		names,
		upcomingVisits = []
	}: {
		counts: VisitHealthCounts;
		names: VisitHealthNames;
		upcomingVisits?: { dayLabel: string; names: string[]; isToday: boolean }[];
	} = $props();

	const stats = $derived([
		{
			label: 'Critical',
			value: counts.critical,
			names: names.critical,
			href: '/visits?status=red',
			dotClass: 'bg-red-500',
			valueClass: 'text-red-500',
			bgClass: 'bg-red-500/10 hover:bg-red-500/20'
		},
		{
			label: 'Overdue',
			value: counts.overdue,
			names: names.overdue,
			href: '/visits?status=yellow',
			dotClass: 'bg-amber-500',
			valueClass: 'text-amber-500',
			bgClass: 'bg-amber-500/10 hover:bg-amber-500/20'
		},
		{
			label: 'Healthy',
			value: counts.healthy,
			names: names.healthy,
			href: '/visits?status=green',
			dotClass: 'bg-[oklch(var(--color-green))]',
			valueClass: 'text-[oklch(var(--color-green))]',
			bgClass: 'bg-[oklch(var(--color-green)/0.1)] hover:bg-[oklch(var(--color-green)/0.2)]'
		},
		{
			label: 'No Visits',
			value: counts.noVisits,
			names: names.noVisits,
			href: '/visits?status=none',
			dotClass: 'bg-muted-foreground/60',
			valueClass: 'text-muted-foreground',
			bgClass: 'bg-muted/60 hover:bg-muted'
		}
	]);

	const urgentCount = $derived(counts.critical + counts.overdue);
</script>

<Tooltip.Provider>
	<div class="flex h-full flex-col gap-3">
		<div class="flex items-end gap-3">
			<span
				class="font-display text-5xl font-bold tabular-nums leading-none text-[oklch(var(--color-pink))]"
			>
				{counts.total}
			</span>
			<span class="mb-1 text-sm text-muted-foreground">
				{counts.total === 1 ? 'person' : 'people'}
				tracked
			</span>
		</div>

		{#if urgentCount > 0}
			<p class="text-xs font-medium text-amber-600 dark:text-amber-400">
				{urgentCount}
				need{urgentCount === 1 ? 's' : ''}
				attention
			</p>
		{/if}

		<div class="grid grid-cols-2 gap-2">
			{#each stats as stat (stat.label)}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<a
								href={stat.href}
								{...props}
								class="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors {stat.bgClass}"
							>
								<span class="size-2 shrink-0 rounded-full {stat.dotClass}"></span>
								<div class="min-w-0">
									<div
										class="font-display text-xl font-bold tabular-nums leading-none {stat.valueClass}"
									>
										{stat.value}
									</div>
									<div class="mt-0.5 text-xs text-muted-foreground">{stat.label}</div>
								</div>
							</a>
						{/snippet}
					</Tooltip.Trigger>
					{#if stat.names.length > 0}
						<Tooltip.Content> {stat.names.join(', ')} </Tooltip.Content>
					{/if}
				</Tooltip.Root>
			{/each}
		</div>

		{#if upcomingVisits.length > 0}
			<div class="mt-1 border-t pt-3">
				<p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Scheduled
				</p>
				<div class="space-y-1.5">
					{#each upcomingVisits as day (day.dayLabel)}
						<div class="flex items-start gap-2 text-xs">
							<span
								class="mt-0.5 size-1.5 shrink-0 rounded-full {day.isToday
									? 'bg-[oklch(var(--color-pink))]'
									: 'bg-muted-foreground/40'}"
							></span>
							<div>
								<span
									class="font-medium {day.isToday
										? 'text-[oklch(var(--color-pink))]'
										: ''}"
									>{day.dayLabel}</span
								>
								<span class="ml-1 text-muted-foreground">{day.names.join(', ')}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Tooltip.Provider>

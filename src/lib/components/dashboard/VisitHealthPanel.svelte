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
			dotClass: 'bg-destructive',
			valueClass: 'text-destructive'
		},
		{
			label: 'Overdue',
			value: counts.overdue,
			names: names.overdue,
			href: '/visits?status=yellow',
			dotClass: 'bg-pen-warn',
			valueClass: 'text-pen-warn'
		},
		{
			label: 'Healthy',
			value: counts.healthy,
			names: names.healthy,
			href: '/visits?status=green',
			dotClass: 'bg-[oklch(var(--color-green))]',
			valueClass: 'text-[oklch(var(--color-green))]'
		},
		{
			label: 'No Visits',
			value: counts.noVisits,
			names: names.noVisits,
			href: '/visits?status=none',
			dotClass: 'bg-muted-foreground/60',
			valueClass: 'text-muted-foreground'
		}
	]);

	const urgentCount = $derived(counts.critical + counts.overdue);
</script>

<Tooltip.Provider>
	<div class="flex h-full flex-col gap-3">
		<div class="flex items-end gap-3">
			<span class="text-5xl leading-none font-black text-[oklch(var(--color-pink))] tabular-nums">
				{counts.total}
			</span>
			<span class="text-muted-foreground mb-1 text-sm">
				{counts.total === 1 ? 'person' : 'people'}
				tracked
			</span>
		</div>

		{#if urgentCount > 0}
			<p class="text-pen-warn dark:text-pen-warn text-xs font-medium">
				{urgentCount}
				need{urgentCount === 1 ? 's' : ''}
				attention
			</p>
		{/if}

		<div class="border-rule border-t">
			{#each stats as stat (stat.label)}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<a
								href={stat.href}
								{...props}
								class="border-rule hover:bg-muted/50 flex min-h-10 items-center gap-3 border-b text-sm transition-colors"
							>
								<span
									class="size-2 shrink-0 rounded-[1px] {stat.dotClass} {stat.label === 'Critical' &&
									stat.value > 0
										? 'critical-dot-pulse'
										: ''}"
								></span>
								<span class="w-20 shrink-0 font-bold">{stat.label}</span>
								<span class="text-muted-foreground min-w-0 flex-1 truncate text-xs">
									{stat.names.join(', ')}
								</span>
								<span class="text-lg leading-none font-black tabular-nums {stat.valueClass}">
									{stat.value}
								</span>
							</a>
						{/snippet}
					</Tooltip.Trigger>
					{#if stat.names.length > 0}
						<Tooltip.Content>{stat.names.join(', ')}</Tooltip.Content>
					{/if}
				</Tooltip.Root>
			{/each}
		</div>

		{#if upcomingVisits.length > 0}
			<div class="mt-1 border-t pt-3">
				<p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
					Scheduled
				</p>
				<div class="max-h-56 space-y-1.5 overflow-y-auto">
					{#each upcomingVisits as day (day.dayLabel)}
						<div class="flex items-start gap-2 text-xs">
							<span
								class="mt-0.5 size-1.5 shrink-0 rounded-full {day.isToday
									? 'bg-[oklch(var(--color-pink))]'
									: 'bg-muted-foreground/40'}"
							></span>
							<div>
								<span class="font-medium {day.isToday ? 'text-[oklch(var(--color-pink))]' : ''}"
									>{day.dayLabel}</span
								>
								<span class="text-muted-foreground ml-1">{day.names.join(', ')}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Tooltip.Provider>

<style>
	.critical-dot-pulse {
		animation: critical-dot-pulse 1.4s ease-in-out infinite;
		transform-origin: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.critical-dot-pulse {
			animation: none;
		}
	}

	@keyframes critical-dot-pulse {
		0%,
		100% {
			transform: scale(0.9);
			opacity: 0.55;
		}

		50% {
			transform: scale(1.15);
			opacity: 1;
		}
	}
</style>

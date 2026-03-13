<script lang="ts">
import { scaleUtc } from 'd3-scale';
import { curveNatural } from 'd3-shape';
import { LineChart } from 'layerchart';

import { Badge } from '$lib/components/ui/badge';
import * as Chart from '$lib/components/ui/chart/index.js';
import type { DailyAgendaChartPoint } from '$lib/types';
import { cn } from '$lib/utils';
import { parseLocalDateString } from '$lib/utils/date';

interface Props {
	points: DailyAgendaChartPoint[];
	rangeLabel: string;
}

function calculateAverageCompletion(points: DailyAgendaChartPoint[]): number {
	return points.length === 0
		? 0
		: Math.round(
				points.reduce((total, point) => total + point.completionPercentage, 0) / points.length
			);
}

let { points, rangeLabel }: Props = $props();

const chartData = $derived(
	points.map((point) => ({
		date: new Date(`${point.date}T00:00:00`),
		completion: point.completionPercentage,
		completedCount: point.completedCount,
		totalCount: point.totalCount
	}))
);

const chartConfig = {
	completion: { label: 'Completion', color: 'var(--chart-3)' }
} satisfies Chart.ChartConfig;

const averageCompletion = $derived(
	points.length === 0
		? 0
		: Math.round(
				points.reduce((total, point) => total + point.completionPercentage, 0) / points.length
			)
);

const bestPoint = $derived(
	points.reduce<DailyAgendaChartPoint | null>((best, point) => {
		if (!best || point.completionPercentage > best.completionPercentage) {
			return point;
		}

		return best;
	}, null)
);
const currentWindowPoints = $derived(points.slice(-7));
const previousWindowPoints = $derived(points.slice(0, Math.max(points.length - 7, 0)));
const currentWindowAverage = $derived(calculateAverageCompletion(currentWindowPoints));
const previousWindowAverage = $derived(calculateAverageCompletion(previousWindowPoints));
const completionDelta = $derived(currentWindowAverage - previousWindowAverage);
const shiftLabel = $derived(
	previousWindowPoints.length === 0
		? 'No prior ribbon yet'
		: completionDelta > 6
			? 'Heating up nicely'
			: completionDelta > 0
				? 'Climbing from the prior 7 days'
				: completionDelta < -6
					? 'Cooling off from the prior 7 days'
					: completionDelta < 0
						? 'Softer than the prior 7 days'
						: 'Even with the prior 7 days'
);
</script>

<section
	class="overflow-hidden rounded-[1.55rem] border border-orange-200/80 bg-linear-to-br from-orange-50/85 via-background to-orange-100/55 p-4 shadow-sm dark:border-orange-500/22 dark:from-orange-500/8 dark:via-background dark:to-amber-500/4 sm:p-5"
>
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge
					variant="orange"
					class="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
				>
					14-day ribbon
				</Badge>
				<span
					class="inline-flex rounded-full border border-orange-200/80 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:border-orange-500/20 dark:bg-background/70"
				>
					{rangeLabel}
				</span>
			</div>
			<div>
				<h3
					class="font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl"
				>
					Completion ribbon
				</h3>
				<p class="max-w-2xl text-sm leading-6 text-muted-foreground">
					A quieter read of the last two weeks, tuned to support the hero instead of competing with
					it.
				</p>
			</div>
		</div>

		<div
			class="rounded-[1.25rem] border border-orange-200/80 bg-background/82 px-4 py-3.5 shadow-xs backdrop-blur dark:border-orange-500/20 dark:bg-background/70"
		>
			<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				Current 7-day average
			</p>
			<div class="mt-2 flex items-end gap-3">
				<p class="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
					{currentWindowAverage}%
				</p>
				<span
					class={cn(
						'rounded-full border px-2.5 py-1 text-xs font-semibold',
						completionDelta > 0
							? 'border-emerald-300/80 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
							: completionDelta < 0
								? 'border-amber-300/80 bg-amber-100/85 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200'
								: 'border-orange-200/80 bg-orange-100/70 text-[oklch(var(--color-orange))] dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200'
					)}
				>
					{previousWindowPoints.length === 0
						? 'No prior data'
						: `${completionDelta > 0 ? '+' : ''}${completionDelta} pts`}
				</span>
			</div>
			<p class="mt-2 text-xs leading-5 text-muted-foreground">{shiftLabel}</p>
		</div>
	</div>

	<div
		class="mt-4 rounded-[1.35rem] border border-orange-200/80 bg-background/88 p-3 shadow-xs dark:border-orange-500/22 dark:bg-background/80 sm:p-4"
	>
		<div
			class="rounded-[1.15rem] bg-linear-to-br from-orange-50/80 via-background to-orange-100/45 p-3 dark:from-orange-500/7 dark:via-background dark:to-amber-500/4"
		>
			<Chart.Container config={chartConfig} class="aspect-auto h-44 w-full sm:h-52">
				<LineChart
					points={{ r: 4 }}
					data={chartData}
					x="date"
					xScale={scaleUtc()}
					axis="x"
					series={[
						{
							key: 'completion',
							label: 'Completion',
							color: chartConfig.completion.color
						}
					]}
					props={{
						spline: { curve: curveNatural, motion: 'tween', strokeWidth: 3 },
						highlight: {
							points: {
								motion: 'none',
								r: 6.5
							}
						},
						xAxis: {
							format: (value: Date) =>
								value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
						},
						yAxis: {
							format: (value: number) => `${value}%`
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip
							labelFormatter={(value: Date) =>
								value.toLocaleDateString('en-US', {
									weekday: 'short',
									month: 'short',
									day: 'numeric'
								})}
							indicator="line"
						/>
					{/snippet}
				</LineChart>
			</Chart.Container>
		</div>
	</div>

	<div class="mt-4 grid gap-3 sm:grid-cols-3">
		<div
			class="rounded-[1.15rem] border border-orange-200/80 bg-orange-50/80 px-4 py-3.5 shadow-xs dark:border-orange-500/20 dark:bg-orange-500/8"
		>
			<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				14-day average
			</p>
			<p
				class="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
			>
				{averageCompletion}%
			</p>
			<p class="mt-2 text-xs leading-5 text-muted-foreground">Across the full ribbon window</p>
		</div>

		<div
			class="rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3.5 shadow-xs backdrop-blur dark:bg-background/70"
		>
			<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				Best day
			</p>
			<p
				class="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
			>
				{bestPoint?.completionPercentage ?? 0}%
			</p>
			<p class="mt-2 text-xs leading-5 text-muted-foreground">
				{#if bestPoint}
					{parseLocalDateString(bestPoint.date).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric'
					})}
				{:else}
					No data yet
				{/if}
			</p>
		</div>

		<div
			class={cn(
				'rounded-[1.15rem] border px-4 py-3.5 shadow-xs',
				completionDelta > 0
					? 'border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/8'
					: completionDelta < 0
						? 'border-amber-300/70 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10'
						: 'border-orange-200/80 bg-background/80 backdrop-blur dark:border-orange-500/20 dark:bg-background/70'
			)}
		>
			<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				Week-over-week
			</p>
			<p
				class="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
			>
				{previousWindowPoints.length === 0 ? '—' : `${completionDelta > 0 ? '+' : ''}${completionDelta} pts`}
			</p>
			<p class="mt-2 text-xs leading-5 text-muted-foreground">{shiftLabel}</p>
		</div>
	</div>
</section>

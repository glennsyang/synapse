<script lang="ts">
import { scaleUtc } from 'd3-scale';
import { curveNatural } from 'd3-shape';
import { LineChart } from 'layerchart';
import * as Card from '$lib/components/ui/card';
import * as Chart from '$lib/components/ui/chart/index.js';
import type { DailyAgendaChartPoint } from '$lib/types';
import { parseLocalDateString } from '$lib/utils/date';

interface Props {
	points: DailyAgendaChartPoint[];
	rangeLabel: string;
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
</script>

<Card.Root
	class="overflow-hidden border-orange-200/80 bg-linear-to-br from-orange-50/70 via-background to-amber-50/60 dark:border-orange-500/25 dark:from-orange-500/8 dark:via-background dark:to-amber-500/5"
>
	<Card.Header class="gap-1.5 px-4 py-4 sm:px-5">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<Card.Title class="font-display text-lg sm:text-xl">Completion Trend</Card.Title>
				<Card.Description>Last 14 days of Daily Agenda completion.</Card.Description>
			</div>
			<p class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
				{rangeLabel}
			</p>
		</div>
	</Card.Header>
	<Card.Content class="space-y-4 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
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
					spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2.5 },
					highlight: {
						points: {
							motion: 'none',
							r: 6
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
	</Card.Content>
	<Card.Footer
		class="grid gap-2 border-t border-orange-100/80 bg-orange-50/45 px-4 py-3 dark:border-orange-500/20 dark:bg-orange-500/6 sm:grid-cols-3 sm:px-5"
	>
		<div>
			<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Average</p>
			<p class="mt-1 text-base font-semibold text-foreground sm:text-lg">{averageCompletion}%</p>
		</div>
		<div>
			<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Best Day</p>
			<p class="mt-1 text-base font-semibold text-foreground sm:text-lg">
				{#if bestPoint}
					{parseLocalDateString(bestPoint.date).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric'
					})}
				{:else}
					No data
				{/if}
			</p>
		</div>
		<div>
			<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Peak Score</p>
			<p class="mt-1 text-base font-semibold text-foreground sm:text-lg">
				{bestPoint?.completionPercentage ?? 0}%
			</p>
		</div>
	</Card.Footer>
</Card.Root>

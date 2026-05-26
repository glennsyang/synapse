<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { parseLocalDateString } from '$lib/utils/date';
	import { getMoodScoreLabel } from '$lib/utils/mood';
	import AreaChartIcon from '@lucide/svelte/icons/chart-area';
	import { scaleUtc } from 'd3-scale';
	import { AreaChart } from 'layerchart';

	interface MoodTrendPoint {
		date: string;
		score: number;
		resolvedMood: string;
		isCustom: boolean;
		fill: string;
	}

	interface Props {
		points: MoodTrendPoint[];
		rollingAvgPoints: { date: string; rollingAvg: number }[];
		rangeLabel: string;
		averageScore: number | null;
	}

	let { points, rollingAvgPoints, rangeLabel, averageScore }: Props = $props();

	const chartData = $derived(
		points.map((point, index) => ({
			...point,
			date: parseLocalDateString(point.date),
			rollingAvg: rollingAvgPoints[index]?.rollingAvg ?? point.score
		}))
	);

	const hasCustomMood = $derived(points.some((point) => point.isCustom));

	const chartConfig = {
		score: { label: 'Mood score', color: 'var(--chart-2)' },
		rollingAvg: { label: '7-day avg', color: 'var(--chart-4)' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title class="font-display flex items-center gap-2">
			<AreaChartIcon class="h-4 w-4 text-[oklch(var(--color-orange))]" />
			Mood trend
		</Card.Title>
		<Card.Description>
			{rangeLabel}
			{#if hasCustomMood}
				• Custom moods appear on the neutral baseline.
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if points.length < 2}
			<div
				class="border-border/80 bg-muted/20 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center"
			>
				<p class="font-display text-xl font-semibold">Add a little more data</p>
				<p class="text-muted-foreground mt-2 max-w-md text-sm">
					The area chart becomes useful once you have at least two logged days in the selected
					range.
				</p>
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="h-75 w-full">
				<AreaChart
					data={chartData}
					x="date"
					y="score"
					xScale={scaleUtc()}
					axis="x"
					series={[
						{
							key: 'score',
							label: 'Mood score',
							color: chartConfig.score.color
						},
						{
							key: 'rollingAvg',
							label: '7-day avg',
							color: chartConfig.rollingAvg.color
						}
					]}
					props={{
						points: {
							r: 4
						},
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
							format: (value: number) => getMoodScoreLabel(value)
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip
							labelFormatter={(value: Date) =>
								value.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric'
								})}
							indicator="line"
						/>
					{/snippet}
				</AreaChart>
			</Chart.Container>
		{/if}
	</Card.Content>
	<Card.Footer class="border-border/60 text-muted-foreground border-t pt-4 text-sm">
		{#if averageScore !== null}
			Average mood score: <span class="text-foreground ml-1 font-medium">{averageScore}</span>
		{:else}
			Mood score scale runs from Sad (1) to Happy (7).
		{/if}
	</Card.Footer>
</Card.Root>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import { getMoodScoreLabel } from '$lib/utils/mood';
	import BarChartIcon from '@lucide/svelte/icons/bar-chart-2';
	import { BarChart } from 'layerchart';

	interface WeekdayPoint {
		day: string;
		avgScore: number | null;
		count: number;
	}

	interface Props {
		weekdayAvg: WeekdayPoint[];
		rangeLabel: string;
	}

	let { weekdayAvg, rangeLabel }: Props = $props();

	const chartData = $derived(
		weekdayAvg.map((point) => ({
			...point,
			avgScore: point.avgScore ?? 0
		}))
	);

	const hasData = $derived(weekdayAvg.some((p) => p.count > 0));

	const chartConfig = {
		avgScore: { label: 'Avg mood', color: 'oklch(var(--color-orange))' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title class="font-display flex items-center gap-2">
			<BarChartIcon class="h-4 w-4 text-[oklch(var(--color-orange))]" />
			Mood by day of week
		</Card.Title>
		<Card.Description>{rangeLabel}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if !hasData}
			<div
				class="border-border/80 bg-muted/20 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center"
			>
				<p class="font-display text-xl font-semibold">No data yet</p>
				<p class="text-muted-foreground mt-2 text-sm">
					Log moods across multiple days to see which days tend to feel best.
				</p>
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="h-56 w-full">
				<BarChart
					data={chartData}
					x="day"
					y="avgScore"
					series={[{ key: 'avgScore', label: 'Avg mood', color: chartConfig.avgScore.color }]}
					props={{
						yAxis: {
							format: (value: number) => (value > 0 ? getMoodScoreLabel(value) : '')
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip labelFormatter={(value: string) => value} indicator="line" />
					{/snippet}
				</BarChart>
			</Chart.Container>
		{/if}
	</Card.Content>
</Card.Root>

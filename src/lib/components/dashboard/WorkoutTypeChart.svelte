<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { getWorkoutLabel } from '$lib/utils/workout';
	import { BarChart } from 'layerchart';

	interface WorkoutTypeCount {
		type: string;
		count: number;
	}

	let {
		breakdown,
		greenThreshold,
		amberThreshold
	}: {
		breakdown: WorkoutTypeCount[];
		greenThreshold: number;
		amberThreshold: number;
	} = $props();

	const chartConfig = {
		count: { label: 'Sessions' }
	} satisfies Chart.ChartConfig;

	const chartData = $derived(
		breakdown.map((d) => ({
			type: getWorkoutLabel(d.type),
			count: d.count
		}))
	);

	const maxCount = $derived(Math.max(0, ...breakdown.map((d) => d.count)));

	const totalSessions = $derived(breakdown.reduce((sum, d) => sum + d.count, 0));

	// Thresholds come from the user's dashboard goal settings.
	const workoutPace = $derived.by(() => {
		if (totalSessions >= greenThreshold) {
			return {
				textClass: 'text-[oklch(var(--color-green))]',
				message: `Great pace — you're hitting ${greenThreshold}+ workouts every 4 weeks.`
			};
		}
		if (totalSessions >= amberThreshold) {
			return {
				textClass: 'text-pen-warn',
				message: `Below pace — aim for ${greenThreshold} workouts every 4 weeks to catch up.`
			};
		}
		return {
			textClass: 'text-destructive',
			barColor: 'var(--destructive)',
			message: "You're falling behind — try to get moving more this week."
		};
	});
</script>

<div class="flex h-full flex-col gap-3">
	<div class="flex items-end gap-3">
		<span class="font-display text-5xl leading-none font-bold tabular-nums {workoutPace.textClass}">
			{totalSessions}
		</span>
		<span class="text-muted-foreground mb-1 text-sm">sessions in 4 weeks</span>
	</div>

	{#if chartData.length > 0}
		<p class="text-sm font-medium {workoutPace.textClass}">{workoutPace.message}</p>
	{/if}

	{#if chartData.length === 0}
		<div
			class="border-border/60 text-muted-foreground flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm"
		>
			Log workouts to see your breakdown.
		</div>
	{:else}
		<Chart.Container config={chartConfig} class="h-32 w-full">
			<BarChart
				data={chartData}
				x="type"
				bandPadding={0.55}
				series={[{ key: 'count', label: 'Sessions', color: 'oklch(var(--color-green))' }]}
				props={{
					xAxis: { format: (v: string) => v },
					yAxis: { ticks: Math.max(1, Math.min(maxCount, 4)), format: 'integer' },
					bars: { stroke: 'none', radius: 1 }
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip indicator="dot" />
				{/snippet}
			</BarChart>
		</Chart.Container>
	{/if}
</div>

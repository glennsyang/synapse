<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { getWorkoutLabel } from '$lib/utils/workout';
	import { BarChart } from 'layerchart';

	interface WorkoutTypeCount {
		type: string;
		count: number;
	}

	let { breakdown }: { breakdown: WorkoutTypeCount[] } = $props();

	const chartConfig = {
		count: { label: 'Sessions' }
	} satisfies Chart.ChartConfig;

	const chartData = $derived(
		breakdown.map((d) => ({
			type: getWorkoutLabel(d.type),
			count: d.count
		}))
	);

	const totalSessions = $derived(breakdown.reduce((sum, d) => sum + d.count, 0));

	// Thresholds are per the dashboard goal of ~3 workouts/week over the trailing 4 weeks.
	const workoutPace = $derived.by(() => {
		if (totalSessions >= 12) {
			return {
				textClass: 'text-[oklch(var(--color-green))]',
				barColor: 'oklch(var(--color-green))',
				message: "Great pace — you're hitting 3+ workouts a week."
			};
		}
		if (totalSessions >= 8) {
			return {
				textClass: 'text-amber-500',
				barColor: '#f59e0b',
				message: 'Below pace — aim for 3 workouts a week to catch up.'
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
				series={[{ key: 'count', label: 'Sessions', color: workoutPace.barColor }]}
				props={{
					xAxis: { format: (v: string) => v }
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip indicator="dot" />
				{/snippet}
			</BarChart>
		</Chart.Container>
	{/if}
</div>

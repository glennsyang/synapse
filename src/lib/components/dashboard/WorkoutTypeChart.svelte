<script lang="ts">
	import { BarChart } from 'layerchart';

	import * as Chart from '$lib/components/ui/chart/index.js';
	import { getWorkoutLabel } from '$lib/utils/workout';

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
</script>

<div class="flex h-full flex-col gap-3">
	<div class="flex items-end gap-3">
		<span
			class="font-display text-5xl font-bold tabular-nums leading-none text-[oklch(var(--color-green))]"
		>
			{totalSessions}
		</span>
		<span class="mb-1 text-sm text-muted-foreground">sessions in 4 weeks</span>
	</div>

	{#if chartData.length === 0}
		<div
			class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground"
		>
			Log workouts to see your breakdown.
		</div>
	{:else}
		<Chart.Container config={chartConfig} class="h-32 w-full">
			<BarChart
				data={chartData}
				x="type"
				series={[{ key: 'count', label: 'Sessions', color: 'oklch(var(--color-green))' }]}
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

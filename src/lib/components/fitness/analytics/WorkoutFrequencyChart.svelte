<script lang="ts">
import { BarChart } from 'layerchart';

import * as Card from '$lib/components/ui/card';
import * as Chart from '$lib/components/ui/chart';

interface Workout {
	id: string;
	date: string;
	type: string;
}

let { workouts }: { workouts: Workout[] } = $props();

const chartConfig = {
	strength: { label: 'Strength', color: 'var(--chart-1)' },
	cardio: { label: 'Cardio', color: 'var(--chart-2)' },
	yoga: { label: 'Yoga', color: 'var(--chart-4)' },
	other: { label: 'Other', color: 'var(--chart-3)' }
} satisfies Chart.ChartConfig;

// Build last 8 weeks of data
const chartData = $derived.by(() => {
	const weeks: { label: string; startDate: Date }[] = [];
	const now = new Date();

	for (let i = 7; i >= 0; i--) {
		const start = new Date(now);
		// Monday-aligned weeks
		start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - i * 7);
		start.setHours(0, 0, 0, 0);
		const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		weeks.push({ label, startDate: start });
	}

	return weeks.map(({ label, startDate }, _i) => {
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + 7);

		const weekWorkouts = workouts.filter((w) => {
			const d = new Date(w.date);
			return d >= startDate && d < endDate;
		});

		return {
			week: label,
			strength: weekWorkouts.filter((w) => w.type === 'strength').length,
			cardio: weekWorkouts.filter((w) => w.type === 'cardio').length,
			yoga: weekWorkouts.filter((w) => w.type === 'yoga').length,
			other: weekWorkouts.filter((w) => w.type === 'other').length,
			total: weekWorkouts.length
		};
	});
});

const totalThisWeek = $derived(chartData[chartData.length - 1]?.total ?? 0);

// Consecutive weeks with at least one workout
const weeklyStreak = $derived.by(() => {
	let streak = 0;
	for (let i = chartData.length - 1; i >= 0; i--) {
		if (chartData[i].total > 0) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="font-display">Weekly Frequency</Card.Title>
		<Card.Description>Workouts per week over the last 8 weeks</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if workouts.length === 0}
			<div
				class="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
			>
				Log workouts to see your weekly frequency
			</div>
		{:else}
			<Chart.Container config={chartConfig} class="h-48 w-full">
				<BarChart
					data={chartData}
					x="week"
					series={[
						{ key: 'strength', label: 'Strength', color: chartConfig.strength.color },
						{ key: 'cardio', label: 'Cardio', color: chartConfig.cardio.color },
						{ key: 'yoga', label: 'Yoga', color: chartConfig.yoga.color },
						{ key: 'other', label: 'Other', color: chartConfig.other.color }
					]}
					seriesLayout="stack"
					props={{
						xAxis: {
							format: (v: string) => v
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip indicator="dot" />
					{/snippet}
				</BarChart>
			</Chart.Container>
		{/if}
	</Card.Content>
	<Card.Footer class="flex justify-between border-t pt-4 text-sm text-muted-foreground">
		<span>This week: <span class="font-medium text-foreground">{totalThisWeek}</span></span>
		<span>
			Weekly streak: <span class="font-medium text-foreground">{weeklyStreak}</span>
			{weeklyStreak === 1 ? 'week' : 'weeks'}
		</span>
	</Card.Footer>
</Card.Root>

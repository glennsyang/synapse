<script lang="ts">
	import PieChartIcon from '@lucide/svelte/icons/chart-pie';
	import { PieChart } from 'layerchart';

	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';

	interface MoodDistributionPoint {
		mood: string;
		count: number;
		fill: string;
		percentage: number;
	}

	interface Props {
		distribution: MoodDistributionPoint[];
		rangeLabel: string;
		totalLogs: number;
		mostFrequentMood: string | null;
	}

	let { distribution, rangeLabel, totalLogs, mostFrequentMood }: Props = $props();

	const chartConfig = $derived.by(() => {
		const config: Chart.ChartConfig = {};

		for (const item of distribution) {
			config[item.mood] = {
				label: item.mood,
				color: item.fill
			};
		}

		return config;
	});
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title class="font-display flex items-center gap-2">
			<PieChartIcon class="h-4 w-4 text-[oklch(var(--color-blue))]" />
			Mood distribution
		</Card.Title>
		<Card.Description>{rangeLabel}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if distribution.length === 0}
			<div
				class="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 text-center"
			>
				<p class="font-display text-xl font-semibold">No mood history yet</p>
				<p class="mt-2 max-w-md text-sm text-muted-foreground">
					Once you log a few days, the chart will show which moods are leading this period.
				</p>
			</div>
		{:else}
			<div class="space-y-5">
				<div class="relative mx-auto flex h-64 w-full max-w-65 items-center justify-center">
					<Chart.Container config={chartConfig} class="h-full w-full">
						<PieChart
							data={distribution}
							key="mood"
							value="count"
							c="mood"
							cRange={distribution.map((item) => item.fill)}
							innerRadius={0.62}
							cornerRadius={6}
							padAngle={2}
						>
							{#snippet tooltip()}
								<Chart.Tooltip indicator="dot" />
							{/snippet}
						</PieChart>
					</Chart.Container>

					<div
						class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
					>
						<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total logs</p>
						<p class="font-display text-4xl font-bold">{totalLogs}</p>
						{#if mostFrequentMood}
							<p class="mt-1 text-sm text-muted-foreground">Top mood: {mostFrequentMood}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-2.5">
					{#each distribution as item (item.mood)}
						<div
							class="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2"
						>
							<div class="flex items-center gap-3">
								<span class="h-3 w-3 rounded-full" style={`background:${item.fill}`}></span>
								<div>
									<p class="font-medium text-foreground">{item.mood}</p>
									<p class="text-xs text-muted-foreground">
										{item.count}
										day{item.count === 1 ? '' : 's'}
									</p>
								</div>
							</div>
							<p class="font-display text-lg font-semibold">{item.percentage}%</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>

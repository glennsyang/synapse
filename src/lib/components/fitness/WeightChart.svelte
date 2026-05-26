<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { TrendingDown, TrendingUp } from '@lucide/svelte/icons';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import { AreaChart } from 'layerchart';

	interface Props {
		title: string;
		description: string;
		entries: WeightEntry[];
		goalWeight: number | null;
	}

	interface WeightEntry {
		id: string;
		date: string;
		time: string | null;
		weightLbs: number;
		createdAt: string;
	}

	let { title, description, entries, goalWeight }: Props = $props();

	const chartData = $derived(
		entries.map((entry) => ({
			date: new Date(`${entry.date}T${entry.time || '00:00:00'}`),
			weight: entry.weightLbs
		}))
	);

	const chartConfig = {
		weight: { label: 'Weight', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;

	const yAxisTicks = $derived([0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240]);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content>
		<Chart.Container config={chartConfig}>
			<AreaChart
				points={{ r: 5 }}
				data={chartData}
				x="date"
				xScale={scaleUtc()}
				yDomain={[0, 250]}
				y="weight"
				series={[
					{
						key: 'weight',
						label: 'Weight',
						color: chartConfig.weight.color
					}
				]}
				props={{
					area: {
						curve: curveNatural,
						fillOpacity: 0.4,
						line: { class: 'stroke-1' },
						motion: 'tween'
					},
					xAxis: {
						format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
					},
					yAxis: { ticks: yAxisTicks }
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip
						labelFormatter={(v: Date) => {
							return v.toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric'
							});
						}}
						indicator="dot"
					/>
				{/snippet}
			</AreaChart>
		</Chart.Container>
	</Card.Content>
	<Card.Footer>
		<div class="flex w-full items-start gap-2 text-sm">
			<div class="grid gap-2">
				<div class="flex justify-evenly gap-4">
					{#if goalWeight}
						<div class="backdrop-blur-sm">
							<p class="text-muted-foreground text-xs">Goal</p>
							<p class="text-sm font-semibold">{goalWeight} lbs</p>
						</div>
					{/if}
					<div class="backdrop-blur-sm">
						<p class="text-muted-foreground text-xs">Latest</p>
						<p class="text-sm font-semibold">{entries[0].weightLbs} lbs</p>
					</div>
					{#if entries.length >= 2}
						{@const change = entries[0].weightLbs - entries[entries.length - 1].weightLbs}
						<div class="flex items-center gap-1 text-sm font-semibold">
							{#if change < 0}
								<span class="text-green-600"
									>Trending down by {Math.abs(change).toFixed(1)} lbs</span
								>
								<TrendingDown class="size-4 text-green-600" />
							{:else if change > 0}
								<span class="text-destructive">Trending up by {change.toFixed(1)} lbs</span>
								<TrendingUp class="text-destructive size-4" />
							{:else}
								<span>No change</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Card.Footer>
</Card.Root>

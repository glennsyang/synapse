<script lang="ts">
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import { LineChart } from 'layerchart';

	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart/index.js';

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
		weight: { label: 'Weight', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content>
		<Chart.Container config={chartConfig}>
			<LineChart
				points={{ r: 4 }}
				data={chartData}
				x="date"
				xScale={scaleUtc()}
				axis="x"
				series={[
					{
						key: 'weight',
						label: 'Weight',
						color: chartConfig.weight.color
					}
				]}
				props={{
					spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2 },
					highlight: {
						points: {
							motion: 'none',
							r: 6
						}
					},
					xAxis: {
						format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
					}
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
						indicator="line"
					/>
				{/snippet}
			</LineChart>
		</Chart.Container>
	</Card.Content>
	<Card.Footer>
		<div class="flex w-full items-start gap-2 text-sm">
			<div class="grid gap-2">
				<div class="flex justify-evenly gap-4">
					{#if goalWeight}
						<div class="backdrop-blur-sm">
							<p class="text-xs text-muted-foreground">Goal</p>
							<p class="text-sm font-semibold">{goalWeight} lbs</p>
						</div>
					{/if}
					<div class="backdrop-blur-sm">
						<p class="text-xs text-muted-foreground">Latest</p>
						<p class="text-sm font-semibold">{entries[0].weightLbs} lbs</p>
					</div>
					{#if entries.length >= 2}
						{@const change = entries[0].weightLbs - entries[entries.length - 1].weightLbs}
						<div class="flex items-center gap-1 text-sm font-semibold">
							{#if change < 0}
								<span class="text-green-600"
									>Trending down by {Math.abs(change).toFixed(1)} lbs</span
								>
								<TrendingDownIcon class="size-4 text-green-600" />
							{:else if change > 0}
								<span class="text-destructive">Trending up by {change.toFixed(1)} lbs</span>
								<TrendingUpIcon class="size-4 text-destructive" />
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

<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { scalePoint } from 'd3-scale';
	import { AreaChart } from 'layerchart';

	interface TrendPoint {
		weekLabel: string;
		completionPct: number;
	}

	let { trend }: { trend: TrendPoint[] } = $props();

	const chartConfig = {
		completionPct: { label: 'Completion %', color: 'oklch(var(--color-orange))' }
	} satisfies Chart.ChartConfig;

	const currentWeekPct = $derived(trend[trend.length - 1]?.completionPct ?? 0);

	const prevWeekPct = $derived(trend[trend.length - 2]?.completionPct ?? null);

	const delta = $derived(prevWeekPct !== null ? currentWeekPct - prevWeekPct : null);
</script>

<div class="flex h-full flex-col gap-3">
	<div class="flex items-end gap-3">
		<span
			class="font-display text-5xl leading-none font-bold text-[oklch(var(--color-orange))] tabular-nums"
		>
			{currentWeekPct}<span class="text-2xl font-semibold">%</span>
		</span>
		{#if delta !== null}
			<span
				class="mb-1 rounded-full px-2 py-0.5 text-xs font-semibold {delta >= 0
					? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
					: 'bg-destructive/10 text-destructive'}"
			>
				{delta >= 0 ? '+' : ''}{delta}% vs last week
			</span>
		{/if}
	</div>

	{#if trend.length < 2}
		<div
			class="border-border/60 text-muted-foreground flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm"
		>
			Complete more daily agenda items to see your trend.
		</div>
	{:else}
		<Chart.Container config={chartConfig} class="h-32 w-full">
			<AreaChart
				data={trend}
				x="weekLabel"
				y="completionPct"
				xScale={scalePoint()}
				axis="x"
				series={[
					{
						key: 'completionPct',
						label: 'Completion %',
						color: chartConfig.completionPct.color
					}
				]}
				props={{
					spline: { strokeWidth: 2 },
					area: { 'fill-opacity': 0.2 },
					highlight: { points: { r: 5 } },
					xAxis: { format: (v: string) => v }
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip labelFormatter={(v: string) => v} indicator="line" />
				{/snippet}
			</AreaChart>
		</Chart.Container>
	{/if}
</div>

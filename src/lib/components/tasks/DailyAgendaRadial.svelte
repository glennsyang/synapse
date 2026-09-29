<script lang="ts">
	import { cn } from '$lib';

	interface Props {
		completionPercentage: number;
		completedCount: number;
		totalCount: number;
		rollingAverage: number;
		previousAverage: number;
		trendDelta: number;
		hasComparisonData: boolean;
	}

	let {
		completionPercentage,
		completedCount,
		totalCount,
		rollingAverage,
		previousAverage,
		trendDelta,
		hasComparisonData
	}: Props = $props();

	const clampedCompletionPercentage = $derived(Math.min(Math.max(completionPercentage, 0), 100));
	const clampedRollingAverage = $derived(Math.min(Math.max(rollingAverage, 0), 100));
	const clampedPreviousAverage = $derived(Math.min(Math.max(previousAverage, 0), 100));
	const displayPercentage = $derived(Math.round(clampedCompletionPercentage));
	const displayRollingAverage = $derived(Math.round(clampedRollingAverage));
	const displayPreviousAverage = $derived(Math.round(clampedPreviousAverage));
	const completionSummary = $derived(
		totalCount > 0 ? `${completedCount} of ${totalCount} done` : 'Nothing scheduled yet'
	);
	const absoluteTrendDelta = $derived(Math.abs(trendDelta));
	const trendLabel = $derived.by(() => {
		if (!hasComparisonData) {
			return 'New rhythm';
		}

		if (trendDelta > 0) {
			return `+${absoluteTrendDelta} pts`;
		}

		if (trendDelta < 0) {
			return `-${absoluteTrendDelta} pts`;
		}

		return 'Even';
	});
	const ariaLabel = $derived(
		hasComparisonData
			? `Week progress ${displayPercentage} percent. ${completedCount} done out of ${totalCount} items. Rolling seven day average is ${displayRollingAverage} percent compared with ${displayPreviousAverage} percent across the prior seven days.`
			: `Week progress ${displayPercentage} percent. ${completedCount} done out of ${totalCount} items.`
	);
</script>

<section class="border-rule border-t-foreground border-t-2 pt-3" aria-label={ariaLabel}>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<h3 class="text-sm font-black">Week pulse</h3>
			<p class="text-muted-foreground mt-0.5 text-xs leading-5">{completionSummary}</p>
		</div>
		<span
			class={cn(
				'washi shrink-0',
				hasComparisonData && trendDelta > 0
					? 'bg-pen-fitness/12 text-pen-fitness'
					: hasComparisonData && trendDelta < 0
						? 'bg-pen-warn/15 text-foreground'
						: 'bg-pen-tasks/10 text-pen-tasks'
			)}
		>
			{trendLabel}
		</span>
	</div>

	<p class="text-pen-tasks mt-3 text-6xl leading-none font-black tracking-[-0.04em] tabular-nums">
		{displayPercentage}<span class="text-3xl">%</span>
	</p>
	<div class="bg-rule mt-3 h-1 w-full" aria-hidden="true">
		<div
			class="bg-pen-tasks h-full transition-[width] duration-500"
			style="width: {clampedCompletionPercentage}%"
		></div>
	</div>
</section>

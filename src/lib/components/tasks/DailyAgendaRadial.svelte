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

	const uid = $props.id();

	let {
		completionPercentage,
		completedCount,
		totalCount,
		rollingAverage,
		previousAverage,
		trendDelta,
		hasComparisonData
	}: Props = $props();

	const gaugeCenter = 110;
	const gaugeRadius = 66;
	const gaugeCircumference = 2 * Math.PI * gaugeRadius;
	const gradientId = `agenda-radial-gradient-${uid.replace(/:/g, '')}`;
	const glowId = `agenda-radial-glow-${uid.replace(/:/g, '')}`;
	const clampedCompletionPercentage = $derived(Math.min(Math.max(completionPercentage, 0), 100));
	const clampedRollingAverage = $derived(Math.min(Math.max(rollingAverage, 0), 100));
	const clampedPreviousAverage = $derived(Math.min(Math.max(previousAverage, 0), 100));
	const displayPercentage = $derived(Math.round(clampedCompletionPercentage));
	const displayRollingAverage = $derived(Math.round(clampedRollingAverage));
	const displayPreviousAverage = $derived(Math.round(clampedPreviousAverage));
	const gaugeProgress = $derived(clampedCompletionPercentage / 100);
	const gaugeDashOffset = $derived(gaugeCircumference * (1 - gaugeProgress));
	const gaugeAngleRadians = $derived(((gaugeProgress * 360 - 90) * Math.PI) / 180);
	const gaugeDotX = $derived(gaugeCenter + gaugeRadius * Math.cos(gaugeAngleRadians));
	const gaugeDotY = $derived(gaugeCenter + gaugeRadius * Math.sin(gaugeAngleRadians));
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

<section
	class="via-background dark:via-background relative isolate overflow-hidden rounded-[1.45rem] border border-orange-200/75 bg-linear-to-br from-orange-100/90 to-amber-50/85 p-3.5 shadow-[0_26px_70px_-40px_rgba(249,115,22,0.22)] sm:p-4 dark:border-orange-500/25 dark:from-orange-500/12 dark:to-amber-500/6 dark:shadow-[0_26px_70px_-44px_rgba(249,115,22,0.14)]"
>
	<div
		class="absolute top-0 -left-12 size-32 rounded-full bg-orange-300/24 blur-3xl dark:bg-orange-500/10"
	></div>
	<div
		class="absolute right-2 bottom-4 size-24 rounded-full bg-amber-200/28 blur-3xl dark:bg-amber-400/8"
	></div>

	<div class="relative space-y-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-muted-foreground text-[10px] font-semibold tracking-[0.2em] uppercase">
					Week pulse
				</p>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					{completionSummary}
				</p>
			</div>
			<div
				class={cn(
					'inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase backdrop-blur',
					hasComparisonData && trendDelta > 0
						? 'border-emerald-300/80 bg-emerald-100/85 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
						: hasComparisonData && trendDelta < 0
							? 'border-amber-300/80 bg-amber-100/90 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200'
							: 'bg-background/80 dark:bg-background/70 border-orange-300/70 text-[oklch(var(--color-orange))] dark:border-orange-500/30 dark:text-orange-200'
				)}
			>
				{trendLabel}
			</div>
		</div>

		<div class="relative mx-auto flex w-full max-w-56 items-center justify-center py-1">
			<div
				class="absolute inset-3 rounded-full border border-white/50 bg-white/40 blur-2xl dark:border-orange-500/10 dark:bg-orange-500/5"
			></div>
			<div
				class="bg-background/90 dark:bg-background/85 relative w-full rounded-full border border-orange-200/80 p-2.5 shadow-[0_18px_45px_-35px_rgba(249,115,22,0.38)] backdrop-blur dark:border-orange-500/22 dark:shadow-[0_18px_45px_-38px_rgba(249,115,22,0.22)]"
				role="img"
				aria-label={ariaLabel}
			>
				<div class="relative mx-auto aspect-square w-full max-w-48">
					<div
						class="via-background dark:via-background absolute inset-[15%] rounded-full bg-linear-to-br from-orange-100/75 to-orange-50/65 dark:from-orange-500/10 dark:to-orange-500/5"
					></div>
					<svg viewBox="0 0 220 220" class="size-full overflow-visible" aria-hidden="true">
						<defs>
							<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stop-color="oklch(var(--color-orange))"></stop>
								<stop offset="100%" stop-color="oklch(0.74 0.16 69)"></stop>
							</linearGradient>
							<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
								<feGaussianBlur stdDeviation="5"></feGaussianBlur>
							</filter>
						</defs>

						<circle
							cx={gaugeCenter}
							cy={gaugeCenter}
							r={gaugeRadius + 10}
							fill="none"
							stroke="oklch(var(--color-orange) / 0.08)"
							stroke-width="2"
						></circle>
						<circle
							cx={gaugeCenter}
							cy={gaugeCenter}
							r={gaugeRadius}
							fill="none"
							stroke="oklch(var(--color-orange) / 0.14)"
							stroke-width="19"
						></circle>
						<circle
							cx={gaugeCenter}
							cy={gaugeCenter}
							r={gaugeRadius}
							fill="none"
							stroke={`url(#${gradientId})`}
							stroke-width="19"
							stroke-linecap="round"
							stroke-dasharray={`${gaugeCircumference} ${gaugeCircumference}`}
							stroke-dashoffset={gaugeDashOffset}
							transform={`rotate(-90 ${gaugeCenter} ${gaugeCenter})`}
						></circle>
						{#if clampedCompletionPercentage > 0}
							<circle
								cx={gaugeDotX}
								cy={gaugeDotY}
								r="9"
								fill="oklch(var(--color-orange) / 0.18)"
								filter={`url(#${glowId})`}
							></circle>
							<circle cx={gaugeDotX} cy={gaugeDotY} r="6.5" fill="oklch(var(--color-orange))"
							></circle>
						{/if}
					</svg>

					<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
						<p
							class="font-display text-foreground text-4xl font-semibold tracking-[-0.06em] sm:text-5xl"
						>
							{displayPercentage}%
						</p>
						{#if totalCount > 0}
							<p class="text-muted-foreground mt-1 text-[11px] tracking-[0.14em] uppercase">
								{completedCount}/{totalCount}
								done
							</p>
						{:else}
							<p class="text-muted-foreground mt-1 text-[11px] tracking-[0.14em] uppercase">
								No items yet
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

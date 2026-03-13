<script lang="ts">
import { cn } from '$lib/utils';

interface Props {
	completionPercentage: number;
	completedCount: number;
	remainingCount: number;
	totalCount: number;
	activeDayCount: number;
	bestDayLabel: string;
	bestDayCompletion: number;
	todayCompletion: number | null;
	todayLabel: string;
	trendDelta: number;
	momentumLabel: string;
}

const uid = $props.id();

let {
	completionPercentage,
	completedCount,
	remainingCount,
	totalCount,
	activeDayCount,
	bestDayLabel,
	bestDayCompletion,
	todayCompletion,
	todayLabel,
	trendDelta,
	momentumLabel
}: Props = $props();

const gaugeCenter = 110;
const gaugeRadius = 72;
const gaugeCircumference = 2 * Math.PI * gaugeRadius;
const gradientId = `agenda-radial-gradient-${uid.replace(/:/g, '')}`;
const glowId = `agenda-radial-glow-${uid.replace(/:/g, '')}`;
const clampedCompletionPercentage = $derived(Math.min(Math.max(completionPercentage, 0), 100));
const displayPercentage = $derived(Math.round(clampedCompletionPercentage));
const gaugeProgress = $derived(clampedCompletionPercentage / 100);
const gaugeDashOffset = $derived(gaugeCircumference * (1 - gaugeProgress));
const gaugeAngleRadians = $derived(((gaugeProgress * 360 - 90) * Math.PI) / 180);
const gaugeDotX = $derived(gaugeCenter + gaugeRadius * Math.cos(gaugeAngleRadians));
const gaugeDotY = $derived(gaugeCenter + gaugeRadius * Math.sin(gaugeAngleRadians));
const summaryText = $derived(
	totalCount === 0
		? 'Add a few defaults or day-only items to wake this week up.'
		: `${completedCount} of ${totalCount} items are locked in, with ${remainingCount} still in motion.`
);
const trendLabel = $derived(
	trendDelta > 0
		? `+${trendDelta} pts vs prior 7 days`
		: trendDelta < 0
			? `${trendDelta} pts vs prior 7 days`
			: 'Matching the prior 7 days'
);
const bestDayText = $derived(
	bestDayCompletion > 0 ? `${bestDayLabel} • ${bestDayCompletion}%` : bestDayLabel
);
const todayText = $derived(
	todayCompletion === null ? todayLabel : `${todayLabel} • ${todayCompletion}%`
);
const ariaLabel = $derived(
	`Week completion ${displayPercentage} percent. ${completedCount} completed and ${remainingCount} remaining out of ${totalCount} items. ${trendLabel}.`
);
</script>

<section
	class="relative isolate h-full overflow-hidden rounded-[1.55rem] border border-orange-200/75 bg-linear-to-br from-orange-100/90 via-background to-amber-50/85 p-4 shadow-[0_26px_70px_-40px_rgba(249,115,22,0.28)] dark:border-orange-500/25 dark:from-orange-500/12 dark:via-background dark:to-amber-500/6 dark:shadow-[0_26px_70px_-44px_rgba(249,115,22,0.18)] sm:p-5"
>
	<div
		class="absolute -left-12 top-0 size-36 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-500/12"
	></div>
	<div
		class="absolute bottom-4 right-2 size-28 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-400/10"
	></div>
	<div
		class="absolute inset-x-5 top-5 h-px bg-linear-to-r from-transparent via-orange-300/55 to-transparent dark:via-orange-400/25"
	></div>

	<div class="relative flex h-full flex-col gap-4">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Week pulse
				</p>
				<h2
					class="mt-1 font-display text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl"
				>
					Completion arc
				</h2>
			</div>
			<div
				class="inline-flex rounded-full border border-orange-300/70 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[oklch(var(--color-orange))] backdrop-blur dark:border-orange-500/30 dark:bg-background/70 dark:text-orange-200"
			>
				{momentumLabel}
			</div>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<div
				class="rounded-full border border-orange-200/80 bg-background/82 px-3 py-2 text-xs text-muted-foreground backdrop-blur dark:border-orange-500/20 dark:bg-background/70"
			>
				<span class="font-semibold text-foreground">Today</span>
				<span class="ml-1.5">{todayText}</span>
			</div>
			<div
				class="rounded-full border border-orange-200/80 bg-background/82 px-3 py-2 text-xs text-muted-foreground backdrop-blur dark:border-orange-500/20 dark:bg-background/70"
			>
				<span class="font-semibold text-foreground">Best day</span>
				<span class="ml-1.5">{bestDayText}</span>
			</div>
		</div>

		<div
			class="relative mx-auto flex w-full max-w-68 flex-1 items-center justify-center py-2 sm:max-w-72"
		>
			<div
				class="absolute inset-0 rounded-4xl border border-white/50 bg-white/40 blur-2xl dark:border-orange-500/10 dark:bg-orange-500/5"
			></div>
			<div
				class="relative w-full rounded-4xl border border-orange-200/80 bg-background/90 p-3 shadow-[0_18px_45px_-35px_rgba(249,115,22,0.38)] backdrop-blur dark:border-orange-500/22 dark:bg-background/85 dark:shadow-[0_18px_45px_-38px_rgba(249,115,22,0.22)]"
				role="img"
				aria-label={ariaLabel}
			>
				<div class="relative mx-auto aspect-square w-full max-w-56 sm:max-w-60">
					<div
						class="absolute inset-[16%] rounded-full bg-linear-to-br from-orange-100/75 via-background to-orange-50/65 dark:from-orange-500/10 dark:via-background dark:to-orange-500/5"
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
							r={gaugeRadius + 13}
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
							stroke-width="22"
						></circle>
						<circle
							cx={gaugeCenter}
							cy={gaugeCenter}
							r={gaugeRadius}
							fill="none"
							stroke={`url(#${gradientId})`}
							stroke-width="22"
							stroke-linecap="round"
							stroke-dasharray={`${gaugeCircumference} ${gaugeCircumference}`}
							stroke-dashoffset={gaugeDashOffset}
							transform={`rotate(-90 ${gaugeCenter} ${gaugeCenter})`}
						></circle>
						{#if clampedCompletionPercentage > 0}
							<circle
								cx={gaugeDotX}
								cy={gaugeDotY}
								r="11"
								fill="oklch(var(--color-orange) / 0.18)"
								filter={`url(#${glowId})`}
							></circle>
							<circle
								cx={gaugeDotX}
								cy={gaugeDotY}
								r="8"
								fill="oklch(var(--color-orange))"
							></circle>
						{/if}
					</svg>

					<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
						<p class="font-display text-5xl font-semibold tracking-[-0.06em] text-foreground">
							{displayPercentage}%
						</p>
						<p class="mt-1 text-[12px] text-muted-foreground">
							{completedCount}/{totalCount || 0}
							closed
						</p>
					</div>
				</div>
			</div>
		</div>

		<div
			class="rounded-[1.2rem] border border-orange-200/80 bg-background/78 px-4 py-3 backdrop-blur dark:border-orange-500/20 dark:bg-background/70"
		>
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Momentum
					</p>
					<p class="mt-1 text-sm text-muted-foreground">{summaryText}</p>
				</div>
				<div
					class={cn(
						'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
						trendDelta > 0
							? 'border-emerald-300/80 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
							: trendDelta < 0
								? 'border-amber-300/80 bg-amber-100/85 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200'
								: 'border-orange-200/80 bg-orange-100/70 text-[oklch(var(--color-orange))] dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200'
					)}
				>
					{trendLabel}
				</div>
			</div>
			<div class="mt-3 grid grid-cols-2 gap-2.5">
				<div
					class="rounded-2xl border border-orange-200/70 bg-orange-50/70 px-3 py-2.5 dark:border-orange-500/20 dark:bg-orange-500/8"
				>
					<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Completed
					</p>
					<p class="mt-1 text-lg font-semibold text-foreground">{completedCount}</p>
				</div>
				<div
					class="rounded-2xl border border-border/70 bg-background/86 px-3 py-2.5 dark:bg-background/70"
				>
					<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Active days
					</p>
					<p class="mt-1 text-lg font-semibold text-foreground">{activeDayCount}</p>
				</div>
			</div>
		</div>
	</div>
</section>

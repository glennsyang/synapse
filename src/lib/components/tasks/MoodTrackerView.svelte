<script lang="ts">
	import MoodByDayOfWeekChart from '$lib/components/mood/MoodByDayOfWeekChart.svelte';
	import MoodCalendarHeatmap from '$lib/components/mood/MoodCalendarHeatmap.svelte';
	import MoodDistributionChart from '$lib/components/mood/MoodDistributionChart.svelte';
	import MoodLogForm from '$lib/components/mood/MoodLogForm.svelte';
	import MoodTrendChart from '$lib/components/mood/MoodTrendChart.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { MoodLogFormValues } from '$lib/schemas/mood';
	import { getTodayString } from '$lib/utils/date';
	import { type MoodPeriod, moodPeriods } from '$lib/utils/mood';
	import { ChartArea, Flame, TrendingUp } from '@lucide/svelte';
	import type { SuperValidated } from 'sveltekit-superforms';

	type MoodTrendPoint = {
		date: string;
		score: number;
		resolvedMood: string;
		mood: string;
		isCustom: boolean;
		fill: string;
	};

	type MoodDistributionPoint = {
		mood: string;
		count: number;
		fill: string;
		percentage: number;
	};

	type WeekdayAvgPoint = {
		day: string;
		avgScore: number | null;
		count: number;
	};

	type CalendarLog = {
		date: string;
		score: number;
		resolvedMood: string;
		fill: string;
	};

	type MoodData = {
		selectedPeriod: MoodPeriod;
		rangeLabel: string;
		trendPoints: MoodTrendPoint[];
		rollingAvgPoints: { date: string; rollingAvg: number }[];
		distribution: MoodDistributionPoint[];
		weekdayAvg: WeekdayAvgPoint[];
		calendarLogs: CalendarLog[];
		todayLog: {
			date: string;
			mood: string;
			resolvedMood: string;
			notes: string | null;
		} | null;
		summary: {
			loggedDays: number;
			totalDays: number;
			coveragePercentage: number;
			currentStreak: number;
			mostFrequentMood: string | null;
			averageScore: number | null;
		};
	};

	interface Props {
		moodForm: SuperValidated<MoodLogFormValues>;
		mood: MoodData;
		selectedPeriod: MoodPeriod;
		periodLabels: Record<MoodPeriod, string>;
		onPeriodChange: (period: string) => void;
	}

	let { moodForm, mood, selectedPeriod, periodLabels, onPeriodChange }: Props = $props();

	const today = getTodayString();

	const avgMoodLabel = $derived(
		mood.summary.averageScore !== null ? `${mood.summary.averageScore}` : '—'
	);
</script>

<div class="space-y-5">
	<!-- Compact log form -->
	<MoodLogForm form={moodForm} todayLog={mood.todayLog} />

	<!-- Stat chips row -->
	<div class="grid grid-cols-3 gap-3">
		<div
			class="flex flex-col items-center rounded-2xl border border-orange-200/70 bg-orange-50/60 px-3 py-3 text-center dark:border-orange-500/20 dark:bg-orange-500/8"
		>
			<Flame class="mb-1 h-4 w-4 text-orange-500" />
			<p class="font-display text-2xl leading-none font-bold">{mood.summary.currentStreak}</p>
			<p class="text-muted-foreground mt-1 text-xs">Day streak</p>
		</div>
		<div
			class="flex flex-col items-center rounded-2xl border border-orange-200/70 bg-orange-50/60 px-3 py-3 text-center dark:border-orange-500/20 dark:bg-orange-500/8"
		>
			<ChartArea class="mb-1 h-4 w-4 text-orange-500" />
			<p class="font-display text-2xl leading-none font-bold">{mood.summary.coveragePercentage}%</p>
			<p class="text-muted-foreground mt-1 text-xs">Coverage</p>
		</div>
		<div
			class="flex flex-col items-center rounded-2xl border border-orange-200/70 bg-orange-50/60 px-3 py-3 text-center dark:border-orange-500/20 dark:bg-orange-500/8"
		>
			<TrendingUp class="mb-1 h-4 w-4 text-orange-500" />
			<p class="font-display text-2xl leading-none font-bold">{avgMoodLabel}</p>
			<p class="text-muted-foreground mt-1 text-xs">Avg score</p>
		</div>
	</div>

	<!-- Period selector -->
	<div class="flex items-center justify-between gap-2">
		<div class="text-muted-foreground flex items-center gap-2 text-sm">
			<ChartArea class="h-4 w-4 text-[oklch(var(--color-orange))]" />
			<span>{mood.rangeLabel}</span>
		</div>
		<div class="w-full max-w-44">
			<Select.Root
				type="single"
				value={selectedPeriod}
				onValueChange={(value) => onPeriodChange(value)}
			>
				<Select.Trigger class="w-full">{periodLabels[selectedPeriod]}</Select.Trigger>
				<Select.Content>
					{#each moodPeriods as period (period)}
						<Select.Item value={period} label={periodLabels[period]}>
							{periodLabels[period]}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Charts grid -->
	<div class="grid gap-5 md:grid-cols-2 md:items-start">
		<!-- Left column: trend + heatmap -->
		<div class="space-y-5">
			<MoodTrendChart
				points={mood.trendPoints}
				rollingAvgPoints={mood.rollingAvgPoints}
				rangeLabel={mood.rangeLabel}
				averageScore={mood.summary.averageScore}
			/>
			<MoodCalendarHeatmap calendarLogs={mood.calendarLogs} {today} />
		</div>

		<!-- Right column: weekday bar + distribution -->
		<div class="space-y-5">
			<MoodByDayOfWeekChart weekdayAvg={mood.weekdayAvg} rangeLabel={mood.rangeLabel} />
			<MoodDistributionChart
				distribution={mood.distribution}
				rangeLabel={mood.rangeLabel}
				totalLogs={mood.summary.loggedDays}
				mostFrequentMood={mood.summary.mostFrequentMood}
			/>
		</div>
	</div>
</div>

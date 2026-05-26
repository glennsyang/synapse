<script lang="ts">
	import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
	import SetGoalWeightDialog from '$lib/components/fitness/dialogs/SetGoalWeightDialog.svelte';
	import WeightChart from '$lib/components/fitness/WeightChart.svelte';
	import type { logWeightSchema, setGoalWeightSchema } from '$lib/schemas/fitness';
	import { parseLocalDateString } from '$lib/utils/date';
	import {
		ArrowDown,
		ArrowUp,
		Minus,
		Scale,
		Target,
		TrendingDown,
		TrendingUp
	} from '@lucide/svelte/icons';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	import FitnessStatusCard from './FitnessStatusCard.svelte';

	interface WeightEntry {
		id: string;
		date: string;
		time: string | null;
		weightLbs: number;
		createdAt: string;
	}

	interface WeightStats {
		currentWeight: number | null;
		startWeight: number | null;
		remainingToGoal: number | null;
		trend: string;
	}

	interface GoalWeight {
		targetWeightLbs: number;
	}

	interface Props {
		weightEntries: WeightEntry[];
		weightStats: WeightStats;
		goalWeight: GoalWeight | null | undefined;
		weightForm: SuperValidated<Infer<typeof logWeightSchema>>;
		goalForm: SuperValidated<Infer<typeof setGoalWeightSchema>>;
	}

	let { weightEntries, weightStats, goalWeight, weightForm, goalForm }: Props = $props();

	// Weekly rate of change (lbs/week)
	const weeklyRate = $derived.by(() => {
		if (weightEntries.length < 2) return null;
		const newest = weightEntries[0];
		const oldest = weightEntries[weightEntries.length - 1];
		const daysDiff = Math.max(
			1,
			(parseLocalDateString(newest.date).getTime() - parseLocalDateString(oldest.date).getTime()) /
				(1000 * 60 * 60 * 24)
		);
		const change = newest.weightLbs - oldest.weightLbs;
		return (change / daysDiff) * 7;
	});

	// Estimated weeks to goal
	const weeksToGoal = $derived.by(() => {
		if (!weeklyRate || !weightStats.remainingToGoal || weeklyRate === 0) return null;
		const weeks = weightStats.remainingToGoal / weeklyRate;
		if (weeks < 0 || weeks > 200) return null;
		return Math.round(Math.abs(weeks));
	});

	const trendIcon = $derived(
		weightStats.trend === 'down' ? TrendingDown : weightStats.trend === 'up' ? TrendingUp : Minus
	);

	const remainingTrend = $derived(
		!weightStats.remainingToGoal
			? 'neutral'
			: weightStats.remainingToGoal < 0
				? 'positive'
				: weightStats.trend === 'down'
					? 'positive'
					: 'neutral'
	);
</script>

<section class="mb-2 space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<SetGoalWeightDialog formData={goalForm} />
			<LogWeightDialog formData={weightForm} instanceId="weight" />
		</div>
	</div>

	<!-- Stat rail -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<FitnessStatusCard
			label="Current"
			value={weightStats.currentWeight ?? '—'}
			unit={weightStats.currentWeight ? 'lbs' : ''}
			icon={Scale}
		/>
		<FitnessStatusCard
			label="Goal"
			value={goalWeight?.targetWeightLbs ?? '—'}
			unit={goalWeight ? 'lbs' : ''}
			icon={Target}
			trendLabel={goalWeight ? 'Target set' : 'Set a goal'}
		/>
		<FitnessStatusCard
			label="To Go"
			value={weightStats.remainingToGoal != null
				? Math.abs(weightStats.remainingToGoal).toFixed(1)
				: '—'}
			unit={weightStats.remainingToGoal != null ? 'lbs' : ''}
			icon={weightStats.remainingToGoal && weightStats.remainingToGoal > 0
				? ArrowDown
				: weightStats.remainingToGoal && weightStats.remainingToGoal < 0
					? ArrowUp
					: Minus}
			trend={remainingTrend}
			trendLabel={weightStats.remainingToGoal && weightStats.remainingToGoal < 0
				? 'Past goal weight'
				: undefined}
		/>
		<FitnessStatusCard
			label="Pace"
			value={weeklyRate != null ? Math.abs(weeklyRate).toFixed(1) : '—'}
			unit={weeklyRate != null ? 'lbs/wk' : ''}
			icon={trendIcon}
			trend={weeklyRate != null && weeklyRate < 0
				? 'positive'
				: weeklyRate != null && weeklyRate > 0
					? 'negative'
					: 'neutral'}
			trendLabel={weeksToGoal != null ? `~${weeksToGoal} weeks to goal` : undefined}
		/>
	</div>

	<!-- Weight chart -->
	{#if weightEntries.length === 0}
		<div
			class="flex h-40 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700"
		>
			<p class="text-sm text-zinc-500 dark:text-zinc-400">
				No weight data yet — start logging to see your trend
			</p>
		</div>
	{:else}
		<WeightChart
			title="Weight Trend"
			description="Your weight over time with goal reference"
			entries={weightEntries}
			goalWeight={goalWeight?.targetWeightLbs ?? null}
		/>
	{/if}
</section>

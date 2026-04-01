<script lang="ts">
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
import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
import SetGoalWeightDialog from '$lib/components/fitness/dialogs/SetGoalWeightDialog.svelte';
import WeightEntryCard from '$lib/components/fitness/entries/WeightEntryCard.svelte';
import WeightChart from '$lib/components/fitness/WeightChart.svelte';
import * as Card from '$lib/components/ui/card';
import type { logWeightSchema, setGoalWeightSchema } from '$lib/schemas/fitness';
import { parseLocalDateString } from '$lib/utils/date';

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
	onEdit: (entry: { id: string; date: string; time: string | null; weightLbs: number }) => void;
	onDelete: (id: string) => void;
}

let { weightEntries, weightStats, goalWeight, weightForm, goalForm, onEdit, onDelete }: Props =
	$props();

// Weekly rate of change (lbs/week) from last 2 entries
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

<section class="mb-8 space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">Weight</h2>
			<p class="text-sm text-stone-500 dark:text-stone-400">Trend, pace, and distance to goal</p>
		</div>
		<div class="flex items-center gap-2">
			<SetGoalWeightDialog formData={goalForm} />
			<LogWeightDialog formData={weightForm} />
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
			trend={weeklyRate != null && weeklyRate < 0 ? 'positive' : weeklyRate != null && weeklyRate > 0 ? 'negative' : 'neutral'}
			trendLabel={weeksToGoal != null ? `~${weeksToGoal} weeks to goal` : undefined}
		/>
	</div>

	<!-- Weight chart -->
	{#if weightEntries.length === 0}
		<div
			class="flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700"
		>
			<p class="text-sm text-stone-500 dark:text-stone-400">
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

	<!-- Recent weight entries -->
	{#if weightEntries.length > 0}
		<Card.Root class="border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/40">
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-stone-700 dark:text-stone-300">
					Recent Entries
				</Card.Title>
			</Card.Header>
			<Card.Content class="max-h-64 space-y-2 overflow-y-auto pr-1">
				{#each weightEntries.slice(0, 5) as entry, i (entry.id)}
					<WeightEntryCard
						{entry}
						previousEntry={weightEntries[i + 1] ?? null}
						{onEdit}
						{onDelete}
					/>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</section>

<script lang="ts">
import ActivityIcon from '@lucide/svelte/icons/activity';
import ClockIcon from '@lucide/svelte/icons/clock';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import FlameIcon from '@lucide/svelte/icons/flame';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

import WorkoutFrequencyChart from '$lib/components/fitness/analytics/WorkoutFrequencyChart.svelte';
import LogWorkoutDialog from '$lib/components/fitness/dialogs/LogWorkoutDialog.svelte';
import WorkoutEntryCard from '$lib/components/fitness/entries/WorkoutEntryCard.svelte';
import * as Card from '$lib/components/ui/card';
import type { logWorkoutSchema } from '$lib/schemas/fitness';
import { getTodayString, parseLocalDateString } from '$lib/utils/date';

import FitnessStatusCard from './FitnessStatusCard.svelte';

interface Exercise {
	exerciseName: string;
	sets: number | null;
	reps: number | null;
	weightLbs: number | null;
}

interface Workout {
	id: string;
	date: string;
	time: string | null;
	type: string;
	durationMinutes: number | null;
	notes: string | null;
	exercises: Exercise[];
}

interface Props {
	workouts: Workout[];
	workoutForm: SuperValidated<Infer<typeof logWorkoutSchema>>;
	onEdit: (workout: Workout) => void;
	onDelete: (id: string) => void;
}

let { workouts, workoutForm, onEdit, onDelete }: Props = $props();

const insights = $derived.by(() => {
	if (workouts.length === 0) {
		return { thisWeekCount: 0, streak: 0, avgDuration: 0, mostConsistentDay: null, topType: null };
	}

	const today = getTodayString();
	const todayDate = parseLocalDateString(today);

	// This week count
	const startOfWeek = new Date(todayDate);
	startOfWeek.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
	startOfWeek.setHours(0, 0, 0, 0);
	const thisWeekCount = workouts.filter((w) => parseLocalDateString(w.date) >= startOfWeek).length;

	// Current streak (consecutive days)
	const workoutDates = new Set(workouts.map((w) => w.date));
	let streak = 0;
	const d = new Date(todayDate);
	while (true) {
		const dateStr = d.toISOString().slice(0, 10);
		if (workoutDates.has(dateStr)) {
			streak++;
			d.setDate(d.getDate() - 1);
		} else {
			break;
		}
	}

	// Avg duration
	const withDuration = workouts.filter((w) => w.durationMinutes != null);
	const avgDuration =
		withDuration.length > 0
			? Math.round(
					withDuration.reduce((s, w) => s + (w.durationMinutes ?? 0), 0) / withDuration.length
				)
			: 0;

	// Most consistent day of the week
	const dayCounts: Record<number, number> = {};
	for (const w of workouts) {
		const day = parseLocalDateString(w.date).getDay();
		dayCounts[day] = (dayCounts[day] ?? 0) + 1;
	}
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
	const mostConsistentDay = topDay ? dayNames[Number(topDay[0])] : null;

	// Top workout type
	const typeCounts: Record<string, number> = {};
	for (const w of workouts) {
		typeCounts[w.type] = (typeCounts[w.type] ?? 0) + 1;
	}
	const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

	return { thisWeekCount, streak, avgDuration, mostConsistentDay, topType };
});
</script>

<section class="mb-8 space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
				Workouts
			</h2>
			<p class="text-sm text-stone-500 dark:text-stone-400">
				Volume, consistency, and training history
			</p>
		</div>
		<LogWorkoutDialog formData={workoutForm} />
	</div>

	<!-- Insight cards -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<FitnessStatusCard
			label="This Week"
			value={insights.thisWeekCount}
			unit="sessions"
			icon={DumbbellIcon}
			trend={insights.thisWeekCount >= 3 ? 'positive' : insights.thisWeekCount >= 1 ? 'neutral' : 'negative'}
			trendLabel={insights.thisWeekCount >= 3 ? 'Strong week' : insights.thisWeekCount >= 1 ? 'Keep going' : 'Start your week'}
		/>
		<FitnessStatusCard
			label="Streak"
			value={insights.streak}
			unit={insights.streak === 1 ? 'day' : 'days'}
			icon={FlameIcon}
			trend={insights.streak >= 3 ? 'positive' : 'neutral'}
			trendLabel={insights.streak >= 3 ? 'On a roll' : insights.streak > 0 ? 'Keep it up' : 'Start today'}
		/>
		<FitnessStatusCard
			label="Avg Session"
			value={insights.avgDuration || '—'}
			unit={insights.avgDuration ? 'min' : ''}
			icon={ClockIcon}
		/>
		<FitnessStatusCard
			label="Best Day"
			value={insights.mostConsistentDay ?? '—'}
			icon={ActivityIcon}
			trendLabel={insights.mostConsistentDay ? 'Most active day' : 'Log workouts to see'}
		/>
	</div>

	<!-- Frequency chart (full width) -->
	<WorkoutFrequencyChart {workouts} />

	<!-- Latest workout callout -->
	{#if workouts.length > 0}
		<Card.Root class="border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/40">
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-stone-700 dark:text-stone-300">
					Recent Sessions
				</Card.Title>
			</Card.Header>
			<Card.Content class="max-h-72 space-y-2 overflow-y-auto pr-1">
				{#each workouts.slice(0, 5) as workout (workout.id)}
					<WorkoutEntryCard {workout} {onEdit} {onDelete} />
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</section>

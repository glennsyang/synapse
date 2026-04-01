<script lang="ts">
import { Dumbbell, Scale, UtensilsCrossed } from '@lucide/svelte/icons';

import * as Card from '$lib/components/ui/card';
import { getTodayString, parseLocalDateString } from '$lib/utils/date';

interface Workout {
	id: string;
	date: string;
	type: string;
	durationMinutes: number | null;
}

interface WeightEntry {
	id: string;
	date: string;
	weightLbs: number;
}

interface Meal {
	id: string;
	date: string;
	caloriesEstimate: number | null;
}

interface Props {
	workouts: Workout[];
	weightEntries: WeightEntry[];
	meals: Meal[];
	calorieTarget: number | null;
}

let { workouts, weightEntries, meals, calorieTarget }: Props = $props();

// Build last 14 days data
const dayData = $derived.by(() => {
	const days: {
		date: string;
		label: string;
		shortLabel: string;
		workoutTypes: string[];
		hasWeight: boolean;
		calories: number | null;
	}[] = [];

	const today = getTodayString();
	const todayDate = parseLocalDateString(today);

	for (let i = 13; i >= 0; i--) {
		const d = new Date(todayDate);
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		const label = d.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
		const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

		const dayWorkouts = workouts.filter((w) => w.date === dateStr);
		const dayWeight = weightEntries.find((w) => w.date === dateStr);
		const dayMeals = meals.filter((m) => m.date === dateStr);
		const dayCals = dayMeals.reduce((sum, m) => sum + (m.caloriesEstimate ?? 0), 0);

		days.push({
			date: dateStr,
			label,
			shortLabel,
			workoutTypes: dayWorkouts.map((w) => w.type),
			hasWeight: !!dayWeight,
			calories: dayCals > 0 ? dayCals : null
		});
	}

	return days;
});

const typeColors: Record<string, string> = {
	strength: 'bg-orange-400',
	cardio: 'bg-sky-400',
	yoga: 'bg-violet-400',
	other: 'bg-stone-400'
};

function workoutColor(types: string[]): string {
	if (types.length === 0) return '';
	return typeColors[types[0]] ?? typeColors.other;
}

// Interpretation sentence
const interpretation = $derived.by(() => {
	const last7 = dayData.slice(7);
	const workoutDays = last7.filter((d) => d.workoutTypes.length > 0).length;
	const weightDays = last7.filter((d) => d.hasWeight).length;
	const calDays = last7.filter((d) => d.calories !== null).length;

	const parts: string[] = [];

	if (workoutDays >= 4) parts.push(`${workoutDays} of 7 days active — solid consistency`);
	else if (workoutDays >= 2) parts.push(`${workoutDays} of 7 days active — building rhythm`);
	else if (workoutDays === 1) parts.push('One session this week — a start to build on');
	else parts.push('No workouts logged yet this week');

	if (weightDays >= 4) parts.push('weight tracked consistently');
	if (calDays >= 5) parts.push('nutrition well logged');

	return parts.join(' · ');
});

const calAdherenceClass = (calories: number | null): string => {
	if (calories === null) return 'bg-stone-200 dark:bg-stone-700';
	if (!calorieTarget) return 'bg-stone-300 dark:bg-stone-600';
	const ratio = calories / calorieTarget;
	if (ratio >= 0.85 && ratio <= 1.1) return 'bg-emerald-400';
	if (ratio > 1.1 && ratio <= 1.25) return 'bg-amber-400';
	if (ratio > 1.25) return 'bg-rose-400';
	return 'bg-sky-300 dark:bg-sky-600'; // under target
};
</script>

<Card.Root
	class="mb-8 overflow-hidden border-0 bg-gradient-to-br from-zinc-900 to-slate-800 text-white shadow-xl"
>
	<Card.Header class="pb-4">
		<Card.Title class="font-display text-lg font-semibold text-white">14-Day Momentum</Card.Title>
		<Card.Description class="text-zinc-400">
			Activity, weight check-ins, and calorie adherence across each day
		</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-5">
		<!-- Day labels -->
		<div class="grid grid-cols-14 gap-1" style="grid-template-columns: repeat(14, 1fr);">
			{#each dayData as day (day.date)}
				<div class="text-center text-[10px] font-medium text-zinc-500">{day.shortLabel}</div>
			{/each}
		</div>

		<!-- Lane 1: Workout activity -->
		<div>
			<div class="mb-1.5 flex items-center gap-1.5">
				<Dumbbell class="h-3 w-3 text-zinc-400" />
				<span class="text-xs font-medium text-zinc-400">Activity</span>
			</div>
			<div class="grid gap-1" style="grid-template-columns: repeat(14, 1fr);">
				{#each dayData as day (day.date)}
					<div
						class="h-6 rounded-sm transition-all {day.workoutTypes.length > 0
							? workoutColor(day.workoutTypes)
							: 'bg-zinc-700'}"
						title={day.workoutTypes.length > 0
							? `${day.label}: ${day.workoutTypes.join(', ')}`
							: day.label}
					></div>
				{/each}
			</div>
		</div>

		<!-- Lane 2: Weight check-ins -->
		<div>
			<div class="mb-1.5 flex items-center gap-1.5">
				<Scale class="h-3 w-3 text-zinc-400" />
				<span class="text-xs font-medium text-zinc-400">Weight</span>
			</div>
			<div class="grid gap-1" style="grid-template-columns: repeat(14, 1fr);">
				{#each dayData as day (day.date)}
					<div class="flex items-center justify-center">
						<div
							class="h-3 w-3 rounded-full transition-all {day.hasWeight
								? 'bg-emerald-500'
								: 'bg-zinc-700'}"
							title={day.hasWeight ? `${day.label}: weighed in` : day.label}
						></div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Lane 3: Calorie adherence -->
		<div>
			<div class="mb-1.5 flex items-center gap-1.5">
				<UtensilsCrossed class="h-3 w-3 text-zinc-400" />
				<span class="text-xs font-medium text-zinc-400">Calories</span>
			</div>
			<div class="grid gap-1" style="grid-template-columns: repeat(14, 1fr);">
				{#each dayData as day (day.date)}
					<div
						class="h-6 rounded-sm transition-all {calAdherenceClass(day.calories)}"
						title={day.calories !== null
							? `${day.label}: ${day.calories} cal`
							: `${day.label}: no data`}
					></div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap gap-3 border-t border-zinc-700 pt-3">
			<div class="flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-sm bg-orange-400"></div>
				<span class="text-xs text-zinc-400">Strength</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-sm bg-sky-400"></div>
				<span class="text-xs text-zinc-400">Cardio</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-sm bg-violet-400"></div>
				<span class="text-xs text-zinc-400">Yoga</span>
			</div>
			<div class="ml-auto flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-sm bg-emerald-400"></div>
				<span class="text-xs text-zinc-400">On target</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-sm bg-amber-400"></div>
				<span class="text-xs text-zinc-400">Slightly over</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-sm bg-sky-300"></div>
				<span class="text-xs text-zinc-400">Under target</span>
			</div>
		</div>
	</Card.Content>

	<Card.Footer class="border-t border-zinc-700 bg-zinc-900/60">
		<p class="text-xs italic text-zinc-300">{interpretation}</p>
	</Card.Footer>
</Card.Root>

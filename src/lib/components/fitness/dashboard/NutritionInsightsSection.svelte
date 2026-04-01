<script lang="ts">
import FlameIcon from '@lucide/svelte/icons/flame';
import TargetIcon from '@lucide/svelte/icons/target';
import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import UtensilsCrossedIcon from '@lucide/svelte/icons/utensils-crossed';
import { BarChart } from 'layerchart';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import LogMealDialog from '$lib/components/fitness/dialogs/LogMealDialog.svelte';
import SetCalorieTargetDialog from '$lib/components/fitness/dialogs/SetCalorieTargetDialog.svelte';
import MealEntryCard from '$lib/components/fitness/entries/MealEntryCard.svelte';
import * as Card from '$lib/components/ui/card';
import * as Chart from '$lib/components/ui/chart';
import type { logMealSchema, setCalorieTargetSchema } from '$lib/schemas/fitness';
import { getTodayString, parseLocalDateString } from '$lib/utils/date';

import FitnessStatusCard from './FitnessStatusCard.svelte';

interface Meal {
	id: string;
	date: string;
	timeOfDay: string;
	description: string;
	caloriesEstimate: number | null;
}

interface CalorieTarget {
	targetCalories: number;
}

interface Props {
	meals: Meal[];
	calorieTarget: CalorieTarget | null | undefined;
	mealForm: SuperValidated<Infer<typeof logMealSchema>>;
	calorieForm: SuperValidated<Infer<typeof setCalorieTargetSchema>>;
	onEdit: (meal: {
		id: string;
		date: string;
		timeOfDay: string;
		description: string;
		caloriesEstimate: number | null;
	}) => void;
	onDelete: (id: string) => void;
}

let { meals, calorieTarget, mealForm, calorieForm, onEdit, onDelete }: Props = $props();

const target = $derived(calorieTarget?.targetCalories ?? null);

// Last 7 days adherence data
const adherenceData = $derived.by(() => {
	const today = getTodayString();
	const todayDate = parseLocalDateString(today);
	const days: { day: string; calories: number; target: number | null }[] = [];

	for (let i = 6; i >= 0; i--) {
		const d = new Date(todayDate);
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().slice(0, 10);
		const label = d.toLocaleDateString('en-US', { weekday: 'short' });

		const dayCals = meals
			.filter((m) => m.date === dateStr)
			.reduce((sum, m) => sum + (m.caloriesEstimate ?? 0), 0);

		days.push({ day: label, calories: dayCals, target });
	}
	return days;
});

// Today's stats
const todayCalories = $derived.by(() => {
	const today = getTodayString();
	return meals.filter((m) => m.date === today).reduce((s, m) => s + (m.caloriesEstimate ?? 0), 0);
});

const todayPercentage = $derived(target ? Math.round((todayCalories / target) * 100) : null);
const todayRemaining = $derived(target ? Math.max(target - todayCalories, 0) : null);
const todayOver = $derived(target && todayCalories > target ? todayCalories - target : null);

// 7-day average
const sevenDayAvg = $derived.by(() => {
	const withCals = adherenceData.filter((d) => d.calories > 0);
	if (withCals.length === 0) return null;
	return Math.round(withCals.reduce((s, d) => s + d.calories, 0) / withCals.length);
});

// Avg delta vs target (last 7 days)
const avgDelta = $derived.by(() => {
	if (!target) return null;
	const withCals = adherenceData.filter((d) => d.calories > 0);
	if (withCals.length === 0) return null;
	const avg = withCals.reduce((s, d) => s + d.calories, 0) / withCals.length;
	return Math.round(avg - target);
});

// Most consistent meal period
const topMealPeriod = $derived.by(() => {
	const counts: Record<string, number> = {};
	for (const m of meals) {
		counts[m.timeOfDay] = (counts[m.timeOfDay] ?? 0) + 1;
	}
	return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
});

const chartConfig = {
	calories: { label: 'Calories', color: 'var(--chart-2)' }
} satisfies Chart.ChartConfig;
</script>

<section class="mb-8 space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
				Nutrition
			</h2>
			<p class="text-sm text-stone-500 dark:text-stone-400">
				Calorie adherence and consistency over time
			</p>
		</div>
		<div class="flex items-center gap-2">
			<SetCalorieTargetDialog formData={calorieForm} />
			<LogMealDialog formData={mealForm} />
		</div>
	</div>

	<!-- Insight cards -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<FitnessStatusCard
			label="Today"
			value={todayCalories}
			unit="cal"
			icon={FlameIcon}
			trend={todayPercentage != null
				? todayPercentage >= 85 && todayPercentage <= 110
					? 'positive'
					: todayPercentage > 110
						? 'negative'
						: 'neutral'
				: 'neutral'}
			trendLabel={todayPercentage != null
				? `${todayPercentage}% of target`
				: 'No target set'}
		/>
		<FitnessStatusCard
			label="Remaining"
			value={todayOver != null ? `+${todayOver}` : (todayRemaining ?? '—')}
			unit={target ? 'cal' : ''}
			icon={TargetIcon}
			trend={todayOver != null ? 'negative' : 'positive'}
			trendLabel={todayOver != null ? 'Over target' : todayRemaining != null ? 'Under target' : 'Set a target'}
		/>
		<FitnessStatusCard
			label="7-Day Avg"
			value={sevenDayAvg ?? '—'}
			unit={sevenDayAvg ? 'cal/day' : ''}
			icon={UtensilsCrossedIcon}
			trendLabel={avgDelta != null
				? avgDelta > 0
					? `${avgDelta} cal over target avg`
					: `${Math.abs(avgDelta)} cal under target avg`
				: undefined}
			trend={avgDelta != null ? (Math.abs(avgDelta) < 100 ? 'positive' : avgDelta > 200 ? 'negative' : 'neutral') : 'neutral'}
		/>
		<FitnessStatusCard
			label="Top Meal"
			value={topMealPeriod ? topMealPeriod.charAt(0).toUpperCase() + topMealPeriod.slice(1) : '—'}
			icon={avgDelta != null && avgDelta < 0 ? TrendingDownIcon : TrendingUpIcon}
			trendLabel={topMealPeriod ? 'Most logged meal' : 'Log meals to see'}
		/>
	</div>

	<!-- 7-day calorie adherence chart -->
	{#if meals.length > 0}
		<Card.Root class="border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/40">
			<Card.Header>
				<Card.Title class="text-sm font-medium text-stone-700 dark:text-stone-300">
					7-Day Calorie Overview
				</Card.Title>
				<Card.Description class="text-xs text-stone-500 dark:text-stone-400">
					Daily intake{target ? ` vs ${target} cal target` : ''}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={chartConfig} class="h-36 w-full">
					<BarChart
						data={adherenceData}
						x="day"
						series={[{ key: 'calories', label: 'Calories', color: chartConfig.calories.color }]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip indicator="dot" />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Recent meals -->
	{#if meals.length > 0}
		<Card.Root class="border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/40">
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-stone-700 dark:text-stone-300">
					Recent Meals
				</Card.Title>
			</Card.Header>
			<Card.Content class="max-h-64 space-y-2 overflow-y-auto pr-1">
				{#each meals.slice(0, 5) as meal (meal.id)}
					<MealEntryCard {meal} {onEdit} {onDelete} />
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</section>

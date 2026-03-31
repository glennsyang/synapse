<script lang="ts">
import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
import BellRingIcon from '@lucide/svelte/icons/bell-ring';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import MinusIcon from '@lucide/svelte/icons/minus';
import ScaleIcon from '@lucide/svelte/icons/scale';
import TargetIcon from '@lucide/svelte/icons/target';
import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import UtensilsCrossedIcon from '@lucide/svelte/icons/utensils-crossed';
import { SvelteSet } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';

import { navigating, page } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import WorkoutFrequencyChart from '$lib/components/fitness/analytics/WorkoutFrequencyChart.svelte';
import WorkoutStatsBar from '$lib/components/fitness/analytics/WorkoutStatsBar.svelte';
import CalorieProgress from '$lib/components/fitness/CalorieProgress.svelte';
import CreateReminderDialog from '$lib/components/fitness/dialogs/CreateReminderDialog.svelte';
import LogMealDialog from '$lib/components/fitness/dialogs/LogMealDialog.svelte';
import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
import LogWorkoutDialog from '$lib/components/fitness/dialogs/LogWorkoutDialog.svelte';
import SetCalorieTargetDialog from '$lib/components/fitness/dialogs/SetCalorieTargetDialog.svelte';
import SetGoalWeightDialog from '$lib/components/fitness/dialogs/SetGoalWeightDialog.svelte';
import MealEntryCard from '$lib/components/fitness/entries/MealEntryCard.svelte';
import ReminderCard from '$lib/components/fitness/entries/ReminderCard.svelte';
import WeightEntryCard from '$lib/components/fitness/entries/WeightEntryCard.svelte';
import WorkoutEntryCard from '$lib/components/fitness/entries/WorkoutEntryCard.svelte';
import WeightChart from '$lib/components/fitness/WeightChart.svelte';
import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import * as Card from '$lib/components/ui/card';
import * as Tabs from '$lib/components/ui/tabs';
import { getTodayString } from '$lib/utils/date';

import type { PageData } from './$types.js';

let { data }: { data: PageData } = $props();

// Delete dialog state
let weightEntryToDelete = $state<string | null>(null);
let workoutToDelete = $state<string | null>(null);
let mealToDelete = $state<string | null>(null);
let showDeleteWeightDialog = $state(false);
let showDeleteWorkoutDialog = $state(false);
let showDeleteMealDialog = $state(false);
let reminderToDelete = $state<string | null>(null);
let showDeleteReminderDialog = $state(false);

let reminderToToggle = $state<{
	id: string;
	workoutType: string;
	cadence: string;
	time: string;
	daysOfWeek: string | null;
	enabled: boolean;
} | null>(null);
let showToggleReminderDialog = $state(false);

// Edit state
let weightToEdit = $state<{
	id: string;
	date: string;
	time: string | null;
	weightLbs: number;
} | null>(null);

let workoutToEdit = $state<{
	id: string;
	date: string;
	time: string | null;
	type: string;
	durationMinutes: number | null;
	notes: string | null;
	exercises: {
		exerciseName: string;
		sets: number | null;
		reps: number | null;
		weightLbs: number | null;
	}[];
} | null>(null);

let mealToEdit = $state<{
	id: string;
	date: string;
	timeOfDay: string;
	description: string;
	caloriesEstimate: number | null;
} | null>(null);

let activeTab = $state('workouts');
const handledNotices = new SvelteSet<string>();

$effect(() => {
	const tab = page.url.searchParams.get('tab');
	if (tab === 'workouts' || tab === 'meals' || tab === 'reminders' || tab === 'weight') {
		activeTab = tab;
	}
});

$effect(() => {
	const notice = page.url.searchParams.get('notice');
	if (!notice || handledNotices.has(notice)) {
		return;
	}

	handledNotices.add(notice);
	if (notice === 'reminder-disabled') {
		toast.success('Reminder disabled successfully!');
	} else if (notice === 'reminder-deleted') {
		toast.success('Reminder deleted successfully!');
	}
});

const todayTotalCalories = $derived.by(() => {
	const today = getTodayString();
	return data.meals
		.filter((meal) => meal.date === today)
		.reduce((sum, meal) => sum + (meal.caloriesEstimate || 0), 0);
});

const toggleReminderDialogTitle = $derived(
	reminderToToggle?.enabled ? 'Enable Reminder' : 'Disable Reminder'
);
const toggleReminderDialogMessage = $derived(
	reminderToToggle?.enabled
		? 'Are you sure you want to enable this reminder?'
		: 'Are you sure you want to disable this reminder?'
);
const toggleReminderDialogButtonText = $derived(reminderToToggle?.enabled ? 'Enable' : 'Disable');
</script>

{#if navigating.to?.url.pathname === '/fitness'}
	<PageSkeleton color="green" />
{:else}
	<PageShell>
		<!-- Page header -->
		<div class="mb-8">
			<h1
				class="font-display bg-linear-to-r from-green-500 to-emerald-600 bg-clip-text text-3xl font-bold text-transparent"
			>
				Fitness & Nutrition
			</h1>
			<p class="mt-2 text-muted-foreground">
				Track your weight, workouts, and meals to achieve your fitness goals
			</p>
		</div>

		<Tabs.Root bind:value={activeTab} class="w-full">
			<Tabs.List
				class="inline-flex h-10 w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground"
			>
				<Tabs.Trigger
					value="workouts"
					class="font-display flex items-center gap-2 data-[state=active]:bg-green-500/15 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400"
				>
					<DumbbellIcon class="h-4 w-4" />
					<span>Workouts</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="weight"
					class="font-display flex items-center gap-2 data-[state=active]:bg-green-500/15 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400"
				>
					<ScaleIcon class="h-4 w-4" />
					<span>Weight</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="meals"
					class="font-display flex items-center gap-2 data-[state=active]:bg-green-500/15 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400"
				>
					<UtensilsCrossedIcon class="h-4 w-4" />
					<span>Meals</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="reminders"
					class="font-display flex items-center gap-2 data-[state=active]:bg-green-500/15 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400"
				>
					<BellRingIcon class="h-4 w-4" />
					<span>Reminders</span>
				</Tabs.Trigger>
			</Tabs.List>

			<!-- ─── WORKOUTS TAB ─────────────────────────────────────── -->
			<Tabs.Content value="workouts" class="mt-6 w-full space-y-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-xl font-bold">Workouts</h2>
						<p class="text-sm text-muted-foreground">Your training history</p>
					</div>
					<LogWorkoutDialog formData={data.workoutForm} />
				</div>

				<WorkoutStatsBar workouts={data.workouts} />

				<WorkoutFrequencyChart workouts={data.workouts} />

				{#if data.workouts.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Recent Workouts</Card.Title> </Card.Header>
						<Card.Content class="max-h-96 overflow-y-auto space-y-2 pr-1">
							{#each data.workouts.slice(0, 10) as workout (workout.id)}
								<WorkoutEntryCard
									{workout}
									onEdit={(w) => {
										workoutToEdit = w;
									}}
									onDelete={(id) => {
										workoutToDelete = id;
										showDeleteWorkoutDialog = true;
									}}
								/>
							{/each}
						</Card.Content>
					</Card.Root>
				{/if}

				{#if workoutToEdit}
					<LogWorkoutDialog
						formData={data.workoutForm}
						editEntry={workoutToEdit}
						onClose={() => {
							workoutToEdit = null;
						}}
					/>
				{/if}

				{#if workoutToDelete}
					<ConfirmDialog
						bind:open={showDeleteWorkoutDialog}
						title="Delete Workout"
						message="Are you sure you want to delete this workout? This action cannot be undone."
						confirmButtonText="Delete"
						actionUrl="?/deleteWorkout"
						id={workoutToDelete}
					/>
				{/if}
			</Tabs.Content>

			<!-- ─── WEIGHT TAB ────────────────────────────────────────── -->
			<Tabs.Content value="weight" class="mt-6 w-full space-y-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-xl font-bold">Weight</h2>
						<p class="text-sm text-muted-foreground">Track your progress toward your goal</p>
					</div>
					<div class="flex items-center gap-2">
						<SetGoalWeightDialog formData={data.goalForm} />
						<LogWeightDialog formData={data.weightForm} />
					</div>
				</div>

				<!-- Stats row -->
				<div class="grid gap-4 md:grid-cols-4">
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Current Weight</Card.Title>
							<ScaleIcon class="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="font-display text-2xl font-bold">
								{data.weightStats.currentWeight ?? '-'}
								lbs
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Goal Weight</Card.Title>
							<TargetIcon class="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="font-display text-2xl font-bold">
								{data.goalWeight?.targetWeightLbs ?? '-'}
								lbs
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Remaining</Card.Title>
							{#if data.weightStats.remainingToGoal && data.weightStats.remainingToGoal > 0}
								<ArrowUpIcon class="h-4 w-4 text-destructive" />
							{:else if data.weightStats.remainingToGoal && data.weightStats.remainingToGoal < 0}
								<ArrowDownIcon class="h-4 w-4 text-green-600" />
							{:else}
								<MinusIcon class="h-4 w-4 text-muted-foreground" />
							{/if}
						</Card.Header>
						<Card.Content>
							<div class="font-display text-2xl font-bold">
								{data.weightStats.remainingToGoal
									? `${Math.abs(data.weightStats.remainingToGoal).toFixed(1)} lbs`
									: '-'}
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Trend</Card.Title>
							{#if data.weightStats.trend === 'down'}
								<TrendingDownIcon class="h-4 w-4 text-green-600" />
							{:else if data.weightStats.trend === 'up'}
								<TrendingUpIcon class="h-4 w-4 text-destructive" />
							{:else}
								<MinusIcon class="h-4 w-4 text-muted-foreground" />
							{/if}
						</Card.Header>
						<Card.Content>
							<div class="font-display text-2xl font-bold capitalize">{data.weightStats.trend}</div>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Weight chart -->
				{#if data.weightEntries.length === 0}
					<div class="flex h-48 items-center justify-center rounded-lg border border-dashed">
						<p class="text-sm text-muted-foreground">
							No weight data yet. Start logging to see your progress!
						</p>
					</div>
				{:else}
					<WeightChart
						title="Weight Progress"
						description="Track your weight over time"
						entries={data.weightEntries}
						goalWeight={data.goalWeight?.targetWeightLbs || null}
					/>
				{/if}

				<!-- Recent weight entries -->
				{#if data.weightEntries.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Recent Entries</Card.Title> </Card.Header>
						<Card.Content class="max-h-96 overflow-y-auto space-y-2 pr-1">
							{#each data.weightEntries.slice(0, 10) as entry, i (entry.id)}
								<WeightEntryCard
									{entry}
									previousEntry={data.weightEntries[i + 1] ?? null}
									onEdit={(e) => {
										weightToEdit = e;
									}}
									onDelete={(id) => {
										weightEntryToDelete = id;
										showDeleteWeightDialog = true;
									}}
								/>
							{/each}
						</Card.Content>
					</Card.Root>
				{/if}

				{#if weightToEdit}
					<LogWeightDialog
						formData={data.weightForm}
						editEntry={weightToEdit}
						onClose={() => {
							weightToEdit = null;
						}}
					/>
				{/if}

				{#if weightEntryToDelete}
					<ConfirmDialog
						bind:open={showDeleteWeightDialog}
						title="Delete Weight Entry"
						message="Are you sure you want to delete this weight entry? This action cannot be undone."
						confirmButtonText="Delete"
						actionUrl="?/deleteWeight"
						id={weightEntryToDelete}
					/>
				{/if}
			</Tabs.Content>

			<!-- ─── MEALS TAB ─────────────────────────────────────────── -->
			<Tabs.Content value="meals" class="mt-6 w-full space-y-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-xl font-bold">Meals</h2>
						<p class="text-sm text-muted-foreground">Nutrition tracking and calorie goals</p>
					</div>
					<div class="flex items-center gap-2">
						<SetCalorieTargetDialog formData={data.calorieForm} />
						<LogMealDialog formData={data.mealForm} />
					</div>
				</div>

				<CalorieProgress
					consumed={todayTotalCalories}
					target={data.calorieTarget?.targetCalories || null}
				/>

				{#if data.meals.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Recent Meals</Card.Title> </Card.Header>
						<Card.Content class="max-h-96 overflow-y-auto space-y-2 pr-1">
							{#each data.meals.slice(0, 15) as meal (meal.id)}
								<MealEntryCard
									{meal}
									onEdit={(m) => {
										mealToEdit = m;
									}}
									onDelete={(id) => {
										mealToDelete = id;
										showDeleteMealDialog = true;
									}}
								/>
							{/each}
						</Card.Content>
					</Card.Root>
				{/if}

				{#if mealToEdit}
					<LogMealDialog
						formData={data.mealForm}
						editEntry={mealToEdit}
						onClose={() => {
							mealToEdit = null;
						}}
					/>
				{/if}

				{#if mealToDelete}
					<ConfirmDialog
						bind:open={showDeleteMealDialog}
						title="Delete Meal"
						message="Are you sure you want to delete this meal entry? This action cannot be undone."
						confirmButtonText="Delete"
						actionUrl="?/deleteMeal"
						id={mealToDelete}
					/>
				{/if}
			</Tabs.Content>

			<!-- ─── REMINDERS TAB ─────────────────────────────────────── -->
			<Tabs.Content value="reminders" class="mt-6 w-full space-y-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-xl font-bold">Reminders</h2>
						<p class="text-sm text-muted-foreground">Email reminders to keep you consistent</p>
					</div>
					<CreateReminderDialog formData={data.reminderForm} />
				</div>

				{#if data.reminders.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Active Reminders</Card.Title> </Card.Header>
						<Card.Content class="space-y-2">
							{#each data.reminders as reminder (reminder.id)}
								<ReminderCard
									{reminder}
									onToggle={(r) => {
										reminderToToggle = r;
										showToggleReminderDialog = true;
									}}
									onDelete={(id) => {
										reminderToDelete = id;
										showDeleteReminderDialog = true;
									}}
								/>
							{/each}
						</Card.Content>
					</Card.Root>
				{:else}
					<Card.Root>
						<Card.Content class="pt-6 text-center text-muted-foreground">
							<p>No workout reminders scheduled yet.</p>
							<p class="mt-1 text-sm">Create your first reminder above to get started!</p>
						</Card.Content>
					</Card.Root>
				{/if}

				{#if reminderToToggle}
					<ConfirmDialog
						bind:open={showToggleReminderDialog}
						title={toggleReminderDialogTitle || 'Update Reminder'}
						message={toggleReminderDialogMessage || 'Are you sure you want to update this reminder?'}
						confirmButtonText={toggleReminderDialogButtonText || 'Confirm'}
						actionUrl="?/updateReminder"
						id={reminderToToggle.id}
						hiddenFields={{
							workoutType: reminderToToggle.workoutType,
							cadence: reminderToToggle.cadence,
							time: reminderToToggle.time,
							daysOfWeek: reminderToToggle.daysOfWeek ?? '',
							enabled: reminderToToggle.enabled
						}}
					/>
				{/if}

				{#if reminderToDelete}
					<ConfirmDialog
						bind:open={showDeleteReminderDialog}
						title="Delete Reminder"
						message="Are you sure you want to delete this reminder? This action cannot be undone."
						confirmButtonText="Delete"
						actionUrl="?/deleteReminder"
						id={reminderToDelete}
					/>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</PageShell>
{/if}

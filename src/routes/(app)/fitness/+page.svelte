<script lang="ts">
import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
import BellIcon from '@lucide/svelte/icons/bell';
import BellOffIcon from '@lucide/svelte/icons/bell-off';
import BellRingIcon from '@lucide/svelte/icons/bell-ring';
import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
import MinusIcon from '@lucide/svelte/icons/minus';
import PencilIcon from '@lucide/svelte/icons/pencil';
import ScaleIcon from '@lucide/svelte/icons/scale';
import TargetIcon from '@lucide/svelte/icons/target';
import Trash2Icon from '@lucide/svelte/icons/trash-2';
import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import UtensilsCrossedIcon from '@lucide/svelte/icons/utensils-crossed';
import { SvelteSet } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';

import { navigating, page } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import CalorieProgress from '$lib/components/fitness/CalorieProgress.svelte';
import ExerciseInput from '$lib/components/fitness/ExerciseInput.svelte';
import WeightChart from '$lib/components/fitness/WeightChart.svelte';
import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
import LongTextInput from '$lib/components/shared/LongTextInput.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select';
import * as Tabs from '$lib/components/ui/tabs';
import type { Exercise } from '$lib/types';
import {
	daysOfWeek,
	formatDateMedium,
	formatDateShort,
	formatTime12Hour,
	getTodayString
} from '$lib/utils/date';

import type { PageData } from './$types.js';

let { data }: { data: PageData } = $props();

// svelte-ignore state_referenced_locally
const {
	form: weightForm,
	errors: weightErrors,
	enhance: weightEnhance,
	message: weightMessage
} = superForm(data.weightForm, {
	resetForm: true,
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Weight logged successfully!');
		}
		if ($weightMessage?.type === 'error') {
			toast.error(`Error logging weight. Reason: ${$weightMessage.text}`);
		}
	}
});

// svelte-ignore state_referenced_locally
const {
	form: workoutForm,
	errors: workoutErrors,
	enhance: workoutEnhance,
	message: workoutMessage
} = superForm(data.workoutForm, {
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Workout logged successfully!');
		}
		if ($workoutMessage?.type === 'error') {
			toast.error(`Error logging workout. Reason: ${$workoutMessage.text}`);
		}
	}
});

// svelte-ignore state_referenced_locally
const {
	form: goalForm,
	errors: goalErrors,
	enhance: goalEnhance,
	message: goalMessage
} = superForm(data.goalForm, {
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Goal weight set successfully!');
		}
		if ($goalMessage?.type === 'error') {
			toast.error(`Error setting goal weight. Reason: ${$goalMessage.text}`);
		}
	}
});

// svelte-ignore state_referenced_locally
const {
	form: mealForm,
	errors: mealErrors,
	enhance: mealEnhance,
	message: mealMessage
} = superForm(data.mealForm, {
	resetForm: true,
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Meal logged successfully!');
		}
		if ($mealMessage?.type === 'error') {
			toast.error(`Error logging meal. Reason: ${$mealMessage.text}`);
		}
	}
});

// svelte-ignore state_referenced_locally
const {
	form: calorieForm,
	errors: calorieErrors,
	enhance: calorieEnhance,
	message: calorieMessage
} = superForm(data.calorieForm, {
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Calorie target set successfully!');
		}
		if ($calorieMessage?.type === 'error') {
			toast.error(`Error setting calorie target. Reason: ${$calorieMessage.text}`);
		}
	}
});

// svelte-ignore state_referenced_locally
const {
	form: reminderForm,
	errors: reminderErrors,
	enhance: reminderEnhance,
	message: reminderMessage
} = superForm(data.reminderForm, {
	resetForm: true,
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Reminder saved successfully!');
		}
		if ($reminderMessage?.type === 'error') {
			toast.error(`Error saving reminder. Reason: ${$reminderMessage.text}`);
		}
	}
});

let workoutExercises = $state<Exercise[]>([]);
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
	daysOfWeek: string;
	enabled: boolean;
} | null>(null);
let showToggleReminderDialog = $state(false);
let activeTab = $state('weight');
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
	if (notice === 'weight-updated') {
		toast.success('Weight entry updated successfully!');
	} else if (notice === 'weight-deleted') {
		toast.success('Weight entry deleted successfully!');
	} else if (notice === 'workout-updated') {
		toast.success('Workout updated successfully!');
	} else if (notice === 'workout-deleted') {
		toast.success('Workout deleted successfully!');
	} else if (notice === 'meal-updated') {
		toast.success('Meal updated successfully!');
	} else if (notice === 'meal-deleted') {
		toast.success('Meal deleted successfully!');
	} else if (notice === 'reminder-disabled') {
		toast.success('Reminder disabled successfully!');
	} else if (notice === 'reminder-deleted') {
		toast.success('Reminder deleted successfully!');
	}
});

// When form is valid, sync to hidden input
$effect(() => {
	if (workoutExercises.length > 0) {
		$workoutForm.exercises = JSON.stringify(workoutExercises);
	}
});

// Calculate today's total calories
let todayTotalCalories = $derived.by(() => {
	const today = getTodayString();
	const todayMeals = data.meals.filter((meal) => meal.date === today);
	return todayMeals.reduce((sum, meal) => sum + (meal.caloriesEstimate || 0), 0);
});

let toggleReminderDialogTitle = $derived(
	reminderToToggle?.enabled ? 'Enable Reminder' : 'Disable Reminder'
);
let toggleReminderDialogMessage = $derived(
	reminderToToggle?.enabled
		? 'Are you sure you want to enable this reminder?'
		: 'Are you sure you want to disable this reminder?'
);
let toggleReminderDialogButtonText = $derived(reminderToToggle?.enabled ? 'Enable' : 'Disable');
</script>

{#if navigating.to?.url.pathname === '/fitness'}
	<PageSkeleton color="green" />
{:else}
	<PageShell>
		<div class="mb-8">
			<h1 class="font-display text-3xl font-bold">Fitness & Nutrition</h1>
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
					class="font-display flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-green-500"
				>
					<DumbbellIcon class="h-4 w-4" />
					<span>Workouts</span>
				</Tabs.Trigger>

				<Tabs.Trigger
					value="weight"
					class="font-display flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-green-500"
				>
					<ScaleIcon class="h-4 w-4" />
					<span>Weight</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="meals"
					class="font-display flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-green-500"
				>
					<UtensilsCrossedIcon class="h-4 w-4" />
					<span>Meals</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="reminders"
					class="font-display flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-green-500"
				>
					<BellRingIcon class="h-4 w-4" />
					<span>Reminders</span>
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="weight" class="mt-6 w-full space-y-6">
				<!-- Stats Cards -->
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

				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Log Weight Form -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Log Weight</Card.Title>
							<Card.Description>Record your current weight</Card.Description>
						</Card.Header>
						<Card.Content>
							<form method="POST" action="?/logWeight" use:weightEnhance>
								<div class="grid gap-4">
									<div class="grid gap-2">
										<Label for="weight-date">Date</Label>
										<Input
											id="weight-date"
											name="date"
											type="date"
											bind:value={$weightForm.date}
											required
										/>
										{#if $weightErrors.date}
											<p class="text-sm text-destructive">{$weightErrors.date}</p>
										{/if}
									</div>
									<div class="grid gap-2">
										<Label for="weight-time">Time (optional)</Label>
										<Input id="weight-time" name="time" type="time" bind:value={$weightForm.time} />
										{#if $weightErrors.time}
											<p class="text-sm text-destructive">{$weightErrors.time}</p>
										{/if}
									</div>
									<div class="grid gap-2">
										<Label for="weight-lbs">Weight (lbs)</Label>
										<Input
											id="weight-lbs"
											name="weightLbs"
											type="number"
											step="0.1"
											bind:value={$weightForm.weightLbs}
											required
										/>
										{#if $weightErrors.weightLbs}
											<p class="text-sm text-destructive">{$weightErrors.weightLbs}</p>
										{/if}
										<Button type="submit" class="w-full">Log Weight</Button>
									</div>
								</div>
							</form>
						</Card.Content>
					</Card.Root>

					<!-- Set Goal Weight Form -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Set Goal Weight</Card.Title>
							<Card.Description>Define your target weight goal</Card.Description>
						</Card.Header>
						<Card.Content>
							<form method="POST" action="?/setGoal" use:goalEnhance>
								<div class="grid gap-4">
									<div class="grid gap-2">
										<Label for="goal-weight">Target Weight (lbs)</Label>
										<Input
											id="goal-weight"
											name="targetWeightLbs"
											type="number"
											step="0.1"
											bind:value={$goalForm.targetWeightLbs}
											required
										/>
										{#if $goalErrors.targetWeightLbs}
											<p class="text-sm text-destructive">{$goalErrors.targetWeightLbs}</p>
										{/if}
									</div>
									<Button type="submit" class="w-full">Set Goal</Button>
								</div>
							</form>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Weight Chart -->
				{#if data.weightEntries.length === 0}
					<div class="flex h-75 items-center justify-center rounded-lg border border-dashed">
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

				<!-- Recent Entries -->
				{#if data.weightEntries.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Recent Entries</Card.Title> </Card.Header>
						<Card.Content>
							<div class="space-y-2">
								{#each data.weightEntries.slice(0, 10) as entry (entry.id)}
									<div class="flex items-center justify-between rounded-lg border p-3">
										<div>
											<p class="font-medium">{entry.weightLbs} lbs</p>
											<p class="text-sm text-muted-foreground">
												{formatDateShort(entry.date)}
												{#if entry.time}
													@ {formatTime12Hour(entry.time)}
												{/if}
											</p>
										</div>
										<div class="flex items-center gap-2">
											<Button
												variant="outline"
												size="icon"
												href="/fitness/weight/{entry.id}/edit"
												aria-label="Edit weight entry"
												title="Edit"
											>
												<PencilIcon class="h-4 w-4" />
											</Button>
											<Button
												type="button"
												variant="destructive"
												size="icon"
												onclick={() => {
													weightEntryToDelete = entry.id;
													showDeleteWeightDialog = true;
												}}
												aria-label="Delete weight entry"
												title="Delete"
											>
												<Trash2Icon class="h-4 w-4" />
											</Button>
										</div>
									</div>
								{/each}
							</div>
							{#if weightEntryToDelete}
								<ConfirmDialog
									bind:open={showDeleteWeightDialog}
									title="Delete Weight Entry"
									message="Are you sure you want to delete this weight entry? This action cannot be undone."
									confirmButtonText="Delete"
									actionUrl="/fitness/weight/{weightEntryToDelete}/edit?/delete"
									id={weightEntryToDelete}
								/>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="workouts" class="mt-6 w-full space-y-6">
				<!-- Log Workout Form -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Log Workout</Card.Title>
						<Card.Description>Record your workout session</Card.Description>
					</Card.Header>
					<Card.Content>
						<form method="POST" action="?/logWorkout" use:workoutEnhance>
							<div class="grid gap-4">
								<div class="grid grid-cols-2 gap-4">
									<div class="grid gap-2">
										<Label for="workout-date">Date</Label>
										<Input
											id="workout-date"
											name="date"
											type="date"
											bind:value={$workoutForm.date}
											required
										/>
										{#if $workoutErrors.date}
											<p class="text-sm text-destructive">{$workoutErrors.date}</p>
										{/if}
									</div>
									<div class="grid gap-2">
										<Label for="workout-time">Time (optional)</Label>
										<Input
											id="workout-time"
											name="time"
											type="time"
											bind:value={$workoutForm.time}
										/>
										{#if $workoutErrors.time}
											<p class="text-sm text-destructive">{$workoutErrors.time}</p>
										{/if}
									</div>
								</div>

								<div class="grid gap-2">
									<Label for="workout-type">Workout Type</Label>
									<Select.Root type="single" name="type" bind:value={$workoutForm.type}>
										<Select.Trigger id="workout-type">
											{$workoutForm.type || 'Select workout type'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="strength" label="Strength">Strength</Select.Item>
											<Select.Item value="cardio" label="Cardio">Cardio</Select.Item>
											<Select.Item value="yoga" label="Yoga">Yoga</Select.Item>
											<Select.Item value="other" label="Other">Other</Select.Item>
										</Select.Content>
									</Select.Root>
									{#if $workoutErrors.type}
										<p class="text-sm text-destructive">{$workoutErrors.type}</p>
									{/if}
								</div>

								<div class="grid gap-2">
									<Label for="workout-duration">Duration (minutes)</Label>
									<Input
										id="workout-duration"
										name="durationMinutes"
										type="number"
										bind:value={$workoutForm.durationMinutes}
										placeholder="60"
									/>
									{#if $workoutErrors.durationMinutes}
										<p class="text-sm text-destructive">{$workoutErrors.durationMinutes}</p>
									{/if}
								</div>

								{#if $workoutForm.type === 'strength'}
									<ExerciseInput bind:exercises={workoutExercises} />
									<Input type="hidden" name="exercises" value={JSON.stringify(workoutExercises)} />
									{#if $workoutErrors.exercises}
										<p class="text-sm text-destructive">{$workoutErrors.exercises}</p>
									{/if}
								{/if}

								<div class="grid gap-2">
									<Label for="workout-notes">Notes (optional)</Label>
									<LongTextInput
										id="workout-notes"
										name="notes"
										bind:value={$workoutForm.notes}
										rows={3}
										placeholder="How did the workout feel?"
									/>
									{#if $workoutErrors.notes}
										<p class="text-sm text-destructive">{$workoutErrors.notes}</p>
									{/if}
								</div>

								<Button type="submit" class="w-full">Log Workout</Button>
							</div>
						</form>
					</Card.Content>
				</Card.Root>

				<!-- Recent Workouts -->
				{#if data.workouts.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Recent Workouts</Card.Title> </Card.Header>
						<Card.Content>
							<div class="space-y-3">
								{#each data.workouts.slice(0, 10) as workout (workout.id)}
									<div class="rounded-lg border p-4">
										<div class="flex items-start justify-between">
											<div class="space-y-1">
												<div class="flex items-center gap-2">
													<span
														class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
														class:bg-orange-100={workout.type === 'strength'}
														class:text-orange-800={workout.type === 'strength'}
														class:bg-blue-100={workout.type === 'cardio'}
														class:text-blue-800={workout.type === 'cardio'}
														class:bg-purple-100={workout.type === 'yoga'}
														class:text-purple-800={workout.type === 'yoga'}
														class:bg-gray-100={workout.type === 'other'}
														class:text-gray-800={workout.type === 'other'}
													>
														{workout.type}
													</span>
													{#if workout.durationMinutes}
														<span class="text-sm text-muted-foreground">
															{workout.durationMinutes}
															min
														</span>
													{/if}
												</div>
												<p class="text-sm text-muted-foreground">
													{formatDateMedium(workout.date)}
													{#if workout.time}
														@ {formatTime12Hour(workout.time)}
													{/if}
												</p>
												{#if workout.notes}
													<p class="mt-2 text-sm">{workout.notes}</p>
												{/if}
												{#if workout.exercises && workout.exercises.length > 0}
													<div class="mt-3 space-y-2">
														<p class="text-sm font-medium">Exercises:</p>
														{#each workout.exercises as exercise (exercise.exerciseName)}
															<div class="ml-4 text-sm text-muted-foreground">
																• {exercise.exerciseName}
																{#if exercise.sets || exercise.reps || exercise.weightLbs}
																	<span class="ml-2">
																		{#if exercise.sets}
																			{exercise.sets}
																			sets
																		{/if}
																		{#if exercise.reps}
																			× {exercise.reps} reps
																		{/if}
																		{#if exercise.weightLbs}
																			@ {exercise.weightLbs} lbs
																		{/if}
																	</span>
																{/if}
															</div>
														{/each}
													</div>
												{/if}
											</div>
											<div class="mt-3 flex items-center gap-2">
												<Button
													variant="outline"
													size="icon"
													href="/fitness/workouts/{workout.id}/edit"
													aria-label="Edit workout"
													title="Edit"
												>
													<PencilIcon class="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="destructive"
													size="icon"
													onclick={() => {
														workoutToDelete = workout.id;
														showDeleteWorkoutDialog = true;
													}}
													aria-label="Delete workout"
													title="Delete"
												>
													<Trash2Icon class="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								{/each}
							</div>
							{#if workoutToDelete}
								<ConfirmDialog
									bind:open={showDeleteWorkoutDialog}
									title="Delete Workout"
									message="Are you sure you want to delete this workout? This action cannot be undone."
									confirmButtonText="Delete"
									actionUrl="/fitness/workouts/{workoutToDelete}/edit?/delete"
									id={workoutToDelete}
								/>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="meals" class="mt-6 w-full space-y-6">
				<!-- Calorie Progress -->
				<CalorieProgress
					consumed={todayTotalCalories}
					target={data.calorieTarget?.targetCalories || null}
				/>

				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Log Meal Form -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Log Meal</Card.Title>
							<Card.Description>Record what you ate</Card.Description>
						</Card.Header>
						<Card.Content>
							<form method="POST" action="?/logMeal" use:mealEnhance>
								<div class="grid gap-4">
									<div class="grid gap-2">
										<Label for="meal-date">Date</Label>
										<Input
											id="meal-date"
											name="date"
											type="date"
											bind:value={$mealForm.date}
											required
										/>
										{#if $mealErrors.date}
											<p class="text-sm text-destructive">{$mealErrors.date}</p>
										{/if}
									</div>
									<div class="grid gap-2">
										<Label for="meal-time">Meal Type</Label>
										<Select.Root type="single" name="timeOfDay" bind:value={$mealForm.timeOfDay}>
											<Select.Trigger id="meal-time">
												{$mealForm.timeOfDay || 'Select meal type'}
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="breakfast" label="Breakfast">Breakfast</Select.Item>
												<Select.Item value="lunch" label="Lunch">Lunch</Select.Item>
												<Select.Item value="dinner" label="Dinner">Dinner</Select.Item>
												<Select.Item value="snack" label="Snack">Snack</Select.Item>
											</Select.Content>
										</Select.Root>
										{#if $mealErrors.timeOfDay}
											<p class="text-sm text-destructive">{$mealErrors.timeOfDay}</p>
										{/if}
									</div>
									<div class="grid gap-2">
										<Label for="meal-description">Description</Label>
										<LongTextInput
											id="meal-description"
											name="description"
											bind:value={$mealForm.description}
											rows={3}
											placeholder="e.g., Chicken salad with olive oil dressing"
											required
										/>
										{#if $mealErrors.description}
											<p class="text-sm text-destructive">{$mealErrors.description}</p>
										{/if}
									</div>
									<div class="grid gap-2">
										<Label for="meal-calories">Calories (estimate)</Label>
										<Input
											id="meal-calories"
											name="caloriesEstimate"
											type="number"
											bind:value={$mealForm.caloriesEstimate}
											placeholder="500"
										/>
										{#if $mealErrors.caloriesEstimate}
											<p class="text-sm text-destructive">{$mealErrors.caloriesEstimate}</p>
										{/if}
									</div>
									<Button type="submit" class="w-full">Log Meal</Button>
								</div>
							</form>
						</Card.Content>
					</Card.Root>

					<!-- Set Calorie Target Form -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Set Calorie Target</Card.Title>
							<Card.Description>Define your daily calorie goal</Card.Description>
						</Card.Header>
						<Card.Content>
							<form method="POST" action="?/setCalorieTarget" use:calorieEnhance>
								<div class="grid gap-4">
									<div class="grid gap-2">
										<Label for="calorie-target">Daily Target (calories)</Label>
										<Input
											id="calorie-target"
											name="targetCalories"
											type="number"
											bind:value={$calorieForm.targetCalories}
											placeholder="2000"
											class={$calorieErrors.targetCalories ? 'border-destructive' : ''}
											required
										/>
										{#if $calorieErrors.targetCalories}
											<p class="text-sm text-destructive">{$calorieErrors.targetCalories}</p>
										{/if}
									</div>
									{#if $calorieMessage}
										<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
											{$calorieMessage}
										</div>
									{/if}
									<Button type="submit" class="w-full">Set Target</Button>
								</div>
							</form>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Recent Meals -->
				{#if data.meals.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Recent Meals</Card.Title> </Card.Header>
						<Card.Content>
							<div class="space-y-3">
								{#each data.meals.slice(0, 15) as meal (meal.id)}
									<div class="rounded-lg border p-4">
										<div class="flex items-start justify-between">
											<div class="space-y-1">
												<div class="flex items-center gap-2">
													<span
														class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
														class:bg-yellow-100={meal.timeOfDay === 'breakfast'}
														class:text-yellow-800={meal.timeOfDay === 'breakfast'}
														class:bg-green-100={meal.timeOfDay === 'lunch'}
														class:text-green-800={meal.timeOfDay === 'lunch'}
														class:bg-blue-100={meal.timeOfDay === 'dinner'}
														class:text-blue-800={meal.timeOfDay === 'dinner'}
														class:bg-purple-100={meal.timeOfDay === 'snack'}
														class:text-purple-800={meal.timeOfDay === 'snack'}
													>
														{meal.timeOfDay}
													</span>
													{#if meal.caloriesEstimate}
														<span class="text-sm font-medium">{meal.caloriesEstimate} cal</span>
													{/if}
												</div>
												<p class="text-sm text-muted-foreground">{formatDateShort(meal.date)}</p>
												<p class="mt-2 text-sm">{meal.description}</p>
											</div>
											<div class="mt-3 flex items-center gap-2">
												<Button
													variant="outline"
													size="icon"
													href="/fitness/meals/{meal.id}/edit"
													aria-label="Edit meal"
													title="Edit"
												>
													<PencilIcon class="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="destructive"
													size="icon"
													onclick={() => {
														mealToDelete = meal.id;
														showDeleteMealDialog = true;
													}}
													aria-label="Delete meal"
													title="Delete"
												>
													<Trash2Icon class="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								{/each}
							</div>
							{#if mealToDelete}
								<ConfirmDialog
									bind:open={showDeleteMealDialog}
									title="Delete Meal"
									message="Are you sure you want to delete this meal entry? This action cannot be undone."
									confirmButtonText="Delete"
									actionUrl="/fitness/meals/{mealToDelete}/edit?/delete"
									id={mealToDelete}
								/>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="reminders" class="mt-6 w-full space-y-6">
				<!-- Create Reminder Form -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Schedule Workout Reminder</Card.Title>
						<Card.Description>
							Get email reminders to stay consistent with your workout routine
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<form method="POST" action="?/createReminder" use:reminderEnhance>
							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="workoutType">Workout Type</Label>
									<Select.Root
										type="single"
										name="workoutType"
										bind:value={$reminderForm.workoutType}
									>
										<Select.Trigger id="workoutType">
											{$reminderForm.workoutType || 'Select workout type'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="strength" label="Strength">Strength</Select.Item>
											<Select.Item value="cardio" label="Cardio">Cardio</Select.Item>
											<Select.Item value="yoga" label="Yoga">Yoga</Select.Item>
											<Select.Item value="other" label="Other">Other</Select.Item>
										</Select.Content>
									</Select.Root>
									{#if $reminderErrors.workoutType}
										<p class="text-sm text-destructive">{$reminderErrors.workoutType}</p>
									{/if}
								</div>

								<div class="space-y-2">
									<Label for="reminderTime">Time</Label>
									<Input
										id="reminderTime"
										name="time"
										type="time"
										bind:value={$reminderForm.time}
										placeholder="HH:MM"
										required
									/>
									{#if $reminderErrors.time}
										<p class="text-sm text-destructive">{$reminderErrors.time}</p>
									{/if}
								</div>

								<div class="space-y-2">
									<Label for="cadence">Frequency</Label>
									<Select.Root type="single" name="cadence" bind:value={$reminderForm.cadence}>
										<Select.Trigger id="cadence">
											{$reminderForm.cadence || 'Select frequency'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="daily" label="Daily">Daily</Select.Item>
											<Select.Item value="weekly" label="Weekly">Weekly</Select.Item>
										</Select.Content>
									</Select.Root>
									{#if $reminderErrors.cadence}
										<p class="text-sm text-destructive">{$reminderErrors.cadence}</p>
									{/if}
								</div>

								{#if $reminderForm.cadence === 'weekly'}
									<div class="space-y-2">
										<Label>Days of Week</Label>
										<Input
											id="daysOfWeek"
											name="daysOfWeek"
											type="text"
											bind:value={$reminderForm.daysOfWeek}
											hidden
										/>
										<div class="flex flex-wrap gap-2">
											{#each daysOfWeek as day (day.id)}
												{@const selectedDays = $reminderForm.daysOfWeek
													? JSON.parse($reminderForm.daysOfWeek)
													: []}
												<Button
													type="button"
													variant={selectedDays.includes(day.id) ? 'default' : 'outline'}
													size="sm"
													onclick={() => {
														const days = $reminderForm.daysOfWeek
															? JSON.parse($reminderForm.daysOfWeek)
															: [];
														if (days.includes(day.id)) {
															$reminderForm.daysOfWeek = JSON.stringify(
																days.filter((d: number) => d !== day.id)
															);
														} else {
															$reminderForm.daysOfWeek = JSON.stringify([...days, day.id].sort());
														}
													}}
												>
													{day.shortName}
												</Button>
											{/each}
										</div>
										{#if $reminderErrors.daysOfWeek}
											<p class="text-sm text-destructive">{$reminderErrors.daysOfWeek}</p>
										{/if}
									</div>
								{/if}
							</div>

							<div class="mt-4"><Button type="submit">Create Reminder</Button></div>
						</form>
					</Card.Content>
				</Card.Root>

				<!-- Active Reminders List -->
				{#if data.reminders.length > 0}
					<Card.Root>
						<Card.Header> <Card.Title>Active Reminders</Card.Title> </Card.Header>
						<Card.Content>
							<div class="space-y-3">
								{#each data.reminders as reminder (reminder.id)}
									<div class="rounded-lg border p-4">
										<div class="flex items-start justify-between">
											<div class="flex-1 space-y-1">
												<div class="flex items-center gap-2">
													<span
														class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
														class:bg-purple-100={reminder.workoutType === 'strength'}
														class:text-purple-800={reminder.workoutType === 'strength'}
														class:bg-blue-100={reminder.workoutType === 'cardio'}
														class:text-blue-800={reminder.workoutType === 'cardio'}
														class:bg-green-100={reminder.workoutType === 'yoga'}
														class:text-green-800={reminder.workoutType === 'yoga'}
														class:bg-gray-100={reminder.workoutType === 'other'}
														class:text-gray-800={reminder.workoutType === 'other'}
													>
														{reminder.workoutType}
													</span>
													<span class="text-sm font-medium">{formatTime12Hour(reminder.time)}</span>
													{#if !reminder.enabled}
														<span class="text-xs text-muted-foreground">(Disabled)</span>
													{/if}
												</div>
												<p class="text-sm text-muted-foreground">
													{reminder.cadence === 'daily'
														? 'Every day'
														: `Weekly on ${
																reminder.daysOfWeek
																	? JSON.parse(reminder.daysOfWeek)
																			.map(
																				(d: string) => daysOfWeek[d as unknown as number].shortName
																			)
																			.join(', ')
																	: 'Not configured'
															}`}
												</p>
											</div>
											<div class="flex gap-2">
												<Button
													type="button"
													variant="outline"
													size="icon"
													onclick={() => {
														reminderToToggle = {
															id: reminder.id,
															workoutType: reminder.workoutType,
															cadence: reminder.cadence,
															time: reminder.time,
															daysOfWeek: reminder.daysOfWeek || '',
															enabled: !reminder.enabled
														};
														showToggleReminderDialog = true;
													}}
													aria-label={reminder.enabled ? 'Disable reminder' : 'Enable reminder'}
													title={reminder.enabled ? 'Disable' : 'Enable'}
												>
													{#if reminder.enabled}
														<BellOffIcon class="h-4 w-4" />
													{:else}
														<BellIcon class="h-4 w-4" />
													{/if}
												</Button>
												<Button
													type="button"
													variant="destructive"
													size="icon"
													onclick={() => {
														reminderToDelete = reminder.id;
														showDeleteReminderDialog = true;
													}}
													aria-label="Delete reminder"
													title="Delete"
												>
													<Trash2Icon class="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								{/each}
							</div>
							{#if reminderToToggle}
								<ConfirmDialog
									bind:open={showToggleReminderDialog}
									title={toggleReminderDialogTitle || 'Update Reminder'}
									message={toggleReminderDialogMessage ||
										'Are you sure you want to update this reminder?'}
									confirmButtonText={toggleReminderDialogButtonText || 'Confirm'}
									actionUrl="?/updateReminder"
									id={reminderToToggle.id}
									hiddenFields={{
										workoutType: reminderToToggle.workoutType,
										cadence: reminderToToggle.cadence,
										time: reminderToToggle.time,
										daysOfWeek: reminderToToggle.daysOfWeek,
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
			</Tabs.Content>
		</Tabs.Root>
	</PageShell>
{/if}

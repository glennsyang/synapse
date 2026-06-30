<script lang="ts">
	import { navigating, page } from '$app/state';
	import PageShell from '$lib/components/app/PageShell.svelte';
	import ActivityHistorySheet from '$lib/components/fitness/dashboard/ActivityHistorySheet.svelte';
	import FitnessDashboardHeader from '$lib/components/fitness/dashboard/FitnessDashboardHeader.svelte';
	import FitnessMomentumPanel from '$lib/components/fitness/dashboard/FitnessMomentumPanel.svelte';
	import FitnessStatusCard from '$lib/components/fitness/dashboard/FitnessStatusCard.svelte';
	import NutritionInsightsSection from '$lib/components/fitness/dashboard/NutritionInsightsSection.svelte';
	import RecentActivityPreview from '$lib/components/fitness/dashboard/RecentActivityPreview.svelte';
	import ReminderSummarySection from '$lib/components/fitness/dashboard/ReminderSummarySection.svelte';
	import WeightInsightsSection from '$lib/components/fitness/dashboard/WeightInsightsSection.svelte';
	import WorkoutInsightsSection from '$lib/components/fitness/dashboard/WorkoutInsightsSection.svelte';
	import LogMealDialog from '$lib/components/fitness/dialogs/LogMealDialog.svelte';
	import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
	import LogWorkoutDialog from '$lib/components/fitness/dialogs/LogWorkoutDialog.svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import { getTodayString, parseLocalDateString } from '$lib/utils/date';
	import { Activity, Dumbbell, Flame, Scale, UtensilsCrossed } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';
	import { SvelteSet } from 'svelte/reactivity';

	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// ─── Delete state ─────────────────────────────────────────────────────────────
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

	// ─── Edit state ───────────────────────────────────────────────────────────────
	let showEditWorkoutDialog = $state(false);
	let showEditWeightDialog = $state(false);
	let showEditMealDialog = $state(false);

	let weightToEdit = $state<{
		id: string;
		date: string;
		time: string | null;
		weightLbs: number;
	} | null>(null);

	let workoutToEdit = $state<{
		id: string;
		date: string;
		time: string;
		type: string;
		durationMinutes: number;
		steps: number | null;
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

	// ─── Edit effects ───────────────────────────────────────────────────────────────
	$effect(() => {
		if (workoutToEdit) {
			showEditWorkoutDialog = true;
		}
	});

	$effect(() => {
		if (weightToEdit) {
			showEditWeightDialog = true;
		}
	});

	$effect(() => {
		if (mealToEdit) {
			showEditMealDialog = true;
		}
	});

	// ─── History sheet ─────────────────────────────────────────────────────────────
	let historySheetOpen = $state(false);

	// ─── Toast notices ─────────────────────────────────────────────────────────────
	const handledNotices = new SvelteSet<string>();

	$effect(() => {
		const notice = page.url.searchParams.get('notice');
		if (!notice || handledNotices.has(notice)) return;
		handledNotices.add(notice);
		if (notice === 'reminder-disabled') toast.success('Reminder updated successfully!');
		else if (notice === 'reminder-deleted') toast.success('Reminder deleted successfully!');
	});

	// ─── Hero KPI derivations ──────────────────────────────────────────────────────
	const today = $derived(getTodayString());

	const todayCalories = $derived(
		data.meals.filter((m) => m.date === today).reduce((s, m) => s + (m.caloriesEstimate ?? 0), 0)
	);

	const calorieAdherence = $derived(
		data.calorieTarget
			? Math.round((todayCalories / data.calorieTarget.targetCalories) * 100)
			: null
	);

	const weeklySessionCount = $derived.by(() => {
		const todayDate = parseLocalDateString(today);
		const startOfWeek = new Date(todayDate);
		startOfWeek.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
		startOfWeek.setHours(0, 0, 0, 0);
		return data.workouts.filter((w) => parseLocalDateString(w.date) >= startOfWeek).length;
	});

	const dayStreak = $derived.by(() => {
		const workoutDates = new Set(data.workouts.map((w) => w.date));
		let streak = 0;
		const d = new Date(parseLocalDateString(today));
		while (true) {
			const dateStr = d.toISOString().slice(0, 10);
			if (workoutDates.has(dateStr)) {
				streak++;
				d.setDate(d.getDate() - 1);
			} else {
				break;
			}
		}
		return streak;
	});

	const weightDelta = $derived.by(() => {
		if (data.weightEntries.length < 2) return null;
		return data.weightEntries[0].weightLbs - data.weightEntries[1].weightLbs;
	});

	// ─── Toggle reminder ───────────────────────────────────────────────────────────
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
		<!-- Header with unified action cluster -->
		<FitnessDashboardHeader
			workoutForm={data.workoutForm}
			weightForm={data.weightForm}
			mealForm={data.mealForm}
			goalForm={data.goalForm}
			calorieForm={data.calorieForm}
			reminderForm={data.reminderForm}
		/>

		<!-- Daily Status Band: Hero KPI cards -->
		<div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
			<FitnessStatusCard
				label="This Week"
				value={weeklySessionCount}
				unit="sessions"
				icon={Dumbbell}
				gradient="from-orange-500 to-amber-400"
				trendLabel={weeklySessionCount >= 3
					? 'Strong week'
					: weeklySessionCount >= 1
						? 'Keep going'
						: 'Start today'}
			/>
			<FitnessStatusCard
				label="Day Streak"
				value={dayStreak}
				unit={dayStreak === 1 ? 'day' : 'days'}
				icon={Flame}
				gradient="from-rose-500 to-orange-400"
				trendLabel={dayStreak >= 5
					? 'Excellent consistency'
					: dayStreak >= 2
						? 'Building habit'
						: dayStreak === 1
							? 'Day one — keep it up'
							: 'Start a new streak'}
			/>
			<FitnessStatusCard
				label="Weight"
				value={data.weightStats.currentWeight ?? '—'}
				unit={data.weightStats.currentWeight ? 'lbs' : ''}
				icon={Scale}
				gradient="from-emerald-500 to-teal-400"
				trendLabel={weightDelta != null
					? weightDelta < 0
						? `${Math.abs(weightDelta).toFixed(1)} lbs down`
						: weightDelta > 0
							? `${weightDelta.toFixed(1)} lbs up`
							: 'No change'
					: 'Start logging'}
			/>
			<FitnessStatusCard
				label="Today's Cal"
				value={todayCalories}
				unit="cal"
				icon={UtensilsCrossed}
				gradient="from-sky-500 to-blue-400"
				trendLabel={calorieAdherence != null ? `${calorieAdherence}% of target` : 'No target set'}
			/>
		</div>

		<!-- Momentum Panel: 14-day visual strip -->
		<FitnessMomentumPanel
			workouts={data.workouts}
			weightEntries={data.weightEntries}
			meals={data.meals}
			calorieTarget={data.calorieTarget?.targetCalories ?? null}
		/>

		<!-- Collapsible Sections -->
		<Accordion.Root type="multiple" class="space-y-4">
			<!-- Workouts Section -->
			<Accordion.Item value="workouts" class="rounded-xl border-0 shadow-sm">
				<Accordion.Trigger class="px-6 py-4 hover:no-underline data-[state=open]:border-b">
					<div class="flex items-center gap-3">
						<Dumbbell class="h-5 w-5 text-orange-500" />
						<span class="text-lg font-semibold">Workouts</span>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="px-6 pb-6">
					<WorkoutInsightsSection workouts={data.workouts} workoutForm={data.workoutForm} />
				</Accordion.Content>
			</Accordion.Item>

			<!-- Weight Section -->
			<Accordion.Item value="weight" class="rounded-xl border-0 shadow-sm">
				<Accordion.Trigger class="px-6 py-4 hover:no-underline data-[state=open]:border-b">
					<div class="flex items-center gap-3">
						<Scale class="h-5 w-5 text-emerald-500" />
						<span class="text-lg font-semibold">Weight</span>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="px-6 pb-6">
					<WeightInsightsSection
						weightEntries={data.weightEntries}
						weightStats={data.weightStats}
						goalWeight={data.goalWeight}
						weightForm={data.weightForm}
						goalForm={data.goalForm}
					/>
				</Accordion.Content>
			</Accordion.Item>

			<!-- Nutrition Section -->
			<Accordion.Item value="nutrition" class="rounded-xl border-0 shadow-sm">
				<Accordion.Trigger class="px-6 py-4 hover:no-underline data-[state=open]:border-b">
					<div class="flex items-center gap-3">
						<UtensilsCrossed class="h-5 w-5 text-sky-500" />
						<span class="text-lg font-semibold">Nutrition</span>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="px-6 pb-6">
					<NutritionInsightsSection
						meals={data.meals}
						calorieTarget={data.calorieTarget}
						mealForm={data.mealForm}
						calorieForm={data.calorieForm}
					/>
				</Accordion.Content>
			</Accordion.Item>

			<!-- Habits & Reminders Section -->
			<Accordion.Item value="reminders" class="rounded-xl border-0 shadow-sm">
				<Accordion.Trigger class="px-6 py-4 hover:no-underline data-[state=open]:border-b">
					<div class="flex items-center gap-3">
						<Flame class="h-5 w-5 text-rose-500" />
						<span class="text-lg font-semibold">Habits & Reminders</span>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="px-6 pb-6">
					<ReminderSummarySection
						reminders={data.reminders}
						reminderForm={data.reminderForm}
						onToggle={(r) => {
							reminderToToggle = r;
							showToggleReminderDialog = true;
						}}
						onDelete={(id) => {
							reminderToDelete = id;
							showDeleteReminderDialog = true;
						}}
					/>
				</Accordion.Content>
			</Accordion.Item>

			<!-- Recent Activity Section -->
			<Accordion.Item value="recent-activity" class="rounded-xl border-0 shadow-sm">
				<Accordion.Trigger class="px-6 py-4 hover:no-underline data-[state=open]:border-b">
					<div class="flex items-center gap-3">
						<Activity class="h-5 w-5 text-purple-500" />
						<span class="text-lg font-semibold">Recent Activity</span>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="px-6 pb-6">
					<RecentActivityPreview
						workouts={data.workouts}
						weightEntries={data.weightEntries}
						meals={data.meals}
						onEditWorkout={(w) =>
							(workoutToEdit = {
								...w,
								time: w.time ?? '',
								durationMinutes: w.durationMinutes ?? 0
							})}
						onDeleteWorkout={(id) => {
							workoutToDelete = id;
							showDeleteWorkoutDialog = true;
						}}
						onEditWeight={(e) => (weightToEdit = e)}
						onDeleteWeight={(id) => {
							weightEntryToDelete = id;
							showDeleteWeightDialog = true;
						}}
						onEditMeal={(m) => (mealToEdit = m)}
						onDeleteMeal={(id) => {
							mealToDelete = id;
							showDeleteMealDialog = true;
						}}
						onViewAll={() => (historySheetOpen = true)}
					/>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>

		<!-- Full Activity History Sheet -->
		<ActivityHistorySheet
			bind:open={historySheetOpen}
			workouts={data.workouts}
			weightEntries={data.weightEntries}
			meals={data.meals}
			onEditWorkout={(w) =>
				(workoutToEdit = { ...w, time: w.time ?? '', durationMinutes: w.durationMinutes ?? 0 })}
			onDeleteWorkout={(id) => {
				workoutToDelete = id;
				showDeleteWorkoutDialog = true;
			}}
			onEditWeight={(e) => (weightToEdit = e)}
			onDeleteWeight={(id) => {
				weightEntryToDelete = id;
				showDeleteWeightDialog = true;
			}}
			onEditMeal={(m) => (mealToEdit = m)}
			onDeleteMeal={(id) => {
				mealToDelete = id;
				showDeleteMealDialog = true;
			}}
		/>

		<!-- ─── Edit dialogs ──────────────────────────────────────────────────── -->
		<LogWorkoutDialog
			formData={data.workoutForm}
			editEntry={workoutToEdit}
			bind:open={showEditWorkoutDialog}
			instanceId="edit-main"
			onClose={() => {
				showEditWorkoutDialog = false;
				workoutToEdit = null;
			}}
		/>

		<LogWeightDialog
			bind:open={showEditWeightDialog}
			formData={data.weightForm}
			editEntry={weightToEdit}
			instanceId="edit-main"
			onClose={() => {
				showEditWeightDialog = false;
				weightToEdit = null;
			}}
		/>

		<LogMealDialog
			formData={data.mealForm}
			editEntry={mealToEdit}
			bind:open={showEditMealDialog}
			instanceId="edit-main"
			onClose={() => {
				showEditMealDialog = false;
				mealToEdit = null;
			}}
		/>

		<!-- ─── Confirm dialogs ────────────────────────────────────────────────── -->
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
	</PageShell>
{/if}

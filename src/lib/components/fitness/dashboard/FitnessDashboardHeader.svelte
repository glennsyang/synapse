<script lang="ts">
import {
	BellPlus,
	Dumbbell,
	EllipsisVertical,
	Scale,
	Settings,
	Target,
	UtensilsCrossed
} from '@lucide/svelte/icons';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

import CreateReminderDialog from '$lib/components/fitness/dialogs/CreateReminderDialog.svelte';
import LogMealDialog from '$lib/components/fitness/dialogs/LogMealDialog.svelte';
import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
import LogWorkoutDialog from '$lib/components/fitness/dialogs/LogWorkoutDialog.svelte';
import SetCalorieTargetDialog from '$lib/components/fitness/dialogs/SetCalorieTargetDialog.svelte';
import SetGoalWeightDialog from '$lib/components/fitness/dialogs/SetGoalWeightDialog.svelte';
import { buttonVariants } from '$lib/components/ui/button';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
import type {
	logMealSchema,
	logWeightSchema,
	logWorkoutSchema,
	setCalorieTargetSchema,
	setGoalWeightSchema,
	workoutReminderSchema
} from '$lib/schemas/fitness';

interface Props {
	workoutForm: SuperValidated<Infer<typeof logWorkoutSchema>>;
	weightForm: SuperValidated<Infer<typeof logWeightSchema>>;
	mealForm: SuperValidated<Infer<typeof logMealSchema>>;
	goalForm: SuperValidated<Infer<typeof setGoalWeightSchema>>;
	calorieForm: SuperValidated<Infer<typeof setCalorieTargetSchema>>;
	reminderForm: SuperValidated<Infer<typeof workoutReminderSchema>>;
}

let { workoutForm, weightForm, mealForm, goalForm, calorieForm, reminderForm }: Props = $props();

// Dialog state
let showLogWorkout = $state(false);
let showLogWeight = $state(false);
let showLogMeal = $state(false);
let showSetGoalWeight = $state(false);
let showSetCalorieTarget = $state(false);
let showCreateReminder = $state(false);
</script>

<div
	class="mb-4 rounded-2xl border border-green-200/75 bg-linear-to-br from-green-100/90 via-background to-green-50/85 p-6 shadow-[0_26px_70px_-40px_rgba(249,115,22,0.22)] dark:border-green-500/25 dark:from-green-500/12 dark:via-background dark:to-green-500/6 dark:shadow-[0_26px_70px_-44px_rgba(249,115,22,0.14)]"
>
	<div class="flex items-start justify-between">
		<div>
			<h1 class="font-display text-3xl font-bold sm:text-3xl">Fitness Hub</h1>
			<p class="mt-2 text-sm text-zinc-400">Your momentum, trends, and habits — at a glance</p>
		</div>

		<!-- Dropdown Menu in top right -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={buttonVariants({ variant: "outline", size: "icon-sm" })}>
				<EllipsisVertical />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Item class="cursor-pointer" onclick={() => (showLogWorkout = true)}>
					<Dumbbell class="mr-3 h-4 w-4" />
					Log Workout
				</DropdownMenu.Item>
				<DropdownMenu.Item class="cursor-pointer" onclick={() => (showLogWeight = true)}>
					<Scale class="mr-3 h-4 w-4" />
					Log Weight
				</DropdownMenu.Item>
				<DropdownMenu.Item class="cursor-pointer" onclick={() => (showLogMeal = true)}>
					<UtensilsCrossed class="mr-3 h-4 w-4" />
					Log Meal
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="cursor-pointer" onclick={() => (showSetGoalWeight = true)}>
					<Target class="mr-3 h-4 w-4" />
					Set Goal Weight
				</DropdownMenu.Item>
				<DropdownMenu.Item class="cursor-pointer" onclick={() => (showSetCalorieTarget = true)}>
					<Settings class="mr-3 h-4 w-4" />
					Set Calorie Target
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="cursor-pointer" onclick={() => (showCreateReminder = true)}>
					<BellPlus class="mr-3 h-4 w-4" />
					Create Reminder
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>

<!-- Dialog Components -->
{#if showLogWorkout}
	<LogWorkoutDialog
		formData={workoutForm}
		bind:open={showLogWorkout}
		instanceId="header"
		onClose={() => (showLogWorkout = false)}
	/>
{/if}

{#if showLogWeight}
	<LogWeightDialog
		formData={weightForm}
		bind:open={showLogWeight}
		instanceId="header"
		onClose={() => (showLogWeight = false)}
	/>
{/if}

{#if showLogMeal}
	<LogMealDialog
		formData={mealForm}
		bind:open={showLogMeal}
		instanceId="header"
		onClose={() => (showLogMeal = false)}
	/>
{/if}

{#if showSetGoalWeight}
	<SetGoalWeightDialog
		formData={goalForm}
		bind:open={showSetGoalWeight}
		onClose={() => (showSetGoalWeight = false)}
	/>
{/if}

{#if showSetCalorieTarget}
	<SetCalorieTargetDialog
		formData={calorieForm}
		bind:open={showSetCalorieTarget}
		onClose={() => (showSetCalorieTarget = false)}
	/>
{/if}

{#if showCreateReminder}
	<CreateReminderDialog
		formData={reminderForm}
		bind:open={showCreateReminder}
		onClose={() => (showCreateReminder = false)}
	/>
{/if}

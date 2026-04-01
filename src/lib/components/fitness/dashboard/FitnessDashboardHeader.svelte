<script lang="ts">
import BellPlus from '@lucide/svelte/icons/bell-plus';
import Dumbbell from '@lucide/svelte/icons/dumbbell';
import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
import Scale from '@lucide/svelte/icons/scale';
import Settings from '@lucide/svelte/icons/settings';
import Target from '@lucide/svelte/icons/target';
import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

import CreateReminderDialog from '$lib/components/fitness/dialogs/CreateReminderDialog.svelte';
import LogMealDialog from '$lib/components/fitness/dialogs/LogMealDialog.svelte';
import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
import LogWorkoutDialog from '$lib/components/fitness/dialogs/LogWorkoutDialog.svelte';
import SetCalorieTargetDialog from '$lib/components/fitness/dialogs/SetCalorieTargetDialog.svelte';
import SetGoalWeightDialog from '$lib/components/fitness/dialogs/SetGoalWeightDialog.svelte';
import { Button } from '$lib/components/ui/button';
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
	class="mb-4 rounded-2xl bg-linear-to-br from-zinc-900 via-slate-800 to-zinc-900 p-8 text-white"
>
	<div class="flex items-start justify-between">
		<div>
			<h1 class="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
				Fitness Hub
			</h1>
			<p class="mt-2 text-sm text-zinc-400">Your momentum, trends, and habits — at a glance</p>
		</div>

		<!-- Dropdown Menu in top right -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button variant="ghost" class="text-white hover:bg-white/10">
					<EllipsisVertical class="h-5 w-5" />
				</Button>
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
		onClose={() => (showLogWorkout = false)}
	/>
{/if}

{#if showLogWeight}
	<LogWeightDialog
		formData={weightForm}
		bind:open={showLogWeight}
		onClose={() => (showLogWeight = false)}
	/>
{/if}

{#if showLogMeal}
	<LogMealDialog
		formData={mealForm}
		bind:open={showLogMeal}
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

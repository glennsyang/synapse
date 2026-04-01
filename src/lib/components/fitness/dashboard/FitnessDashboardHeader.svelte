<script lang="ts">
import type { Infer, SuperValidated } from 'sveltekit-superforms';

import CreateReminderDialog from '$lib/components/fitness/dialogs/CreateReminderDialog.svelte';
import LogMealDialog from '$lib/components/fitness/dialogs/LogMealDialog.svelte';
import LogWeightDialog from '$lib/components/fitness/dialogs/LogWeightDialog.svelte';
import LogWorkoutDialog from '$lib/components/fitness/dialogs/LogWorkoutDialog.svelte';
import SetCalorieTargetDialog from '$lib/components/fitness/dialogs/SetCalorieTargetDialog.svelte';
import SetGoalWeightDialog from '$lib/components/fitness/dialogs/SetGoalWeightDialog.svelte';
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
</script>

<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div>
		<h1 class="font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
			Recovery Journal
		</h1>
		<p class="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
			Your momentum, trends, and habits — at a glance
		</p>
	</div>

	<div
		class="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/80 p-2 dark:border-stone-800 dark:bg-stone-900/40 sm:flex-nowrap"
	>
		<LogWorkoutDialog formData={workoutForm} />
		<div class="hidden h-4 w-px bg-stone-200 dark:bg-stone-700 sm:block" aria-hidden="true"></div>
		<LogWeightDialog formData={weightForm} />
		<div class="hidden h-4 w-px bg-stone-200 dark:bg-stone-700 sm:block" aria-hidden="true"></div>
		<LogMealDialog formData={mealForm} />
		<div class="hidden h-4 w-px bg-stone-200 dark:bg-stone-700 sm:block" aria-hidden="true"></div>
		<SetGoalWeightDialog formData={goalForm} />
		<SetCalorieTargetDialog formData={calorieForm} />
		<CreateReminderDialog formData={reminderForm} />
	</div>
</div>

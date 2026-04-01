<script lang="ts">
import PlusIcon from '@lucide/svelte/icons/plus';
import { toast } from 'svelte-sonner';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import { superForm } from 'sveltekit-superforms';

import ExerciseInput from '$lib/components/fitness/ExerciseInput.svelte';
import LongTextInput from '$lib/components/shared/LongTextInput.svelte';
import { Button } from '$lib/components/ui/button';
import * as Dialog from '$lib/components/ui/dialog';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select';
import type { logWorkoutSchema, WorkoutType } from '$lib/schemas/fitness';
import type { Exercise } from '$lib/types';
import { getTodayString } from '$lib/utils/date';

type LogWorkoutData = Infer<typeof logWorkoutSchema>;

interface WorkoutExercise {
	exerciseName: string;
	sets: number | null;
	reps: number | null;
	weightLbs: number | null;
}

interface EditWorkout {
	id: string;
	date: string;
	time: string | null;
	type: string;
	durationMinutes: number | null;
	steps: number | null;
	notes: string | null;
	exercises: WorkoutExercise[];
}

let {
	formData,
	editEntry = null,
	onClose
}: {
	formData: SuperValidated<LogWorkoutData>;
	editEntry?: EditWorkout | null;
	onClose?: () => void;
} = $props();

const isEditing = $derived(editEntry !== null);

let open = $state(false);
let workoutExercises = $state<Exercise[]>([]);

// Open dialog externally when editEntry is provided
$effect(() => {
	if (editEntry) {
		open = true;
	}
});

// svelte-ignore state_referenced_locally
const { form, errors, enhance } = superForm(formData, {
	onUpdate: ({ form }) => {
		if (form.valid) {
			open = false;
			workoutExercises = [];
			toast.success(isEditing ? 'Workout updated successfully!' : 'Workout logged successfully!');
			onClose?.();
		}
	},
	onError: ({ result }) => {
		toast.error(`Error: ${result.error.message}`);
	}
});

$effect(() => {
	if (workoutExercises.length > 0) {
		$form.exercises = JSON.stringify(workoutExercises);
	}
});

// Populate form fields when editing
$effect(() => {
	if (editEntry) {
		$form.date = editEntry.date;
		$form.time = editEntry.time;
		$form.type = editEntry.type as WorkoutType;
		$form.durationMinutes = editEntry.durationMinutes;
		$form.steps = editEntry.steps;
		$form.notes = editEntry.notes;
		if (editEntry.exercises && editEntry.exercises.length > 0) {
			workoutExercises = editEntry.exercises.map((e) => ({
				exerciseName: e.exerciseName,
				sets: e.sets,
				reps: e.reps,
				weightLbs: e.weightLbs
			}));
		}
	}
});

// Default the date to today when opening for new entry
$effect(() => {
	if (open && !isEditing && !$form.date) {
		$form.date = getTodayString();
	}
});

function handleOpenChange(isOpen: boolean) {
	open = isOpen;
	if (!isOpen) {
		workoutExercises = [];
		onClose?.();
	}
}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	{#if !isEditing}
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button {...props} class="bg-green-600 text-white hover:bg-green-700">
					<PlusIcon class="mr-2 h-4 w-4" />
					Log Workout
				</Button>
			{/snippet}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Edit Workout' : 'Log Workout'}</Dialog.Title>
			<Dialog.Description>
				{isEditing ? 'Update your workout session' : 'Record your workout session'}
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action={isEditing ? '?/updateWorkout' : '?/logWorkout'} use:enhance>
			{#if isEditing && editEntry}
				<Input type="hidden" name="id" value={editEntry.id} />
			{/if}
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="workout-date">Date</Label>
						<Input id="workout-date" name="date" type="date" bind:value={$form.date} required />
						{#if $errors.date}
							<p class="text-sm text-destructive">{$errors.date}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="workout-time">Time (optional)</Label>
						<Input id="workout-time" name="time" type="time" bind:value={$form.time} />
						{#if $errors.time}
							<p class="text-sm text-destructive">{$errors.time}</p>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="workout-type">Workout Type</Label>
						<Select.Root type="single" name="type" bind:value={$form.type}>
							<Select.Trigger id="workout-type" class="w-full">
								{$form.type || 'Select workout type'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="strength" label="Strength">Strength</Select.Item>
								<Select.Item value="cardio" label="Cardio">Cardio</Select.Item>
								<Select.Item value="hiit" label="HIIT">HIIT</Select.Item>
								<Select.Item value="walk" label="Walk">Walk</Select.Item>
								<Select.Item value="stretch" label="Stretch">Stretch</Select.Item>
								<Select.Item value="other" label="Other">Other</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if $errors.type}
							<p class="text-sm text-destructive">{$errors.type}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="workout-duration">Duration (minutes)</Label>
						<Input
							id="workout-duration"
							name="durationMinutes"
							type="number"
							bind:value={$form.durationMinutes}
							placeholder="60"
						/>
						{#if $errors.durationMinutes}
							<p class="text-sm text-destructive">{$errors.durationMinutes}</p>
						{/if}
					</div>
				</div>

				{#if $form.type === 'walk'}
					<div class="grid gap-2">
						<Label for="workout-steps">Steps</Label>
						<Input
							id="workout-steps"
							name="steps"
							type="number"
							bind:value={$form.steps}
							placeholder="10000"
						/>
						{#if $errors.steps}
							<p class="text-sm text-destructive">{$errors.steps}</p>
						{/if}
					</div>
				{/if}

				{#if $form.type === 'strength'}
					<ExerciseInput bind:exercises={workoutExercises} />
					<Input type="hidden" name="exercises" value={JSON.stringify(workoutExercises)} />
					{#if $errors.exercises}
						<p class="text-sm text-destructive">{$errors.exercises}</p>
					{/if}
				{/if}

				<div class="grid gap-2">
					<Label for="workout-notes">Notes (optional)</Label>
					<LongTextInput
						id="workout-notes"
						name="notes"
						bind:value={$form.notes}
						rows={3}
						placeholder="How did the workout feel?"
					/>
					{#if $errors.notes}
						<p class="text-sm text-destructive">{$errors.notes}</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" class="bg-green-600 text-white hover:bg-green-700">
					{isEditing ? 'Update' : 'Save'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

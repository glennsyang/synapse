<script lang="ts">
	import { ArrowLeft, Trash2 } from '@lucide/svelte/icons';
	import { superForm } from 'sveltekit-superforms';

	import ExerciseInput from '$lib/components/fitness/ExerciseInput.svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import LongTextInput from '$lib/components/shared/LongTextInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { Exercise } from '$lib/types';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(data.form, {
		dataType: 'form'
	});

	const initialExercises = (() => {
		if (!$form.exercises) {
			return [] as Exercise[];
		}

		try {
			const parsed = JSON.parse($form.exercises);
			if (!Array.isArray(parsed)) {
				return [] as Exercise[];
			}

			return parsed as Exercise[];
		} catch {
			return [] as Exercise[];
		}
	})();

	let workoutExercises = $state<Exercise[]>(initialExercises);
	let showDeleteDialog = $state(false);

	$effect(() => {
		if ($form.type === 'strength') {
			$form.exercises = JSON.stringify(workoutExercises);
		} else {
			$form.exercises = null;
		}
	});
</script>

<div class="container mx-auto max-w-3xl py-8">
	<div class="mb-6">
		<Button variant="ghost" href="/fitness?tab=workouts" class="mb-4">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Fitness
		</Button>
		<div class="flex items-start justify-between">
			<div>
				<h1 class="font-display text-3xl font-bold">Edit Workout</h1>
				<p class="text-muted-foreground">Update workout details and exercises</p>
			</div>
			<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
				<Trash2 class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<Card.Root>
		<Card.Header> <Card.Title>Workout Details</Card.Title> </Card.Header>
		<Card.Content>
			<form method="POST" action="?/update" use:enhance class="space-y-4">
				<Input type="hidden" name="id" bind:value={$form.id} />
				<Input type="hidden" name="exercises" value={$form.exercises || ''} />

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

				<div class="grid gap-2">
					<Label for="workout-type">Workout Type</Label>
					<Select.Root type="single" name="type" bind:value={$form.type}>
						<Select.Trigger id="workout-type">{$form.type || 'Select workout type'}</Select.Trigger>
						<Select.Content>
							<Select.Item value="strength" label="Strength">Strength</Select.Item>
							<Select.Item value="cardio" label="Cardio">Cardio</Select.Item>
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

				{#if $form.type === 'strength'}
					<ExerciseInput bind:exercises={workoutExercises} />
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

				<div class="flex gap-4">
					<Button type="submit" disabled={$submitting}
						>{$submitting ? 'Saving...' : 'Update Workout'}</Button
					>
					<Button type="button" variant="outline" href="/fitness?tab=workouts">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

<ConfirmDialog
	bind:open={showDeleteDialog}
	title="Delete Workout"
	message="Are you sure you want to delete this workout? This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/delete"
	id={data.workout.id}
/>

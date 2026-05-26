<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { Exercise } from '$lib/types';
	import { Plus, Trash2 } from '@lucide/svelte';

	let { exercises = $bindable([]) }: { exercises: Exercise[] } = $props();

	function addExercise() {
		exercises = [...exercises, { exerciseName: '', sets: null, reps: null, weightLbs: null }];
	}

	function removeExercise(index: number) {
		exercises = exercises.filter((_, i) => i !== index);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<Label>Exercises</Label>
		<Button type="button" variant="outline" size="sm" onclick={addExercise}>
			<Plus class="mr-2 h-4 w-4" />
			Add Exercise
		</Button>
	</div>

	{#if exercises.length === 0}
		<p class="text-muted-foreground py-4 text-center text-sm">
			No exercises added yet. Click "Add Exercise" to start.
		</p>
	{:else}
		<div class="space-y-4">
			{#each exercises as exercise, index (exercise.exerciseName + index)}
				<div class="grid gap-3 rounded-lg border p-4">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-medium">Exercise {index + 1}</Label>
						<Button type="button" variant="ghost" size="sm" onclick={() => removeExercise(index)}>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="grid gap-3">
						<div>
							<Label for={`exercise-name-${index}`} class="text-xs">Exercise Name</Label>
							<Input
								id={`exercise-name-${index}`}
								type="text"
								bind:value={exercise.exerciseName}
								placeholder="e.g., Bench Press"
								required
							/>
						</div>

						<div class="grid grid-cols-3 gap-2">
							<div>
								<Label for={`sets-${index}`} class="text-xs">Sets</Label>
								<Input
									id={`sets-${index}`}
									type="number"
									bind:value={exercise.sets}
									placeholder="3"
									min="1"
								/>
							</div>
							<div>
								<Label for={`reps-${index}`} class="text-xs">Reps</Label>
								<Input
									id={`reps-${index}`}
									type="number"
									bind:value={exercise.reps}
									placeholder="10"
									min="1"
								/>
							</div>
							<div>
								<Label for={`weight-${index}`} class="text-xs">Weight (lbs)</Label>
								<Input
									id={`weight-${index}`}
									type="number"
									bind:value={exercise.weightLbs}
									placeholder="135"
									min="0"
								/>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

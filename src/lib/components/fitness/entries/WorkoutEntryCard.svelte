<script lang="ts">
import { ChevronDown, ChevronRight, Pencil, Trash2 } from '@lucide/svelte/icons';

import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Tooltip from '$lib/components/ui/tooltip';
import { formatDateMedium, formatTime12Hour } from '$lib/utils/date';
import { getWorkoutBadgeClass, getWorkoutBorderClass, getWorkoutLabel } from '$lib/utils/workout';

interface Exercise {
	exerciseName: string;
	sets: number | null;
	reps: number | null;
	weightLbs: number | null;
}

interface Workout {
	id: string;
	date: string;
	time: string | null;
	type: string;
	durationMinutes: number | null;
	steps: number | null;
	notes: string | null;
	exercises: Exercise[];
}

let {
	workout,
	onEdit,
	onDelete
}: {
	workout: Workout;
	onEdit: (workout: Workout) => void;
	onDelete: (id: string) => void;
} = $props();

let expanded = $state(false);
</script>

<div
	class="rounded-lg border border-l-4 bg-card p-3 transition-colors hover:bg-accent/30 {getWorkoutBorderClass(workout.type)}"
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1 space-y-1">
			<div class="flex flex-wrap items-center gap-2">
				<Badge class={getWorkoutBadgeClass(workout.type)}>{getWorkoutLabel(workout.type)}</Badge>
				{#if workout.type === 'walk' && workout.steps}
					<span class="text-xs text-muted-foreground">{workout.steps.toLocaleString()} steps</span>
				{:else if workout.durationMinutes}
					<span class="text-xs text-muted-foreground">{workout.durationMinutes} min</span>
				{/if}
			</div>
			<p class="text-xs text-muted-foreground">
				{formatDateMedium(workout.date)}
				{#if workout.time}
					@ {formatTime12Hour(workout.time)}
				{/if}
			</p>
			{#if workout.notes}
				<p class="truncate text-xs text-muted-foreground">{workout.notes}</p>
			{/if}

			{#if workout.exercises && workout.exercises.length > 0}
				<button
					type="button"
					class="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
					onclick={() => (expanded = !expanded)}
				>
					{#if expanded}
						<ChevronDown class="h-3 w-3" />
					{:else}
						<ChevronRight class="h-3 w-3" />
					{/if}
					{workout.exercises.length}
					{workout.exercises.length === 1 ? 'exercise' : 'exercises'}
				</button>

				{#if expanded}
					<div class="mt-2 space-y-1 transition-all">
						{#each workout.exercises as exercise (exercise.exerciseName)}
							<div class="ml-4 text-xs text-muted-foreground">
								• {exercise.exerciseName}
								{#if exercise.sets || exercise.reps || exercise.weightLbs}
									<span class="ml-1">
										{#if exercise.sets}
											{exercise.sets}s
										{/if}
										{#if exercise.reps}
											× {exercise.reps}r
										{/if}
										{#if exercise.weightLbs}
											@ {exercise.weightLbs}lb
										{/if}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>

		<div class="flex shrink-0 items-center gap-1">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							type="button"
							variant="ghost"
							size="icon"
							class="h-7 w-7"
							onclick={() => onEdit(workout)}
							aria-label="Edit workout"
						>
							<Pencil class="h-3.5 w-3.5" />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Edit</Tooltip.Content>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							type="button"
							variant="ghost"
							size="icon"
							class="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onclick={() => onDelete(workout.id)}
							aria-label="Delete workout"
						>
							<Trash2 class="h-3.5 w-3.5" />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Delete</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
</div>

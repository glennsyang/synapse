<script lang="ts">
import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
import EditIcon from '@lucide/svelte/icons/edit';
import Trash2Icon from '@lucide/svelte/icons/trash-2';

import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Tooltip from '$lib/components/ui/tooltip';
import { formatDateMedium, formatTime12Hour } from '$lib/utils/date';

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

const typeStyles: Record<string, { border: string; badge: string }> = {
	strength: {
		border: 'border-l-orange-500',
		badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
	},
	cardio: {
		border: 'border-l-blue-500',
		badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
	},
	yoga: {
		border: 'border-l-purple-500',
		badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
	},
	other: {
		border: 'border-l-gray-400',
		badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
	}
};

const style = $derived(typeStyles[workout.type] ?? typeStyles.other);
</script>

<div
	class="rounded-lg border border-l-4 bg-card p-3 transition-colors hover:bg-accent/30 {style.border}"
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1 space-y-1">
			<div class="flex flex-wrap items-center gap-2">
				<Badge class={style.badge}>{workout.type}</Badge>
				{#if workout.durationMinutes}
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
						<ChevronDownIcon class="h-3 w-3" />
					{:else}
						<ChevronRightIcon class="h-3 w-3" />
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
							<EditIcon class="h-3.5 w-3.5" />
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
							<Trash2Icon class="h-3.5 w-3.5" />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Delete</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
</div>

<script lang="ts">
import {
	ChevronRight,
	Dumbbell,
	Pencil,
	Scale,
	Trash2,
	UtensilsCrossed
} from '@lucide/svelte/icons';

import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import * as Tooltip from '$lib/components/ui/tooltip';
import { formatDateShort, formatTime12Hour } from '$lib/utils/date';

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

interface WeightEntry {
	id: string;
	date: string;
	time: string | null;
	weightLbs: number;
	createdAt: string;
}

interface Meal {
	id: string;
	date: string;
	timeOfDay: string;
	description: string;
	caloriesEstimate: number | null;
}

type ActivityItem =
	| { kind: 'workout'; data: Workout; sortKey: string }
	| { kind: 'weight'; data: WeightEntry; sortKey: string }
	| { kind: 'meal'; data: Meal; sortKey: string };

interface Props {
	workouts: Workout[];
	weightEntries: WeightEntry[];
	meals: Meal[];
	onEditWorkout: (w: Workout) => void;
	onDeleteWorkout: (id: string) => void;
	onEditWeight: (e: { id: string; date: string; time: string | null; weightLbs: number }) => void;
	onDeleteWeight: (id: string) => void;
	onEditMeal: (m: {
		id: string;
		date: string;
		timeOfDay: string;
		description: string;
		caloriesEstimate: number | null;
	}) => void;
	onDeleteMeal: (id: string) => void;
	onViewAll: () => void;
}

let {
	workouts,
	weightEntries,
	meals,
	onEditWorkout,
	onDeleteWorkout,
	onEditWeight,
	onDeleteWeight,
	onEditMeal,
	onDeleteMeal,
	onViewAll
}: Props = $props();

// Build merged chronological feed
const feed = $derived.by((): ActivityItem[] => {
	const items: ActivityItem[] = [
		...workouts.map((w) => ({
			kind: 'workout' as const,
			data: w,
			sortKey: `${w.date}T${w.time ?? '23:59:59'}`
		})),
		...weightEntries.map((e) => ({
			kind: 'weight' as const,
			data: e,
			sortKey: `${e.date}T${e.time ?? '12:00:00'}`
		})),
		...meals.map((m) => ({
			kind: 'meal' as const,
			data: m,
			sortKey: `${m.date}T00:00:00`
		}))
	];

	return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 7);
});

const typeStyles: Record<string, { border: string; badge: string }> = {
	strength: {
		border: 'border-l-orange-400',
		badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
	},
	cardio: {
		border: 'border-l-sky-400',
		badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
	},
	yoga: {
		border: 'border-l-violet-400',
		badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
	},
	other: {
		border: 'border-l-zinc-400',
		badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300'
	}
};
</script>

<section class="mb-2">
	<div class="mb-4 flex items-center justify-between">
		<div class="border-l-4 border-zinc-400 pl-3"></div>
		<Button
			variant="ghost"
			size="sm"
			onclick={onViewAll}
			class="gap-1 text-zinc-600 dark:text-zinc-400"
		>
			View all
			<ChevronRight class="h-4 w-4" />
		</Button>
	</div>

	{#if feed.length === 0}
		<Card.Root class="border-0 bg-white shadow-sm dark:bg-zinc-900">
			<Card.Content class="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
				No activity logged yet — start tracking to see your history here
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="overflow-hidden border-0 bg-white shadow-sm dark:bg-zinc-900">
			<Card.Content class="p-0">
				<ul class="divide-y divide-zinc-100 dark:divide-zinc-800">
					{#each feed as item (item.kind + item.data.id)}
						{#if item.kind === 'workout'}
							{@const style = typeStyles[item.data.type] ?? typeStyles.other}
							<li
								class="group flex items-center gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 {style.border}"
							>
								<Dumbbell class="h-4 w-4 shrink-0 text-zinc-400" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<Badge class="text-xs {style.badge}">{item.data.type}</Badge>
										{#if item.data.durationMinutes}
											<span class="text-xs text-zinc-500">{item.data.durationMinutes} min</span>
										{/if}
									</div>
									<p class="mt-0.5 text-xs text-zinc-500">
										{formatDateShort(item.data.date)}
										{#if item.data.time}
											· {formatTime12Hour(item.data.time)}
										{/if}
										{#if item.data.exercises?.length}
											· {item.data.exercises.length} exercises
										{/if}
									</p>
								</div>
								<div
									class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
								>
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													type="button"
													variant="ghost"
													size="icon"
													class="h-7 w-7"
													onclick={() => onEditWorkout(item.data)}
												>
													<Pencil class="h-3.5 w-3.5" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Edit workout entry</Tooltip.Content>
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
													onclick={() => onDeleteWorkout(item.data.id)}
												>
													<Trash2 class="h-3.5 w-3.5" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Delete workout entry</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</li>
						{:else if item.kind === 'weight'}
							<li
								class="group flex items-center gap-3 border-l-4 border-l-emerald-400 px-4 py-3 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
							>
								<Scale class="h-4 w-4 shrink-0 text-zinc-400" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100"
										>
											{item.data.weightLbs}
											lbs
										</span>
									</div>
									<p class="mt-0.5 text-xs text-zinc-500">
										{formatDateShort(item.data.date)}
										{#if item.data.time}
											· {formatTime12Hour(item.data.time)}
										{/if}
									</p>
								</div>
								<div
									class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
								>
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													type="button"
													variant="ghost"
													size="icon"
													class="h-7 w-7"
													onclick={() => onEditWeight(item.data)}
												>
													<Pencil class="h-3.5 w-3.5" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Edit weight entry</Tooltip.Content>
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
													onclick={() => onDeleteWeight(item.data.id)}
												>
													<Trash2 class="h-3.5 w-3.5" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Delete weight entry</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</li>
						{:else if item.kind === 'meal'}
							<li
								class="group flex items-center gap-3 border-l-4 border-l-amber-400 px-4 py-3 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
							>
								<UtensilsCrossed class="h-4 w-4 shrink-0 text-zinc-400" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm text-zinc-800 dark:text-zinc-200">
										{item.data.description}
									</p>
									<p class="mt-0.5 text-xs text-zinc-500 capitalize">
										{item.data.timeOfDay}
										· {formatDateShort(item.data.date)}
										{#if item.data.caloriesEstimate}
											· {item.data.caloriesEstimate} cal
										{/if}
									</p>
								</div>
								<div
									class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
								>
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													type="button"
													variant="ghost"
													size="icon"
													class="h-7 w-7"
													onclick={() => onEditMeal(item.data)}
												>
													<Pencil class="h-3.5 w-3.5" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Edit meal entry</Tooltip.Content>
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
													onclick={() => onDeleteMeal(item.data.id)}
												>
													<Trash2 class="h-3.5 w-3.5" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Delete meal entry</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</li>
						{/if}
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</section>

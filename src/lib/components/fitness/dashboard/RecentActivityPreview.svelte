<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Workout } from '$lib/types';
	import { formatDateShort, formatTime12Hour } from '$lib/utils/date';
	import { getWorkoutBadgeClass, getWorkoutLabel } from '$lib/utils/workout';
	import {
		ChevronRight,
		Dumbbell,
		Pencil,
		Scale,
		Trash2,
		UtensilsCrossed
	} from '@lucide/svelte/icons';

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
</script>

<section class="mb-2">
	<div class="mb-4 flex items-center justify-between">
		<Button
			variant="ghost"
			size="sm"
			onclick={onViewAll}
			class="text-muted-foreground dark:text-muted-foreground gap-1"
		>
			View all
			<ChevronRight class="h-4 w-4" />
		</Button>
	</div>

	{#if feed.length === 0}
		<Card.Root class="bg-card dark:bg-muted border-0">
			<Card.Content
				class="text-muted-foreground dark:text-muted-foreground py-8 text-center text-sm"
			>
				No activity logged yet — start tracking to see your history here
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="bg-card dark:bg-muted overflow-hidden border-0">
			<Card.Content class="p-0">
				<ul class="divide-border dark:divide-border divide-y">
					{#each feed as item (item.kind + item.data.id)}
						{#if item.kind === 'workout'}
							<li
								class="group hover:bg-muted/80 dark:hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors"
							>
								<Dumbbell class="text-muted-foreground h-4 w-4 shrink-0" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<Badge class="text-xs {getWorkoutBadgeClass(item.data.type)}"
											>{getWorkoutLabel(item.data.type)}</Badge
										>
										{#if item.data.durationMinutes}
											<span class="text-muted-foreground text-xs"
												>{item.data.durationMinutes} min</span
											>
										{/if}
									</div>
									<p class="text-muted-foreground mt-0.5 text-xs">
										{formatDateShort(item.data.date)}
										{#if item.data.time}
											· {formatTime12Hour(item.data.time)}
										{/if}
										{#if item.data.exercises?.length}
											· {item.data.exercises.length} exercises
										{/if}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-0.5">
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
													class="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
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
								class="group hover:bg-muted/80 dark:hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors"
							>
								<Scale class="text-muted-foreground h-4 w-4 shrink-0" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="font-display text-foreground dark:text-foreground text-sm font-semibold"
										>
											{item.data.weightLbs}
											lbs
										</span>
									</div>
									<p class="text-muted-foreground mt-0.5 text-xs">
										{formatDateShort(item.data.date)}
										{#if item.data.time}
											· {formatTime12Hour(item.data.time)}
										{/if}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-0.5">
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
													class="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
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
								class="group hover:bg-muted/80 dark:hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors"
							>
								<UtensilsCrossed class="text-muted-foreground h-4 w-4 shrink-0" />
								<div class="min-w-0 flex-1">
									<p class="text-foreground dark:text-foreground truncate text-sm">
										{item.data.description}
									</p>
									<p class="text-muted-foreground mt-0.5 text-xs capitalize">
										{item.data.timeOfDay}
										· {formatDateShort(item.data.date)}
										{#if item.data.caloriesEstimate}
											· {item.data.caloriesEstimate} cal
										{/if}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-0.5">
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
													class="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
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

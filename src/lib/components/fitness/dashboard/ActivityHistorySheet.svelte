<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Workout } from '$lib/types';
	import { formatDateMedium, formatTime12Hour } from '$lib/utils/date';
	import { getWorkoutBadgeClass, getWorkoutLabel } from '$lib/utils/workout';
	import { Dumbbell, Pencil, Scale, Trash2, UtensilsCrossed } from '@lucide/svelte/icons';

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

	type FilterKind = 'all' | 'workouts' | 'weight' | 'meals';

	type ActivityItem =
		| { kind: 'workout'; data: Workout; sortKey: string }
		| { kind: 'weight'; data: WeightEntry; sortKey: string }
		| { kind: 'meal'; data: Meal; sortKey: string };

	interface Props {
		open: boolean;
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
	}

	let {
		open = $bindable(false),
		workouts,
		weightEntries,
		meals,
		onEditWorkout,
		onDeleteWorkout,
		onEditWeight,
		onDeleteWeight,
		onEditMeal,
		onDeleteMeal
	}: Props = $props();

	let filter = $state<FilterKind>('all');

	const allItems = $derived.by((): ActivityItem[] => {
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
		return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
	});

	const filtered = $derived(
		filter === 'all'
			? allItems
			: allItems.filter((item) => {
					if (filter === 'workouts') return item.kind === 'workout';
					if (filter === 'weight') return item.kind === 'weight';
					if (filter === 'meals') return item.kind === 'meal';
					return true;
				})
	);

	// Group by date
	const grouped = $derived.by(() => {
		const groups: { date: string; label: string; items: ActivityItem[] }[] = [];
		let current: (typeof groups)[0] | null = null;

		for (const item of filtered) {
			const date = item.sortKey.slice(0, 10);
			if (!current || current.date !== date) {
				current = {
					date,
					label: formatDateMedium(date),
					items: []
				};
				groups.push(current);
			}
			current.items.push(item);
		}
		return groups;
	});

	const filters: { value: FilterKind; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'workouts', label: 'Workouts' },
		{ value: 'weight', label: 'Weight' },
		{ value: 'meals', label: 'Meals' }
	];
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full overflow-y-auto sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title class="font-display text-foreground dark:text-foreground">
				Activity History
			</Sheet.Title>
			<Sheet.Description class="text-muted-foreground dark:text-muted-foreground">
				All logged workouts, weight entries, and meals
			</Sheet.Description>
		</Sheet.Header>

		<!-- Filter tabs -->
		<div class="bg-muted dark:bg-muted mx-2 flex gap-1 rounded-xl p-1">
			{#each filters as f (f.value)}
				<button
					type="button"
					class="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all {filter ===
					f.value
						? 'bg-card text-foreground dark:bg-muted dark:text-foreground'
						: 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'}"
					onclick={() => (filter = f.value)}
				>
					{f.label}
				</button>
			{/each}
		</div>

		<!-- Grouped history -->
		<div class="mx-4 space-y-6">
			{#if grouped.length === 0}
				<p class="text-muted-foreground dark:text-muted-foreground py-8 text-center text-sm">
					No entries found
				</p>
			{/if}

			{#each grouped as group (group.date)}
				<div>
					<h3
						class="text-muted-foreground dark:text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase"
					>
						{group.label}
					</h3>
					<ul class="space-y-1.5">
						{#each group.items as item (item.kind + item.data.id)}
							{#if item.kind === 'workout'}
								<li
									class="border-border bg-card dark:border-border dark:bg-muted flex items-center gap-3 rounded-xl border px-3 py-2.5"
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
										{#if item.data.time}
											<p class="text-muted-foreground mt-0.5 text-xs">
												{formatTime12Hour(item.data.time)}
											</p>
										{/if}
										{#if item.data.exercises?.length}
											<p class="text-muted-foreground mt-0.5 text-xs">
												{item.data.exercises.length}
												exercises
											</p>
										{/if}
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
														onclick={() => {
															onEditWorkout(item.data);
															open = false;
														}}
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
														onclick={() => {
															onDeleteWorkout(item.data.id);
															open = false;
														}}
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
									class="border-border bg-card dark:border-border dark:bg-muted flex items-center gap-3 rounded-xl border px-3 py-2.5"
								>
									<Scale class="text-pen-fitness h-4 w-4 shrink-0" />
									<div class="min-w-0 flex-1">
										<span
											class="font-display text-foreground dark:text-foreground text-sm font-semibold"
										>
											{item.data.weightLbs}
											lbs
										</span>
										{#if item.data.time}
											<p class="text-muted-foreground text-xs">
												{formatTime12Hour(item.data.time)}
											</p>
										{/if}
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
														onclick={() => {
															onEditWeight(item.data);
															open = false;
														}}
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
														onclick={() => {
															onDeleteWeight(item.data.id);
															open = false;
														}}
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
									class="border-border bg-card dark:border-border dark:bg-muted flex items-center gap-3 rounded-xl border px-3 py-2.5"
								>
									<UtensilsCrossed class="text-pen-warn h-4 w-4 shrink-0" />
									<div class="min-w-0 flex-1">
										<p class="text-foreground dark:text-foreground truncate text-sm">
											{item.data.description}
										</p>
										<p class="text-muted-foreground mt-0.5 text-xs capitalize">
											{item.data.timeOfDay}
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
														onclick={() => {
															onEditMeal(item.data);
															open = false;
														}}
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
														onclick={() => {
															onDeleteMeal(item.data.id);
															open = false;
														}}
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
				</div>
			{/each}
		</div>
	</Sheet.Content>
</Sheet.Root>

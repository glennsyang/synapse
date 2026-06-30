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
			<Sheet.Title class="font-display text-zinc-900 dark:text-zinc-100">
				Activity History
			</Sheet.Title>
			<Sheet.Description class="text-zinc-500 dark:text-zinc-400">
				All logged workouts, weight entries, and meals
			</Sheet.Description>
		</Sheet.Header>

		<!-- Filter tabs -->
		<div class="mx-2 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
			{#each filters as f (f.value)}
				<button
					type="button"
					class="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all {filter ===
					f.value
						? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
						: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}"
					onclick={() => (filter = f.value)}
				>
					{f.label}
				</button>
			{/each}
		</div>

		<!-- Grouped history -->
		<div class="mx-4 space-y-6">
			{#if grouped.length === 0}
				<p class="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No entries found</p>
			{/if}

			{#each grouped as group (group.date)}
				<div>
					<h3
						class="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
					>
						{group.label}
					</h3>
					<ul class="space-y-1.5">
						{#each group.items as item (item.kind + item.data.id)}
							{#if item.kind === 'workout'}
								<li
									class="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
								>
									<Dumbbell class="h-4 w-4 shrink-0 text-zinc-400" />
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<Badge class="text-xs {getWorkoutBadgeClass(item.data.type)}"
												>{getWorkoutLabel(item.data.type)}</Badge
											>
											{#if item.data.durationMinutes}
												<span class="text-xs text-zinc-500">{item.data.durationMinutes} min</span>
											{/if}
										</div>
										{#if item.data.time}
											<p class="mt-0.5 text-xs text-zinc-400">{formatTime12Hour(item.data.time)}</p>
										{/if}
										{#if item.data.exercises?.length}
											<p class="mt-0.5 text-xs text-zinc-400">
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
									class="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
								>
									<Scale class="h-4 w-4 shrink-0 text-emerald-500" />
									<div class="min-w-0 flex-1">
										<span
											class="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100"
										>
											{item.data.weightLbs}
											lbs
										</span>
										{#if item.data.time}
											<p class="text-xs text-zinc-400">{formatTime12Hour(item.data.time)}</p>
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
									class="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
								>
									<UtensilsCrossed class="h-4 w-4 shrink-0 text-amber-500" />
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm text-zinc-800 dark:text-zinc-200">
											{item.data.description}
										</p>
										<p class="mt-0.5 text-xs text-zinc-400 capitalize">
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

<script lang="ts">
import { Pencil, Trash2 } from '@lucide/svelte/icons';

import { Button } from '$lib/components/ui/button';
import * as Tooltip from '$lib/components/ui/tooltip';
import { formatDateShort } from '$lib/utils/date';

interface Meal {
	id: string;
	date: string;
	timeOfDay: string;
	description: string;
	caloriesEstimate: number | null;
}

let {
	meal,
	onEdit,
	onDelete
}: {
	meal: Meal;
	onEdit: (meal: Meal) => void;
	onDelete: (id: string) => void;
} = $props();

const mealIcons: Record<string, string> = {
	breakfast: '🌅',
	lunch: '☀️',
	dinner: '🌙',
	snack: '🍪'
};

const mealBadgeStyles: Record<string, string> = {
	breakfast: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
	lunch: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
	dinner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
	snack: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
};

const icon = $derived(mealIcons[meal.timeOfDay] ?? '🍽️');
const badgeStyle = $derived(mealBadgeStyles[meal.timeOfDay] ?? '');
</script>

<div class="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
	<div class="flex min-w-0 flex-1 items-start gap-3">
		<span
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm {badgeStyle}"
			aria-hidden="true"
		>
			{icon}
		</span>
		<div class="min-w-0 flex-1">
			<p class="line-clamp-2 text-sm">{meal.description}</p>
			<p class="mt-0.5 text-xs text-muted-foreground capitalize">
				{meal.timeOfDay}
				· {formatDateShort(meal.date)}
			</p>
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-2">
		{#if meal.caloriesEstimate}
			<div class="text-right">
				<p class="font-display text-base font-bold text-green-600 dark:text-green-400">
					{meal.caloriesEstimate}
				</p>
				<p class="text-xs text-muted-foreground">cal</p>
			</div>
		{/if}

		<div class="flex items-center gap-1">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							type="button"
							variant="ghost"
							size="icon"
							class="h-7 w-7"
							onclick={() => onEdit(meal)}
							aria-label="Edit meal"
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
							onclick={() => onDelete(meal.id)}
							aria-label="Delete meal"
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

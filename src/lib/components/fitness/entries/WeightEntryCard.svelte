<script lang="ts">
import EditIcon from '@lucide/svelte/icons/edit';
import MinusIcon from '@lucide/svelte/icons/minus';
import Trash2Icon from '@lucide/svelte/icons/trash-2';
import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

import { Button } from '$lib/components/ui/button';
import * as Tooltip from '$lib/components/ui/tooltip';
import { formatDateShort, formatTime12Hour } from '$lib/utils/date';

interface WeightEntry {
	id: string;
	date: string;
	time: string | null;
	weightLbs: number;
}

let {
	entry,
	previousEntry = null,
	onEdit,
	onDelete
}: {
	entry: WeightEntry;
	previousEntry?: WeightEntry | null;
	onEdit: (entry: WeightEntry) => void;
	onDelete: (id: string) => void;
} = $props();

const delta = $derived(previousEntry != null ? entry.weightLbs - previousEntry.weightLbs : null);
</script>

<div
	class="flex items-center justify-between rounded-lg border bg-green-50/30 p-3 dark:bg-green-950/20"
>
	<div class="flex items-center gap-4">
		<div>
			<p class="font-display text-xl font-bold">{entry.weightLbs} lbs</p>
			<p class="text-xs text-muted-foreground">
				{formatDateShort(entry.date)}
				{#if entry.time}
					@ {formatTime12Hour(entry.time)}
				{/if}
			</p>
		</div>

		{#if delta !== null}
			<div class="flex items-center gap-1">
				{#if delta < 0}
					<TrendingDownIcon class="h-4 w-4 text-green-600" />
					<span class="text-xs font-medium text-green-600">{Math.abs(delta).toFixed(1)} lbs</span>
				{:else if delta > 0}
					<TrendingUpIcon class="h-4 w-4 text-destructive" />
					<span class="text-xs font-medium text-destructive">+{delta.toFixed(1)} lbs</span>
				{:else}
					<MinusIcon class="h-4 w-4 text-muted-foreground" />
				{/if}
			</div>
		{/if}
	</div>

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
						onclick={() => onEdit(entry)}
						aria-label="Edit weight entry"
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
						onclick={() => onDelete(entry.id)}
						aria-label="Delete weight entry"
					>
						<Trash2Icon class="h-3.5 w-3.5" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Delete</Tooltip.Content>
		</Tooltip.Root>
	</div>
</div>

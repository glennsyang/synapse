<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { daysOfWeek, formatTime12Hour } from '$lib/utils/date';
	import { getWorkoutBadgeClass, getWorkoutLabel } from '$lib/utils/workout';
	import { Bell, BellOff, Trash2 } from '@lucide/svelte/icons';

	interface Reminder {
		id: string;
		workoutType: string;
		cadence: string;
		time: string;
		daysOfWeek: string | null;
		enabled: boolean;
	}

	let {
		reminder,
		onToggle,
		onDelete
	}: {
		reminder: Reminder;
		onToggle: (reminder: Reminder) => void;
		onDelete: (id: string) => void;
	} = $props();

	const scheduleText = $derived(
		reminder.cadence === 'daily'
			? 'Every day'
			: `Weekly on ${
					reminder.daysOfWeek
						? JSON.parse(reminder.daysOfWeek)
								.map((d: number) => daysOfWeek[d].shortName)
								.join(', ')
						: 'Not configured'
				}`
	);
</script>

<div
	class="flex items-center justify-between rounded-lg border p-3 transition-colors"
	class:opacity-60={!reminder.enabled}
>
	<div class="flex items-center gap-3">
		<Badge class={getWorkoutBadgeClass(reminder.workoutType)}
			>{getWorkoutLabel(reminder.workoutType)}</Badge
		>
		<div>
			<p class="text-sm font-medium">{formatTime12Hour(reminder.time)}</p>
			<p class="text-muted-foreground text-xs">
				{scheduleText}
				{#if !reminder.enabled}
					<span class="text-muted-foreground ml-1">(Disabled)</span>
				{/if}
			</p>
		</div>
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
						onclick={() => onToggle({ ...reminder, enabled: !reminder.enabled })}
						aria-label={reminder.enabled ? 'Disable reminder' : 'Enable reminder'}
					>
						{#if reminder.enabled}
							<BellOff class="h-3.5 w-3.5" />
						{:else}
							<Bell class="h-3.5 w-3.5" />
						{/if}
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{reminder.enabled ? 'Disable' : 'Enable'}</Tooltip.Content>
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
						onclick={() => onDelete(reminder.id)}
						aria-label="Delete reminder"
					>
						<Trash2 class="h-3.5 w-3.5" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Delete</Tooltip.Content>
		</Tooltip.Root>
	</div>
</div>

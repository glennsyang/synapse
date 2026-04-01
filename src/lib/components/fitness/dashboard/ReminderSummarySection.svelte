<script lang="ts">
import { Bell, BellOff } from '@lucide/svelte/icons';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

import CreateReminderDialog from '$lib/components/fitness/dialogs/CreateReminderDialog.svelte';
import ReminderCard from '$lib/components/fitness/entries/ReminderCard.svelte';
import * as Card from '$lib/components/ui/card';
import type { workoutReminderSchema } from '$lib/schemas/fitness';

interface Reminder {
	id: string;
	workoutType: string;
	cadence: string;
	time: string;
	daysOfWeek: string | null;
	enabled: boolean;
}

interface Props {
	reminders: Reminder[];
	reminderForm: SuperValidated<Infer<typeof workoutReminderSchema>>;
	onToggle: (reminder: Reminder) => void;
	onDelete: (id: string) => void;
}

let { reminders, reminderForm, onToggle, onDelete }: Props = $props();

const activeCount = $derived(reminders.filter((r) => r.enabled).length);
const disabledCount = $derived(reminders.filter((r) => !r.enabled).length);
</script>

<section class="mb-8 space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
				Habits & Reminders
			</h2>
			<p class="text-sm text-stone-500 dark:text-stone-400">
				Scheduled reminders to keep you consistent
			</p>
		</div>
		<CreateReminderDialog formData={reminderForm} />
	</div>

	{#if reminders.length === 0}
		<Card.Root
			class="border-dashed border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-900/40"
		>
			<Card.Content class="flex flex-col items-center gap-2 py-8 text-center">
				<BellOff class="h-8 w-8 text-stone-400" />
				<p class="text-sm font-medium text-stone-600 dark:text-stone-400">No reminders set</p>
				<p class="text-xs text-stone-500 dark:text-stone-500">
					Create a reminder to get email nudges on your schedule
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900/40">
			<Card.Header class="pb-2">
				<div class="flex items-center justify-between">
					<Card.Title class="text-sm font-medium text-stone-700 dark:text-stone-300">
						Active Reminders
					</Card.Title>
					<div class="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
						{#if activeCount > 0}
							<span class="flex items-center gap-1">
								<Bell class="h-3 w-3 text-emerald-500" />
								{activeCount}
								active
							</span>
						{/if}
						{#if disabledCount > 0}
							<span class="flex items-center gap-1">
								<BellOff class="h-3 w-3" />
								{disabledCount}
								paused
							</span>
						{/if}
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each reminders as reminder (reminder.id)}
					<ReminderCard {reminder} {onToggle} {onDelete} />
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</section>

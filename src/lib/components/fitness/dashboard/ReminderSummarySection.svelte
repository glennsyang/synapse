<script lang="ts">
	import CreateReminderDialog from '$lib/components/fitness/dialogs/CreateReminderDialog.svelte';
	import ReminderCard from '$lib/components/fitness/entries/ReminderCard.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { workoutReminderSchema } from '$lib/schemas/fitness';
	import { Bell, BellOff } from '@lucide/svelte/icons';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

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

<section class="mb-2 space-y-4">
	<div class="flex items-center justify-between">
		<CreateReminderDialog formData={reminderForm} />
	</div>

	{#if reminders.length === 0}
		<Card.Root class="border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
			<Card.Content class="flex flex-col items-center gap-2 py-8 text-center">
				<BellOff class="h-8 w-8 text-zinc-400" />
				<p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">No reminders set</p>
				<p class="text-xs text-zinc-500">Create a reminder to get email nudges on your schedule</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="border-0 bg-white shadow-sm dark:bg-zinc-900 dark:shadow-zinc-800/50">
			<Card.Header class="pb-2">
				<div class="flex items-center justify-between">
					<Card.Title class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Active Reminders
					</Card.Title>
					<div class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
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

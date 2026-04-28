<script lang="ts">
	import BellPlusIcon from '@lucide/svelte/icons/bell-plus';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { workoutReminderSchema } from '$lib/schemas/fitness';
	import { daysOfWeek } from '$lib/utils/date';
	import { workoutTypeOptions } from '$lib/utils/workout';

	type WorkoutReminderData = Infer<typeof workoutReminderSchema>;

	let {
		formData,
		onClose,
		open = $bindable(false)
	}: {
		formData: SuperValidated<WorkoutReminderData>;
		onClose?: () => void;
		open?: boolean;
	} = $props();

	let internalOpen = $state(false);
	const dialogOpen = $derived(open !== undefined ? open : internalOpen);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance } = superForm(formData, {
		id: 'create-reminder',
		resetForm: true,
		onUpdate: ({ form }) => {
			if (form.valid) {
				if (open !== undefined) {
					onClose?.();
				} else {
					internalOpen = false;
				}
				toast.success('Reminder created successfully!');
				onClose?.();
			}
		},
		onError: ({ result }) => {
			toast.error(`Error creating reminder: ${result.error.message}`);
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (open !== undefined) {
			// Externally controlled - notify via onClose
			if (!isOpen && onClose) {
				onClose();
			}
		} else {
			// Internally controlled
			internalOpen = isOpen;
			if (!isOpen) {
				onClose?.();
			}
		}
	}
</script>

<Dialog.Root open={dialogOpen} onOpenChange={handleOpenChange}>
	{#if open === undefined}
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button {...props} class="bg-green-600 text-white hover:bg-green-700">
					<BellPlusIcon class="mr-2 h-4 w-4" />
					Create Reminder
				</Button>
			{/snippet}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Schedule Workout Reminder</Dialog.Title>
			<Dialog.Description
				>Get email reminders to stay consistent with your routine</Dialog.Description
			>
		</Dialog.Header>
		<form method="POST" action="?/createReminder" use:enhance>
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="r-workoutType">Workout Type</Label>
						<Select.Root type="single" name="workoutType" bind:value={$form.workoutType}>
							<Select.Trigger id="r-workoutType">
								{$form.workoutType || 'Select type'}
							</Select.Trigger>
							<Select.Content>
								{#each workoutTypeOptions as option (option.value)}
									<Select.Item value={option.value} label={option.label}
										>{option.label}</Select.Item
									>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if $errors.workoutType}
							<p class="text-sm text-destructive">{$errors.workoutType}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="r-time">Time</Label>
						<Input id="r-time" name="time" type="time" bind:value={$form.time} required />
						{#if $errors.time}
							<p class="text-sm text-destructive">{$errors.time}</p>
						{/if}
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="r-cadence">Frequency</Label>
					<Select.Root type="single" name="cadence" bind:value={$form.cadence}>
						<Select.Trigger id="r-cadence"> {$form.cadence || 'Select frequency'} </Select.Trigger>
						<Select.Content>
							<Select.Item value="daily" label="Daily">Daily</Select.Item>
							<Select.Item value="weekly" label="Weekly">Weekly</Select.Item>
						</Select.Content>
					</Select.Root>
					{#if $errors.cadence}
						<p class="text-sm text-destructive">{$errors.cadence}</p>
					{/if}
				</div>

				{#if $form.cadence === 'weekly'}
					<div class="grid gap-2">
						<Label>Days of Week</Label>
						<Input
							id="r-daysOfWeek"
							name="daysOfWeek"
							type="text"
							bind:value={$form.daysOfWeek}
							hidden
						/>
						<div class="flex flex-wrap gap-2">
							{#each daysOfWeek as day (day.id)}
								{@const selectedDays = $form.daysOfWeek ? JSON.parse($form.daysOfWeek) : []}
								<Button
									type="button"
									variant={selectedDays.includes(day.id) ? 'default' : 'outline'}
									size="sm"
									onclick={() => {
										const days = $form.daysOfWeek ? JSON.parse($form.daysOfWeek) : [];
										if (days.includes(day.id)) {
											$form.daysOfWeek = JSON.stringify(days.filter((d: number) => d !== day.id));
										} else {
											$form.daysOfWeek = JSON.stringify([...days, day.id].sort());
										}
									}}
								>
									{day.shortName}
								</Button>
							{/each}
						</div>
						{#if $errors.daysOfWeek}
							<p class="text-sm text-destructive">{$errors.daysOfWeek}</p>
						{/if}
					</div>
				{/if}
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" class="bg-green-600 text-white hover:bg-green-700"> Create </Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

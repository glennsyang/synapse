<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { logWeightSchema } from '$lib/schemas/fitness';

	type LogWeightData = Infer<typeof logWeightSchema>;

	interface WeightEntry {
		id: string;
		date: string;
		time: string | null;
		weightLbs: number;
	}

	let {
		formData,
		editEntry = null,
		onClose,
		open = $bindable(false),
		instanceId = 'default'
	}: {
		formData: SuperValidated<LogWeightData>;
		editEntry?: WeightEntry | null;
		onClose?: () => void;
		open?: boolean;
		instanceId?: string;
	} = $props();

	const isEditing = $derived(editEntry !== null);

	let internalOpen = $state(false);
	const dialogOpen = $derived(open !== undefined ? open : internalOpen);

	// Open dialog externally when editEntry is provided
	$effect(() => {
		if (editEntry && open === undefined) {
			internalOpen = true;
		}
	});

	// Generate a unique form ID based on the editing context and instance
	const formId = $derived(editEntry ? `edit-weight-${editEntry.id}` : `log-weight-${instanceId}`);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance } = superForm(formData, {
		id: formId,
		resetForm: !isEditing,
		onUpdate: ({ form }) => {
			if (form.valid) {
				if (open !== undefined) {
					onClose?.();
				} else {
					internalOpen = false;
				}
				toast.success(isEditing ? 'Weight updated successfully!' : 'Weight logged successfully!');
				onClose?.();
			}
		},
		onError: ({ result }) => {
			toast.error(`Error: ${result.error.message}`);
		}
	});

	// Populate form fields when editing
	$effect(() => {
		if (editEntry) {
			$form.date = editEntry.date;
			$form.time = editEntry.time;
			$form.weightLbs = editEntry.weightLbs;
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
	{#if !isEditing && open === undefined}
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button {...props} class="bg-green-600 text-white hover:bg-green-700">
					<PlusIcon class="mr-2 h-4 w-4" />
					Log Weight
				</Button>
			{/snippet}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Edit Weight Entry' : 'Log Weight'}</Dialog.Title>
			<Dialog.Description>
				{isEditing ? 'Update your weight entry' : 'Record your current weight'}
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action={isEditing ? '?/updateWeight' : '?/logWeight'} use:enhance>
			{#if isEditing && editEntry}
				<Input type="hidden" name="id" value={editEntry.id} />
			{/if}
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="weight-date">Date</Label>
					<Input id="weight-date" name="date" type="date" bind:value={$form.date} required />
					{#if $errors.date}
						<p class="text-sm text-destructive">{$errors.date}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="weight-time">Time (optional)</Label>
					<Input id="weight-time" name="time" type="time" bind:value={$form.time} />
					{#if $errors.time}
						<p class="text-sm text-destructive">{$errors.time}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="weight-lbs">Weight (lbs)</Label>
					<Input
						id="weight-lbs"
						name="weightLbs"
						type="number"
						step="0.1"
						bind:value={$form.weightLbs}
						placeholder="150.0"
						required
					/>
					{#if $errors.weightLbs}
						<p class="text-sm text-destructive">{$errors.weightLbs}</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button {...props} type="button" variant="outline">Cancel</Button>
					{/snippet}
				</Dialog.Close>
				<Button type="submit" class="bg-green-600 text-white hover:bg-green-700">
					{isEditing ? 'Update' : 'Save'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

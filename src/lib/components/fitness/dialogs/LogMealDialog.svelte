<script lang="ts">
	import LongTextInput from '$lib/components/shared/LongTextInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { logMealSchema, MealType } from '$lib/schemas/fitness';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	type LogMealData = Infer<typeof logMealSchema>;

	interface EditMeal {
		id: string;
		date: string;
		timeOfDay: string;
		description: string;
		caloriesEstimate: number | null;
	}

	let {
		formData,
		editEntry = null,
		onClose,
		open = $bindable(false),
		instanceId = 'default'
	}: {
		formData: SuperValidated<LogMealData>;
		editEntry?: EditMeal | null;
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
	const formId = $derived(editEntry ? `edit-meal-${editEntry.id}` : `log-meal-${instanceId}`);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(formData, {
		id: formId,
		resetForm: !isEditing,
		onUpdate: ({ form }) => {
			if (form.valid) {
				if (open !== undefined) {
					onClose?.();
				} else {
					internalOpen = false;
				}
				toast.success(isEditing ? 'Meal updated successfully!' : 'Meal logged successfully!');
				onClose?.();
			}
			if ($message?.type === 'error') {
				toast.error(`Error ${isEditing ? 'updating' : 'logging'} meal. Reason: ${$message.text}`);
			}
		},
		onError: ({ result }) => {
			toast.error(
				`There was an error ${isEditing ? 'updating' : 'logging'} meal: ${result.error.message}`
			);
		}
	});

	// Populate form fields when editing
	$effect(() => {
		if (editEntry) {
			$form.date = editEntry.date;
			$form.timeOfDay = editEntry.timeOfDay as MealType;
			$form.description = editEntry.description;
			$form.caloriesEstimate = editEntry.caloriesEstimate;
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
					Log Meal
				</Button>
			{/snippet}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Edit Meal' : 'Log Meal'}</Dialog.Title>
			<Dialog.Description>
				{isEditing ? 'Update your meal entry' : 'Record what you ate'}
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action={isEditing ? '?/updateMeal' : '?/logMeal'} use:enhance>
			{#if isEditing && editEntry}
				<Input type="hidden" name="id" value={editEntry.id} />
			{/if}
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="meal-date">Date</Label>
					<Input
						id="meal-date"
						name="date"
						type="date"
						bind:value={$form.date}
						class={$errors.date ? 'border-destructive' : ''}
						required
					/>
					{#if $errors.date}
						<p class="text-destructive text-sm">{$errors.date}</p>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="meal-type">Meal Type</Label>
						<Select.Root type="single" name="timeOfDay" bind:value={$form.timeOfDay}>
							<Select.Trigger id="meal-type" class="w-full">
								{$form.timeOfDay || 'Select meal type'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="breakfast" label="Breakfast">Breakfast</Select.Item>
								<Select.Item value="lunch" label="Lunch">Lunch</Select.Item>
								<Select.Item value="dinner" label="Dinner">Dinner</Select.Item>
								<Select.Item value="snack" label="Snack">Snack</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if $errors.timeOfDay}
							<p class="text-destructive text-sm">{$errors.timeOfDay}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="meal-calories">Calories (estimate)</Label>
						<Input
							id="meal-calories"
							name="caloriesEstimate"
							type="number"
							bind:value={$form.caloriesEstimate}
							class={$errors.caloriesEstimate ? 'border-destructive' : ''}
							placeholder="500"
						/>
						{#if $errors.caloriesEstimate}
							<p class="text-destructive text-sm">{$errors.caloriesEstimate}</p>
						{/if}
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="meal-description">Description</Label>
					<LongTextInput
						id="meal-description"
						name="description"
						bind:value={$form.description}
						class={$errors.description ? 'border-destructive' : ''}
						rows={3}
						placeholder="e.g., Chicken salad with olive oil dressing"
						required
					/>
					{#if $errors.description}
						<p class="text-destructive text-sm">{$errors.description}</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close><Button type="reset" variant="outline">Cancel</Button></Dialog.Close>
				<Button
					type="submit"
					disabled={$submitting}
					class="bg-green-600 text-white hover:bg-green-700"
				>
					{$submitting ? 'Saving...' : isEditing ? 'Update' : 'Save'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
import PlusIcon from '@lucide/svelte/icons/plus';
import { toast } from 'svelte-sonner';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import { superForm } from 'sveltekit-superforms';

import LongTextInput from '$lib/components/shared/LongTextInput.svelte';
import { Button } from '$lib/components/ui/button';
import * as Dialog from '$lib/components/ui/dialog';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select';
import type { logMealSchema, MealType } from '$lib/schemas/fitness';

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
	onClose
}: {
	formData: SuperValidated<LogMealData>;
	editEntry?: EditMeal | null;
	onClose?: () => void;
} = $props();

const isEditing = $derived(editEntry !== null);

let open = $state(false);

// Open dialog externally when editEntry is provided
$effect(() => {
	if (editEntry) {
		open = true;
	}
});

// svelte-ignore state_referenced_locally
const { form, errors, enhance } = superForm(formData, {
	resetForm: !isEditing,
	onUpdate: ({ form }) => {
		if (form.valid) {
			open = false;
			toast.success(isEditing ? 'Meal updated successfully!' : 'Meal logged successfully!');
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
		$form.timeOfDay = editEntry.timeOfDay as MealType;
		$form.description = editEntry.description;
		$form.caloriesEstimate = editEntry.caloriesEstimate;
	}
});

function handleOpenChange(isOpen: boolean) {
	open = isOpen;
	if (!isOpen) {
		onClose?.();
	}
}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	{#if !isEditing}
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
				<input type="hidden" name="id" value={editEntry.id}>
			{/if}
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="meal-date">Date</Label>
					<Input id="meal-date" name="date" type="date" bind:value={$form.date} required />
					{#if $errors.date}
						<p class="text-sm text-destructive">{$errors.date}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="meal-type">Meal Type</Label>
					<Select.Root type="single" name="timeOfDay" bind:value={$form.timeOfDay}>
						<Select.Trigger id="meal-type">
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
						<p class="text-sm text-destructive">{$errors.timeOfDay}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="meal-description">Description</Label>
					<LongTextInput
						id="meal-description"
						name="description"
						bind:value={$form.description}
						rows={3}
						placeholder="e.g., Chicken salad with olive oil dressing"
						required
					/>
					{#if $errors.description}
						<p class="text-sm text-destructive">{$errors.description}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="meal-calories">Calories (estimate)</Label>
					<Input
						id="meal-calories"
						name="caloriesEstimate"
						type="number"
						bind:value={$form.caloriesEstimate}
						placeholder="500"
					/>
					{#if $errors.caloriesEstimate}
						<p class="text-sm text-destructive">{$errors.caloriesEstimate}</p>
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
					{isEditing ? 'Save Changes' : 'Log Meal'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

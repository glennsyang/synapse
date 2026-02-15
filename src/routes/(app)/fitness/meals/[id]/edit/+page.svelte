<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';

	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(data.form, {
		dataType: 'form'
	});

	let showDeleteDialog = $state(false);
</script>

<div class="container mx-auto max-w-2xl py-8">
	<div class="mb-6">
		<Button variant="ghost" href="/fitness?tab=meals" class="mb-4">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Fitness
		</Button>
		<div class="flex items-start justify-between">
			<div>
				<h1 class="font-display text-3xl font-bold">Edit Meal</h1>
				<p class="text-muted-foreground">Update meal details and calories</p>
			</div>
			<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
				<Trash2Icon class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Meal Details</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/update" use:enhance class="space-y-4">
				<Input type="hidden" name="id" bind:value={$form.id} />

				<div class="grid gap-2">
					<Label for="meal-date">Date</Label>
					<Input id="meal-date" name="date" type="date" bind:value={$form.date} required />
					{#if $errors.date}
						<p class="text-sm text-destructive">{$errors.date}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="meal-time">Meal Type</Label>
					<Select.Root type="single" name="timeOfDay" bind:value={$form.timeOfDay}>
						<Select.Trigger id="meal-time">{$form.timeOfDay || 'Select meal type'}</Select.Trigger>
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
					<textarea
						id="meal-description"
						name="description"
						bind:value={$form.description}
						rows="3"
						class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						required
					></textarea>
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

				<div class="flex gap-4">
					<Button type="submit" disabled={$submitting}
						>{$submitting ? 'Saving...' : 'Update Meal'}</Button
					>
					<Button type="button" variant="outline" href="/fitness?tab=meals">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

<ConfirmDialog
	bind:open={showDeleteDialog}
	title="Delete Meal"
	message="Are you sure you want to delete this meal entry? This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/delete"
	id={data.meal.id}
/>

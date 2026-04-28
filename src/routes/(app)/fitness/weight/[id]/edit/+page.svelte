<script lang="ts">
	import { ArrowLeft, Trash2 } from '@lucide/svelte/icons';
	import { superForm } from 'sveltekit-superforms';

	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import PageFormShell from '$lib/components/shared/PageFormShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting } = superForm(data.form, {
		dataType: 'form'
	});

	let showDeleteDialog = $state(false);
</script>

<PageFormShell>
	<div class="mb-6">
		<Button variant="ghost" href="/fitness?tab=weight" class="mb-4">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Fitness
		</Button>
		<div class="flex items-start justify-between">
			<div>
				<h1 class="font-display text-3xl font-bold">Edit Weight Entry</h1>
				<p class="text-muted-foreground">Update your logged weight details</p>
			</div>
			<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
				<Trash2 class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<Card.Root>
		<Card.Header> <Card.Title>Weight Entry</Card.Title> </Card.Header>
		<Card.Content>
			<form method="POST" action="?/update" use:enhance class="space-y-4">
				<Input type="hidden" name="id" bind:value={$form.id} />

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
						required
					/>
					{#if $errors.weightLbs}
						<p class="text-sm text-destructive">{$errors.weightLbs}</p>
					{/if}
				</div>

				<div class="flex gap-4">
					<Button type="submit" disabled={$submitting}
						>{$submitting ? 'Saving...' : 'Update Entry'}</Button
					>
					<Button type="button" variant="outline" href="/fitness?tab=weight">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</PageFormShell>

<ConfirmDialog
	bind:open={showDeleteDialog}
	title="Delete Weight Entry"
	message="Are you sure you want to delete this weight entry? This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/delete"
	id={data.entry.id}
/>

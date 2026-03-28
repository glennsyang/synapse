<script lang="ts">
import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
import Trash2Icon from '@lucide/svelte/icons/trash-2';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
import PageFormShell from '$lib/components/shared/PageFormShell.svelte';
import {
	formatTaskDisplayId,
	taskPriorityOptions,
	taskStateOptions
} from '$lib/components/tasks/task-ui';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select';
import { Textarea } from '$lib/components/ui/textarea';

import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

// svelte-ignore state_referenced_locally
const { form, errors, enhance, message, submitting } = superForm(data.form, {
	dataType: 'form',
	onUpdate: ({ form }) => {
		if (form.valid) {
			toast.success('Task updated successfully!');
		}
		if ($message?.type === 'error') {
			toast.error(`Error updating task. Reason: ${$message.text}`);
		}
	}
});

let showDeleteDialog = $state(false);

let priorityString = $derived($form.priority?.toString() ?? '2');
let selectedPriorityOption = $derived(
	taskPriorityOptions.find((option) => option.value.toString() === priorityString) ??
		taskPriorityOptions[1]
);
let selectedStateOption = $derived(
	taskStateOptions.find((option) => option.value === $form.state) ?? taskStateOptions[0]
);
</script>

<PageFormShell>
	<div class="mb-6">
		<Button variant="ghost" href="/tasks" class="mb-4">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Tasks
		</Button>
		<div class="flex items-start justify-between">
			<div>
				<p
					class="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground"
				>
					{formatTaskDisplayId(data.task.taskNumber)}
				</p>
				<h1 class="text-3xl font-bold">Edit Task</h1>
				<p class="text-muted-foreground">Update the details, state, and priority for this task.</p>
			</div>
			<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
				<Trash2Icon class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	</div>

	<Card.Root>
		<Card.Header> <Card.Title>Task Details</Card.Title> </Card.Header>
		<Card.Content>
			<form method="POST" action="?/update" use:enhance class="space-y-4">
				<div class="space-y-2">
					<Label for="title">Title *</Label>
					<Input
						id="title"
						name="title"
						type="text"
						bind:value={$form.title}
						placeholder="Enter task title"
						aria-invalid={$errors.title ? 'true' : undefined}
						required
					/>
					{#if $errors.title}
						<p class="text-sm text-destructive">{$errors.title}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={$form.description}
						placeholder="Add more details about this task"
						rows={4}
					/>
					{#if $errors.description}
						<p class="text-sm text-destructive">{$errors.description}</p>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="priority">Priority *</Label>
						<Select.Root
							type="single"
							name="priority"
							bind:value={priorityString}
							onValueChange={(v) => ($form.priority = Number(v))}
							required
						>
							<Select.Trigger class="w-full">
								<div class="flex items-center gap-2">
									<span
										class={`h-2.5 w-2.5 rounded-full ${selectedPriorityOption.dotClass}`}
									></span>
									<span>{selectedPriorityOption.valueLabel}</span>
								</div>
							</Select.Trigger>
							<Select.Content>
								{#each taskPriorityOptions as option (option.value)}
									<Select.Item value={option.value.toString()} label={option.valueLabel}>
										<div class="flex items-center gap-2">
											<span class={`h-2.5 w-2.5 rounded-full ${option.dotClass}`}></span>
											<span>{option.valueLabel}</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if $errors.priority}
							<p class="text-sm text-destructive">{$errors.priority}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="dueDate">Due Date</Label>
						<Input
							id="dueDate"
							name="dueDate"
							type="date"
							bind:value={$form.dueDate}
							aria-invalid={$errors.dueDate ? 'true' : undefined}
						/>
						{#if $errors.dueDate}
							<p class="text-sm text-destructive">{$errors.dueDate}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-2">
					<Label for="state">State</Label>
					<Select.Root type="single" name="state" bind:value={$form.state}>
						<Select.Trigger class="w-full {$errors.state ? 'border-destructive' : ''}" id="state">
							<div class="flex items-center gap-2">
								<span class={`h-2.5 w-2.5 rounded-full ${selectedStateOption.dotClass}`}></span>
								<span>{selectedStateOption.label}</span>
							</div>
						</Select.Trigger>
						<Select.Content>
							{#each taskStateOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									<div class="flex items-center gap-2">
										<span class={`h-2.5 w-2.5 rounded-full ${option.dotClass}`}></span>
										<span>{option.label}</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.state}
						<p class="text-sm text-destructive">{$errors.state}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="tags">Tags</Label>
					<Input
						id="tags"
						name="tags"
						type="text"
						bind:value={$form.tags}
						placeholder="Comma-separated tags (e.g., #urgent, #waiting)"
					/>
					<p class="text-xs text-muted-foreground">Separate tags with commas</p>
					{#if $errors.tags}
						<p class="text-sm text-destructive">{$errors.tags}</p>
					{/if}
				</div>

				{#if $message}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{$message}</div>
				{/if}

				<div class="flex gap-2">
					<Button
						type="submit"
						class="text-white bg-orange-600 hover:bg-orange-700"
						disabled={$submitting}
					>
						{$submitting ? 'Saving...' : 'Update'}
					</Button>
					<Button type="button" variant="outline" href="/tasks">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</PageFormShell>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
	bind:open={showDeleteDialog}
	title="Delete Task"
	message="Are you sure you want to delete this task? This action cannot be undone."
	confirmButtonText="Delete"
	actionUrl="?/delete"
/>

<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message } = superForm(data.form, {
		onUpdate: ({ form }) => {
			if (form.valid) {
				toast.success('Todo created successfully!');
			}
			if ($message?.type === 'error') {
				toast.error(`Error creating todo. Reason: ${$message.text}`);
			}
		}
	});

	// Type coercion helpers for Select components
	let priorityString = $derived($form.priority?.toString() ?? '2');
	let projectIdValue = $derived($form.projectId ?? undefined);
</script>

<div class="container mx-auto max-w-2xl py-8">
	<div class="mb-6">
		<Button variant="ghost" href="/todos" class="mb-4">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Todos
		</Button>
		<h1 class="text-3xl font-bold">Create New Todo</h1>
		<p class="text-muted-foreground">Add a new task to your list</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Todo Details</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-4">
				<!-- Title -->
				<div class="space-y-2">
					<Label for="title">Title *</Label>
					<Input
						id="title"
						name="title"
						type="text"
						bind:value={$form.title}
						placeholder="Enter todo title"
						aria-invalid={$errors.title ? 'true' : undefined}
					/>
					{#if $errors.title}
						<p class="text-sm text-destructive">{$errors.title}</p>
					{/if}
				</div>

				<!-- Description -->
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={$form.description}
						placeholder="Add more details about this todo"
						rows={4}
					/>
					{#if $errors.description}
						<p class="text-sm text-destructive">{$errors.description}</p>
					{/if}
				</div>

				<!-- Cadence -->
				<div class="space-y-2">
					<Label for="cadence">Cadence *</Label>
					<Select.Root type="single" name="cadence" bind:value={$form.cadence} required>
						<Select.Trigger class="w-full {$errors.cadence ? 'border-destructive' : ''}">
							{$form.cadence.charAt(0).toUpperCase() + $form.cadence.slice(1) || 'Select cadence'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="daily" label="Daily">Daily</Select.Item>
							<Select.Item value="weekly" label="Weekly">Weekly</Select.Item>
							<Select.Item value="monthly" label="Monthly">Monthly</Select.Item>
						</Select.Content>
					</Select.Root>
					{#if $errors.cadence}
						<p class="text-sm text-destructive">{$errors.cadence}</p>
					{/if}
				</div>

				<!-- Project -->
				<div class="space-y-2">
					<Label for="projectId">Project</Label>
					<Select.Root
						type="single"
						name="projectId"
						bind:value={projectIdValue}
						onValueChange={(v) => ($form.projectId = v || null)}
					>
						<Select.Trigger class="w-full {$errors.projectId ? 'border-destructive' : ''}">
							{$form.projectId
								? data.projects.find((c) => c.id === $form.projectId)?.name || 'Select a project'
								: 'Select a project'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">No Project</Select.Item>
							{#each data.projects as project (project.id)}
								<Select.Item value={project.id} label={project.name}>
									{project.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.projectId}
						<p class="text-sm text-destructive">{$errors.projectId}</p>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<!-- Priority -->
					<div class="space-y-2">
						<Label for="priority">Priority</Label>
						<Select.Root
							type="single"
							name="priority"
							bind:value={priorityString}
							onValueChange={(v) => ($form.priority = Number(v))}
							required
						>
							<Select.Trigger class="w-full">
								{$form.priority || 'Select priority'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="1" label="1 - Highest">1 - Highest</Select.Item>
								<Select.Item value="2" label="2 - High">2 - High</Select.Item>
								<Select.Item value="3" label="3 - Medium">3 - Medium</Select.Item>
								<Select.Item value="4" label="4 - Low">4 - Low</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if $errors.priority}
							<p class="text-sm text-destructive">{$errors.priority}</p>
						{/if}
					</div>

					<!-- Due Date -->
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

				<!-- Tags -->
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

				<!-- Error Message -->
				{#if $message}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{$message}
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex gap-4">
					<Button type="submit" class="flex-1">Create Todo</Button>
					<Button type="button" variant="outline" href="/todos" class="flex-1">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

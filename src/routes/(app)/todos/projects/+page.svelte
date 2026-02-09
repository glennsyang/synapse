<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Edit2Icon from '@lucide/svelte/icons/edit-2';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const {
		form,
		errors,
		enhance: createEnhance,
		message
	} = superForm(data.createForm, {
		onUpdate: ({ form }) => {
			if (form.valid) {
				toast.success('Project created successfully!');
			}
			if ($message?.type === 'error') {
				toast.error(`Error creating project. Reason: ${$message.text}`);
			}
		}
	});

	let editingProject = $state<{ id: string; name: string; color: string | null } | null>(null);
	let isEditing = $derived(editingProject !== null);
	let deletingProjectId = $state<string | null>(null);
	let isDeleting = $derived(deletingProjectId !== null);
</script>

<div class="container mx-auto max-w-4xl py-8">
	<div class="mb-6">
		<Button variant="ghost" href="/todos" class="mb-4">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Todos
		</Button>
		<h1 class="text-3xl font-bold">Projects</h1>
		<p class="text-muted-foreground">Organize your todos into projects</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Create Project Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PlusIcon class="h-5 w-5" />
					Create New Project
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/create" use:createEnhance class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Project Name *</Label>
						<Input
							id="name"
							name="name"
							type="text"
							bind:value={$form.name}
							placeholder="e.g., Work, Personal, Health"
							aria-invalid={$errors.name ? 'true' : undefined}
						/>
						{#if $errors.name}
							<p class="text-sm text-destructive">{$errors.name}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="color">Color (optional)</Label>
						<div class="flex gap-2">
							<Input
								id="color"
								name="color"
								type="color"
								bind:value={$form.color}
								class="h-10 w-20"
							/>
							<Input type="text" bind:value={$form.color} placeholder="#3B82F6" class="flex-1" />
						</div>
						{#if $errors.color}
							<p class="text-sm text-destructive">{$errors.color}</p>
						{/if}
					</div>

					{#if $message}
						<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{$message}
						</div>
					{/if}

					<Button type="submit" class="w-full">
						<PlusIcon class="mr-2 h-4 w-4" />
						Create Project
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Projects List -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<FolderOpenIcon class="h-5 w-5" />
					Your Projects ({data.projects.length})
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.projects.length === 0}
					<div class="rounded-md border border-dashed p-8 text-center text-muted-foreground">
						<p>No projects yet. Create one to get started!</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each data.projects as project (project.id)}
							<div
								class="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
							>
								{#if project.color}
									<div class="h-4 w-4 rounded-full" style="background-color: {project.color}"></div>
								{:else}
									<FolderOpenIcon class="h-4 w-4 text-muted-foreground" />
								{/if}
								<span class="flex-1 font-medium">{project.name}</span>
								<div class="flex gap-1">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => {
											editingProject = project;
										}}
										class="h-8 w-8 p-0"
									>
										<Edit2Icon class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => {
											deletingProjectId = project.id;
										}}
										class="h-8 w-8 p-0"
									>
										<Trash2Icon class="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
{#if deletingProjectId}
	<ConfirmDialog
		bind:open={isDeleting}
		id={deletingProjectId}
		actionUrl={`?/delete?id=${deletingProjectId}`}
		title="Delete Project"
		message="Are you sure you want to delete this project? Todos in this project will not be deleted, but will be unassigned."
		confirmButtonText="Delete"
	/>
{/if}

<!-- Edit Project Dialog (simplified inline) -->
{#if editingProject}
	<ConfirmDialog
		bind:open={isEditing}
		id={editingProject.id}
		title="Edit Project"
		message="Update project details"
		confirmButtonText="Save"
	/>
{/if}

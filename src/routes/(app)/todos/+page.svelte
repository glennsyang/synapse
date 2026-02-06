<script lang="ts">
	import { Plus } from '@lucide/svelte';

	import { page } from '$app/state';
	import TodoGridView from '$lib/components/todos/TodoGridView.svelte';
	import TodoKanbanView from '$lib/components/todos/TodoKanbanView.svelte';
	import TodoListView from '$lib/components/todos/TodoListView.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get current view from URL params (default: list)
	let currentView = $derived(page.url.searchParams.get('view') || 'list');

	// Filter state
	let selectedCadence = $state<'all' | 'daily' | 'weekly' | 'monthly'>('all');
	let selectedProject = $state<string | null>(null);
	let selectedState = $state<string | null>(null);

	// Filtered todos based on local filters
	let filteredTodos = $derived(
		data.todos.filter((todo) => {
			if (selectedCadence !== 'all' && todo.cadence !== selectedCadence) return false;
			if (selectedProject && todo.projectId !== selectedProject) return false;
			if (selectedState && todo.state !== selectedState) return false;
			return true;
		})
	);
</script>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Todos</h1>
			<p class="text-muted-foreground">Manage your tasks by cadence</p>
		</div>
		<Button href="/todos/new">
			<Plus class="mr-2 h-4 w-4" />
			New Todo
		</Button>
	</div>

	<!-- Cadence Filter Tabs -->
	<Tabs.Root
		value={selectedCadence}
		onValueChange={(v) => (selectedCadence = v as typeof selectedCadence)}
		class="mb-6"
	>
		<Tabs.List class="grid w-full max-w-md grid-cols-4">
			<Tabs.Trigger value="all">All</Tabs.Trigger>
			<Tabs.Trigger value="daily">Daily</Tabs.Trigger>
			<Tabs.Trigger value="weekly">Weekly</Tabs.Trigger>
			<Tabs.Trigger value="monthly">Monthly</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	<!-- Additional Filters -->
	<div class="mb-6 flex flex-wrap gap-4">
		<!-- Project Filter -->
		<div class="flex items-center gap-2">
			<label for="project-filter" class="text-sm font-medium">Project:</label>
			<select
				id="project-filter"
				bind:value={selectedProject}
				class="rounded-md border px-3 py-1 text-sm"
			>
				<option value={null}>All Projects</option>
				{#each data.projects as project (project.id)}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>
		</div>

		<!-- State Filter -->
		<div class="flex items-center gap-2">
			<label for="state-filter" class="text-sm font-medium">State:</label>
			<select
				id="state-filter"
				bind:value={selectedState}
				class="rounded-md border px-3 py-1 text-sm"
			>
				<option value={null}>All States</option>
				<option value="new">New</option>
				<option value="in_progress">In Progress</option>
				<option value="blocked">Blocked</option>
				<option value="done">Done</option>
			</select>
		</div>

		<!-- View Selector -->
		<div class="ml-auto flex items-center gap-2">
			<label for="view-selector" class="text-sm font-medium">View:</label>
			<div class="flex gap-1 rounded-md border p-1">
				<Button
					variant={currentView === 'list' ? 'default' : 'ghost'}
					size="sm"
					href="?view=list"
					class="px-3"
				>
					List
				</Button>
				<Button
					variant={currentView === 'grid' ? 'default' : 'ghost'}
					size="sm"
					href="?view=grid"
					class="px-3"
				>
					Grid
				</Button>
				<Button
					variant={currentView === 'kanban' ? 'default' : 'ghost'}
					size="sm"
					href="?view=kanban"
					class="px-3"
				>
					Kanban
				</Button>
			</div>
		</div>
	</div>

	<!-- View Content -->
	<div class="mt-6">
		{#if currentView === 'list'}
			<TodoListView todos={filteredTodos} />
		{:else if currentView === 'grid'}
			<TodoGridView todos={filteredTodos} />
		{:else if currentView === 'kanban'}
			<TodoKanbanView todos={filteredTodos} />
		{/if}
	</div>
</div>

<script lang="ts">
	import { Plus } from '@lucide/svelte';

	import { navigating, page } from '$app/state';
	import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
	import TagFilter from '$lib/components/todos/TagFilter.svelte';
	import TodoGridView from '$lib/components/todos/TodoGridView.svelte';
	import TodoKanbanView from '$lib/components/todos/TodoKanbanView.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get current view from URL params (default: grid)
	let currentView = $derived(page.url.searchParams.get('view') || 'grid');

	// Filter state
	let selectedCadence = $state<'all' | 'daily' | 'weekly' | 'monthly'>('all');
	let selectedState = $state<string | null>(null);

	// Filtered todos based on local filters
	let filteredTodos = $derived(
		data.todos.filter((todo) => {
			if (selectedCadence !== 'all' && todo.cadence !== selectedCadence) return false;
			if (selectedState && todo.state !== selectedState) return false;
			return true;
		})
	);
</script>

{#if navigating.to?.url.pathname === '/todos'}
	<PageSkeleton color="orange" />
{:else}
	<div class="mobile-container mx-auto max-w-7xl py-4 sm:py-8">
		<div class="mobile-stack mb-6 justify-between sm:mb-8">
			<div>
				<h1 class="font-display text-2xl font-bold sm:text-3xl">Todos</h1>
				<p class="text-sm text-muted-foreground sm:text-base">Manage your tasks</p>
			</div>
			<Button href="/todos/new" class="w-full bg-orange-600 hover:bg-orange-700 sm:w-auto">
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
			<Tabs.List
				class="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground"
			>
				<Tabs.Trigger value="all">All</Tabs.Trigger>
				<Tabs.Trigger value="daily">Daily</Tabs.Trigger>
				<Tabs.Trigger value="weekly">Weekly</Tabs.Trigger>
				<Tabs.Trigger value="monthly">Monthly</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		<!-- Additional Filters -->
		<div class="mb-6 flex flex-wrap gap-4">
			<!-- Tag Filter -->
			<div class="flex items-center gap-2">
				<Label for="tag-filter" class="text-sm font-medium">Tags:</Label>
				<TagFilter allTags={data.allTags} />
			</div>

			<!-- State Filter -->
			<div class="flex items-center gap-2">
				<Label for="state-filter" class="text-sm font-medium">State:</Label>
				<select
					id="state-filter"
					bind:value={selectedState}
					class="rounded-md border px-3 py-1 text-sm"
				>
					<option value={null}>All States</option>
					<option value="new">New</option>
					<option value="in_progress">In Progress</option>
					<option value="on_hold">On Hold</option>
					<option value="blocked">Blocked</option>
					<option value="done">Done</option>
				</select>
			</div>

			<!-- View Selector -->
			<div class="ml-auto flex items-center gap-2">
				<Label for="view-selector" class="text-sm font-medium">View:</Label>
				<div class="flex gap-1 rounded-md border p-1">
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
			{#if currentView === 'grid'}
				<TodoGridView todos={filteredTodos} />
			{:else if currentView === 'kanban'}
				<TodoKanbanView todos={filteredTodos} />
			{/if}
		</div>
	</div>
{/if}

<script lang="ts">
import { Plus } from '@lucide/svelte';

import { navigating } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import TaskKanbanView from '$lib/components/tasks/TaskKanbanView.svelte';
import TaskTagFilter from '$lib/components/tasks/TaskTagFilter.svelte';
import { taskStateOptions } from '$lib/components/tasks/task-ui';
import { Button } from '$lib/components/ui/button';
import { Label } from '$lib/components/ui/label';

import type { TaskState } from '$lib/schemas/task';

import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

let selectedState = $state<'all' | TaskState>('all');

let filteredTasks = $derived(
	selectedState === 'all' ? data.tasks : data.tasks.filter((task) => task.state === selectedState)
);
</script>

{#if navigating.to?.url.pathname === '/tasks'}
	<PageSkeleton color="orange" />
{:else}
	<PageShell>
		<div class="mobile-stack mb-6 justify-between sm:mb-8">
			<div>
				<h1 class="font-display text-2xl font-bold sm:text-3xl">Tasks</h1>
				<p class="text-sm text-muted-foreground sm:text-base">
					Move work through your board and keep priorities visible.
				</p>
			</div>
			<Button href="/tasks/new" class="w-full bg-orange-600 hover:bg-orange-700 sm:w-auto">
				<Plus class="mr-2 h-4 w-4" />
				New Task
			</Button>
		</div>

		<div class="mb-6 flex flex-wrap gap-4">
			<div class="flex items-center gap-2">
				<Label for="tag-filter" class="text-sm font-medium">Tags:</Label>
				<TaskTagFilter allTags={data.allTags} />
			</div>

			<div class="flex items-center gap-2">
				<Label for="state-filter" class="text-sm font-medium">State:</Label>
				<select
					id="state-filter"
					bind:value={selectedState}
					class="rounded-md border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="all">All States</option>
					{#each taskStateOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="mt-6 w-full sm:min-h-80"><TaskKanbanView tasks={filteredTasks} /></div>
	</PageShell>
{/if}

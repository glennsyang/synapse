<script lang="ts">
import { ListFilter, Plus } from '@lucide/svelte';
import { onDestroy } from 'svelte';

import { goto } from '$app/navigation';
import { navigating, page } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import TaskKanbanView from '$lib/components/tasks/TaskKanbanView.svelte';
import TaskPriorityFilter from '$lib/components/tasks/TaskPriorityFilter.svelte';
import TaskTagFilter from '$lib/components/tasks/TaskTagFilter.svelte';
import { Button } from '$lib/components/ui/button';
import * as Collapsible from '$lib/components/ui/collapsible';
import { Input } from '$lib/components/ui/input';

import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

let filtersOpen = $state(false);
let keyword = $state(page.url.searchParams.get('keyword') ?? '');
let keywordDebounce = $state<ReturnType<typeof setTimeout> | null>(null);
let keywordDirty = $state(false);
let urlKeyword = $derived(page.url.searchParams.get('keyword') ?? '');

let hasActiveFilters = $derived(
	Boolean(page.url.searchParams.get('keyword')?.trim()) ||
		Boolean(page.url.searchParams.get('priority')) ||
		Boolean(page.url.searchParams.get('tag'))
);

let showPageSkeleton = $derived(
	navigating.to?.url.pathname === '/tasks' && navigating.from?.url.pathname !== '/tasks'
);

onDestroy(() => {
	if (keywordDebounce) {
		clearTimeout(keywordDebounce);
	}
});

function handleKeywordInput(event: Event) {
	const currentTarget = event.currentTarget;
	if (!(currentTarget instanceof HTMLInputElement)) {
		return;
	}

	keyword = currentTarget.value;
	queueKeywordFilterUpdate();
}

function queueKeywordFilterUpdate() {
	keywordDirty = true;
	if (keywordDebounce) {
		clearTimeout(keywordDebounce);
	}

	keywordDebounce = setTimeout(() => {
		void applyKeywordFilter();
	}, 250);
}

async function applyKeywordFilter() {
	if (keywordDebounce) {
		clearTimeout(keywordDebounce);
		keywordDebounce = null;
	}

	const normalizedKeyword = keyword.trim();
	const currentKeyword = urlKeyword;
	if (normalizedKeyword === currentKeyword) {
		keywordDirty = false;
		return;
	}

	const url = new URL(page.url);
	if (normalizedKeyword) {
		url.searchParams.set('keyword', normalizedKeyword);
	} else {
		url.searchParams.delete('keyword');
	}

	try {
		await goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	} finally {
		keywordDirty = false;
	}
}
</script>

{#if showPageSkeleton}
	<PageSkeleton color="orange" />
{:else}
	<PageShell class="min-w-0">
		<Collapsible.Root bind:open={filtersOpen}>
			<div class="mobile-stack mb-5 justify-between gap-4 sm:mb-6 sm:flex-wrap lg:flex-nowrap">
				<div class="min-w-0 flex-1">
					<h1 class="font-display text-2xl font-bold sm:text-3xl">Tasks</h1>
					<p class="text-sm text-muted-foreground sm:text-base">
						Move work through your board and keep priorities visible.
					</p>
				</div>
				<div class="flex w-full items-center gap-2 sm:w-auto">
					<Button
						href="/tasks/new"
						class="min-w-0 flex-1 bg-orange-600 hover:bg-orange-700 sm:w-auto sm:flex-none"
					>
						<Plus class="mr-2 h-4 w-4" />
						New Task
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={() => (filtersOpen = !filtersOpen)}
						aria-label="Toggle task filters"
						aria-controls="tasks-filter-bar"
						aria-expanded={filtersOpen}
						class={[
							'shrink-0',
							(filtersOpen || hasActiveFilters) &&
								'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/15 dark:hover:text-orange-100'
						]}
					>
						<ListFilter class="size-4" />
					</Button>
				</div>
			</div>

			<Collapsible.Content id="tasks-filter-bar" class="mb-5 w-full sm:mb-6">
				<div
					class="grid gap-4 rounded-3xl border border-orange-200/80 bg-orange-50/55 p-4 shadow-sm dark:border-orange-500/25 dark:bg-orange-500/8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
				>
					<div class="min-w-0 w-full">
						<Input
							id="task-keyword-filter"
							type="search"
							value={keywordDirty ? keyword : urlKeyword}
							oninput={handleKeywordInput}
							aria-label="Search tasks by keyword"
							placeholder="Search title or description"
							maxlength={200}
							class="bg-background/90"
						/>
					</div>

					<div class="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:justify-self-end">
						<div class="w-full lg:w-32 lg:shrink-0"><TaskPriorityFilter /></div>

						<div class="w-full lg:w-36 lg:shrink-0"><TaskTagFilter allTags={data.allTags} /></div>
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>

		<div class="mt-4 min-w-0 w-full sm:min-h-80"><TaskKanbanView tasks={data.tasks} /></div>
	</PageShell>
{/if}

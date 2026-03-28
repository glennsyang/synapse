<script lang="ts">
import { CalendarCog, CalendarDays, ListFilter, Plus, Search, SquareKanban } from '@lucide/svelte';
import { onDestroy } from 'svelte';

import { goto } from '$app/navigation';
import { navigating, page } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import DailyAgendaView from '$lib/components/tasks/DailyAgendaView.svelte';
import TaskKanbanView from '$lib/components/tasks/TaskKanbanView.svelte';
import TaskPriorityFilter from '$lib/components/tasks/TaskPriorityFilter.svelte';
import TaskTagFilter from '$lib/components/tasks/TaskTagFilter.svelte';
import { Button } from '$lib/components/ui/button';
import * as Collapsible from '$lib/components/ui/collapsible';
import { Input } from '$lib/components/ui/input';
import { Root } from '$lib/components/ui/skeleton';
import * as Tabs from '$lib/components/ui/tabs';
import * as Tooltip from '$lib/components/ui/tooltip';
import type { TaskPageTab } from '$lib/types';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

let filtersOpen = $state(false);
let defaultsDialogOpen = $state(false);
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

function buildTasksHref(tab: TaskPageTab, week?: string | null): string {
	const url = new URL(page.url);
	url.searchParams.set('tab', tab);

	if (week) {
		url.searchParams.set('week', week);
	}

	return `${url.pathname}?${url.searchParams.toString()}`;
}

async function openTaskTab(tab: TaskPageTab) {
	const week =
		tab === 'agenda' ? (data.agenda?.weekStart ?? page.url.searchParams.get('week')) : null;
	await goto(buildTasksHref(tab, week), { replaceState: true, noScroll: true, keepFocus: true });
}

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
	<PageShell class="min-w-0 overflow-x-hidden">
		<div class="mobile-stack mb-4 justify-between gap-3 sm:mb-5 sm:flex-wrap lg:flex-nowrap">
			<div class="min-w-0 flex-1">
				<h1 class="font-display text-2xl font-bold sm:text-3xl">Tasks</h1>
				<p class="text-sm text-muted-foreground sm:text-base">
					Switch between your kanban board and your weekly Daily Agenda
				</p>
			</div>
			<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
				{#if data.activeTab === 'agenda'}
					<Button
						type="button"
						class="min-w-0 flex-1 text-white bg-orange-600 hover:bg-orange-700 sm:flex-none"
						onclick={() => (defaultsDialogOpen = true)}
					>
						<CalendarCog class="mr-2 h-4 w-4" />
						Set Defaults
					</Button>
				{/if}
				{#if data.activeTab === 'kanban'}
					<Button
						type="button"
						href="/tasks/new"
						class="min-w-0 flex-1 text-white bg-orange-600 hover:bg-orange-700 sm:w-auto sm:flex-none"
					>
						<Plus class="mr-2 h-4 w-4" />
						New Task
					</Button>
					<Tooltip.Root>
						<Tooltip.Trigger>
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
						</Tooltip.Trigger>
						<Tooltip.Content>Filter tasks</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</div>
		</div>

		<Tabs.Root value={data.activeTab} class="w-full gap-3">
			<Tabs.List
				class="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/75 p-1 text-muted-foreground"
			>
				<Tabs.Trigger
					value="kanban"
					class="w-full justify-center font-display border-b-2 border-transparent data-[state=active]:border-orange-500"
					onclick={() => {
						if (data.activeTab !== 'kanban') {
							void openTaskTab('kanban');
						}
					}}
				>
					<SquareKanban class="size-4" />
					Kanban
				</Tabs.Trigger>
				<Tabs.Trigger
					value="agenda"
					class="w-full justify-center font-display border-b-2 border-transparent data-[state=active]:border-orange-500"
					onclick={() => {
						if (data.activeTab !== 'agenda') {
							void openTaskTab('agenda');
						}
					}}
				>
					<CalendarDays class="size-4" />
					Daily Agenda
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="kanban" class="mt-0 space-y-4">
				{#if data.activeTab === 'kanban'}
					<Collapsible.Root bind:open={filtersOpen}>
						<Collapsible.Content id="tasks-filter-bar" class="w-full">
							<div
								class="grid gap-4 rounded-3xl border border-orange-200/80 bg-orange-50/55 p-4 shadow-sm dark:border-orange-500/25 dark:bg-orange-500/8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
							>
								<div class="min-w-0 w-full">
									<div class="relative">
										<Search
											class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="task-keyword-filter"
											type="search"
											value={keywordDirty ? keyword : urlKeyword}
											oninput={handleKeywordInput}
											aria-label="Search tasks by keyword"
											placeholder="Search title or description"
											maxlength={200}
											class="h-10 bg-background/90 pl-9"
										/>
									</div>
								</div>

								<div class="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:justify-self-end">
									<div class="w-full lg:w-32 lg:shrink-0"><TaskPriorityFilter /></div>
									<div class="w-full lg:w-36 lg:shrink-0">
										<TaskTagFilter allTags={data.allTags} />
									</div>
								</div>
							</div>
						</Collapsible.Content>
					</Collapsible.Root>

					<div class="min-w-0 w-full sm:min-h-80"><TaskKanbanView tasks={data.tasks} /></div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="agenda" class="mt-0 min-w-0">
				{#if data.activeTab === 'agenda' && data.agenda}
					<DailyAgendaView agenda={data.agenda} bind:defaultsDialogOpen />
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</PageShell>
{/if}

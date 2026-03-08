<script lang="ts">
import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
import PlusIcon from '@lucide/svelte/icons/plus';

import { Button } from '$lib/components/ui/button';
import type { TaskState } from '$lib/schemas/task';

import TaskCard from './TaskCard.svelte';
import { type TaskSummary, taskStateOptions } from './task-ui';

interface Props {
	tasks: TaskSummary[];
}

let { tasks }: Props = $props();

let showDone = $state(false);

let tasksByState = $derived({
	new: tasks.filter((task) => task.state === 'new'),
	in_progress: tasks.filter((task) => task.state === 'in_progress'),
	on_hold: tasks.filter((task) => task.state === 'on_hold'),
	blocked: tasks.filter((task) => task.state === 'blocked'),
	done: tasks.filter((task) => task.state === 'done')
});

let columns = $derived([
	{
		...taskStateOptions[0],
		count: tasksByState.new.length
	},
	{
		...taskStateOptions[1],
		count: tasksByState.in_progress.length
	},
	{
		...taskStateOptions[2],
		count: tasksByState.on_hold.length
	},
	{
		...taskStateOptions[3],
		count: tasksByState.blocked.length
	},
	{
		...taskStateOptions[4],
		count: tasksByState.done.length
	}
]);

let visibleColumns = $derived(
	showDone ? columns : columns.filter((column) => column.value !== 'done')
);
let doneColumn = $derived(columns.find((column) => column.value === 'done') ?? columns[4]);
let desktopGridColumns = $derived(
	showDone
		? `repeat(${visibleColumns.length}, minmax(0, 1fr))`
		: `repeat(${visibleColumns.length}, minmax(0, 1fr)) 4.5rem`
);

const mobileDoneColumnId = 'tasks-done-column-mobile';
const desktopDoneColumnId = 'tasks-done-column-desktop';

// Handle state change via form submission
const handleStateChange = (taskId: string, newState: TaskState) => {
	const form = document.createElement('form');
	form.method = 'POST';
	form.action = '?/updateState';

	const idInput = document.createElement('input');
	idInput.type = 'hidden';
	idInput.name = 'id';
	idInput.value = taskId;

	const stateInput = document.createElement('input');
	stateInput.type = 'hidden';
	stateInput.name = 'state';
	stateInput.value = newState;

	form.appendChild(idInput);
	form.appendChild(stateInput);
	document.body.appendChild(form);
	form.submit();
};

const getCreateHref = (state: TaskState) => `/tasks/new?state=${state}`;
</script>

<div class="space-y-4 sm:hidden">
	{#each visibleColumns as column (column.value)}
		{@const isNewColumn = column.value === 'new'}
		{@const isDoneColumn = column.value === 'done'}
		<section id={isDoneColumn ? mobileDoneColumnId : undefined} class="space-y-2.5">
			<div
				class={[
				'overflow-hidden rounded-[1.25rem] border-[1.5px] px-3.5 py-3',
				column.headerClass
			]}
			>
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-baseline gap-2.5">
						<h3
							class="text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50"
						>
							{column.label}
						</h3>
						<span class="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
							({column.count})
						</span>
					</div>
					{#if isDoneColumn}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => (showDone = false)}
							aria-controls={mobileDoneColumnId}
							aria-expanded={showDone}
							class="h-7 rounded-full bg-white/80 px-2 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-white hover:text-slate-950 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-950"
						>
							<ChevronLeftIcon class="mr-1 size-4" />
							Collapse
						</Button>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-2.5">
				{#if isNewColumn}
					<Button
						href={getCreateHref(column.value)}
						variant="outline"
						class="h-9 w-full justify-start rounded-xl border border-dashed border-orange-300/80 bg-orange-50/75 px-3.5 text-[13px] font-semibold text-orange-700 shadow-none hover:bg-orange-100/80 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/15"
					>
						<PlusIcon class="mr-2 size-4" />
						Add task
					</Button>
				{/if}

				{#each tasksByState[column.value] as task (task.id)}
					<TaskCard {task} onStateChange={(newState) => handleStateChange(task.id, newState)} />
				{/each}

				{#if tasksByState[column.value].length === 0}
					<div
						class={`rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground ${column.emptyClass}`}
					>
						No {column.label.toLowerCase()} tasks yet.
					</div>
				{/if}
			</div>
		</section>
	{/each}

	{#if !showDone}
		<Button
			type="button"
			variant="outline"
			onclick={() => (showDone = true)}
			aria-controls={mobileDoneColumnId}
			aria-expanded={showDone}
			class={[
				'h-12 w-full justify-between rounded-[1.25rem] border-[1.5px] px-3.5 text-left shadow-none',
				doneColumn.headerClass
			]}
		>
			<span class="flex items-baseline gap-2.5">
				<span
					class="text-[1.02rem] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50"
				>
					Done
				</span>
				<span class="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
					({doneColumn.count})
				</span>
			</span>
			<span
				class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
			>
				Show
				<ChevronRightIcon class="size-4" />
			</span>
		</Button>
	{/if}
</div>

<div
	class="hidden min-w-0 gap-2 pb-2 sm:grid"
	style={`grid-template-columns: ${desktopGridColumns};`}
>
	{#each visibleColumns as column (column.value)}
		{@const isNewColumn = column.value === 'new'}
		{@const isDoneColumn = column.value === 'done'}
		<section
			id={isDoneColumn ? desktopDoneColumnId : undefined}
			class="flex min-w-0 flex-col gap-2.5"
		>
			<div
				class={[
				'overflow-hidden rounded-[1.3rem] border-[1.5px] px-4 py-3.5',
				column.headerClass
			]}
			>
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-baseline gap-2.5">
						<h3
							class="text-[1.04rem] font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50"
						>
							{column.label}
						</h3>
						<span class="text-sm font-semibold text-slate-500 dark:text-slate-400">
							({column.count})
						</span>
					</div>

					{#if isDoneColumn}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => (showDone = false)}
							aria-controls={desktopDoneColumnId}
							aria-expanded={showDone}
							class="h-7 rounded-full bg-white/80 px-2 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-white hover:text-slate-950 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-950"
						>
							<ChevronLeftIcon class="mr-1 size-4" />
							Collapse
						</Button>
					{/if}
				</div>
			</div>

			<div class="flex flex-1 flex-col gap-2.5">
				{#if isNewColumn}
					<Button
						href={getCreateHref(column.value)}
						variant="outline"
						class="h-9 w-full justify-start rounded-xl border border-dashed border-orange-300/80 bg-orange-50/75 px-3.5 text-[13px] font-semibold text-orange-700 shadow-none hover:bg-orange-100/80 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/15"
					>
						<PlusIcon class="mr-2 size-4" />
						Add task
					</Button>
				{/if}

				{#each tasksByState[column.value] as task (task.id)}
					<TaskCard {task} onStateChange={(newState) => handleStateChange(task.id, newState)} />
				{/each}

				{#if tasksByState[column.value].length === 0}
					<div
						class={`rounded-xl border border-dashed p-4.5 text-center text-sm text-muted-foreground ${column.emptyClass}`}
					>
						No {column.label.toLowerCase()} tasks yet.
					</div>
				{/if}
			</div>
		</section>
	{/each}

	{#if !showDone}
		<button
			type="button"
			onclick={() => (showDone = true)}
			aria-controls={desktopDoneColumnId}
			aria-expanded={showDone}
			class={[
				'group flex h-full w-18 min-w-0 flex-col items-center justify-between rounded-3xl border-[1.5px] px-2 py-3.5 text-center shadow-none transition-transform hover:-translate-y-0.5',
				doneColumn.headerClass
			]}
		>
			<span
				class="rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-slate-950/75 dark:text-slate-200"
			>
				{doneColumn.count}
			</span>
			<span
				class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-100"
			>
				Done
			</span>
			<span
				class="flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
			>
				<ChevronRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
				Show
			</span>
		</button>
	{/if}
</div>

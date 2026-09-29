<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import type { TaskState } from '$lib/schemas/task';
	import { ChevronLeft, ChevronRight, Plus } from '@lucide/svelte/icons';
	import type { DndEvent } from 'svelte-dnd-action';
	import { dndzone } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';

	import Confetti from '../shared/Confetti.svelte';
	import { type TaskSummary, taskStateOptions } from './task-ui';
	import TaskCard from './TaskCard.svelte';

	interface Props {
		tasks: TaskSummary[];
	}

	type BoardTasksByState = Record<TaskState, TaskSummary[]>;
	type TaskBoardDndEvent = CustomEvent<DndEvent<TaskSummary>>;
	type MoveBoardTaskPayload = {
		id: string;
		fromState: TaskState;
		toState: TaskState;
		toIndex: number;
	};

	const taskStateOrder: TaskState[] = ['new', 'in_progress', 'on_hold', 'blocked', 'done'];
	const flipDurationMs = 180;
	const touchStartDelayMs = 120;

	let { tasks }: Props = $props();

	const isMobileQuery = new IsMobile();

	let showDone = $state(false);
	let boardTasks = $derived(createBoardTasksByState(tasks));
	let isDragging = $state(false);
	let isSavingMove = $state(false);
	let dragSnapshot = $state<BoardTasksByState | null>(null);
	let celebrationBurstId = $state(0);

	let isMobileLayout = $derived(isMobileQuery.current);

	let columns = $derived([
		{
			...taskStateOptions[0],
			count: boardTasks.new.length
		},
		{
			...taskStateOptions[1],
			count: boardTasks.in_progress.length
		},
		{
			...taskStateOptions[2],
			count: boardTasks.on_hold.length
		},
		{
			...taskStateOptions[3],
			count: boardTasks.blocked.length
		},
		{
			...taskStateOptions[4],
			count: boardTasks.done.length
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

	function createEmptyBoardTasksByState(): BoardTasksByState {
		return {
			new: [],
			in_progress: [],
			on_hold: [],
			blocked: [],
			done: []
		};
	}

	function createBoardTasksByState(taskList: TaskSummary[]): BoardTasksByState {
		const nextBoardTasks = createEmptyBoardTasksByState();

		for (const state of taskStateOrder) {
			const tasksForState = taskList.filter((task) => task.state === state);
			tasksForState.sort((left, right) => {
				if (left.sortOrder !== right.sortOrder) {
					return left.sortOrder - right.sortOrder;
				}

				return left.taskNumber - right.taskNumber;
			});
			nextBoardTasks[state] = tasksForState;
		}

		return nextBoardTasks;
	}

	function cloneBoardTasksByState(source: BoardTasksByState): BoardTasksByState {
		return {
			new: [...source.new],
			in_progress: [...source.in_progress],
			on_hold: [...source.on_hold],
			blocked: [...source.blocked],
			done: [...source.done]
		};
	}

	function findTaskState(board: BoardTasksByState, taskId: string): TaskState | null {
		for (const state of taskStateOrder) {
			if (board[state].some((task) => task.id === taskId)) {
				return state;
			}
		}

		return null;
	}

	function getDndZoneOptions(items: TaskSummary[]) {
		return {
			items,
			flipDurationMs,
			type: 'task-board',
			dragDisabled: isSavingMove,
			useCursorForDetection: true,
			dropTargetClasses: [
				'ring-2',
				'ring-pen-tasks/35',
				'ring-offset-2',
				'ring-offset-background',
				'',
				'dark:ring-pen-tasks/45',
				''
			],
			delayTouchStart: touchStartDelayMs
		};
	}

	function updateBoardColumnTasks(state: TaskState, items: TaskSummary[]) {
		boardTasks = {
			...boardTasks,
			[state]: [...items]
		};
	}

	async function submitBoardMove(payload: MoveBoardTaskPayload): Promise<Response> {
		const formData = new FormData();
		formData.set('id', payload.id);
		formData.set('fromState', payload.fromState);
		formData.set('toState', payload.toState);
		formData.set('toIndex', String(payload.toIndex));

		return fetch('?/moveBoardTask', {
			method: 'POST',
			body: formData
		});
	}

	async function persistBoardMove(payload: MoveBoardTaskPayload, snapshot: BoardTasksByState) {
		isSavingMove = true;

		try {
			const response = await submitBoardMove(payload);
			if (!response.ok) {
				throw new Error('move-failed');
			}

			if (payload.fromState !== 'done' && payload.toState === 'done') {
				makeConfettiBurst();
			}
		} catch {
			boardTasks = cloneBoardTasksByState(snapshot);
			toast.error('Could not save task move. The board was restored.');
		} finally {
			isSavingMove = false;
		}
	}

	function handleColumnConsider(state: TaskState, event: TaskBoardDndEvent) {
		if (!isDragging) {
			dragSnapshot = cloneBoardTasksByState(boardTasks);
			isDragging = true;
		}

		updateBoardColumnTasks(state, event.detail.items);
	}

	async function handleColumnFinalize(state: TaskState, event: TaskBoardDndEvent) {
		const nextStateTasks = [...event.detail.items];
		updateBoardColumnTasks(state, nextStateTasks);

		const movedTaskId = String(event.detail.info.id ?? '');
		if (!movedTaskId || isSavingMove) {
			return;
		}

		const toIndex = nextStateTasks.findIndex((task) => task.id === movedTaskId);
		if (toIndex === -1) {
			return;
		}

		const snapshot = dragSnapshot
			? cloneBoardTasksByState(dragSnapshot)
			: cloneBoardTasksByState(boardTasks);
		const fromState = findTaskState(snapshot, movedTaskId);
		if (!fromState) {
			return;
		}

		const movedTask = nextStateTasks[toIndex];
		if (movedTask && movedTask.state !== state) {
			nextStateTasks[toIndex] = {
				...movedTask,
				state
			};
			updateBoardColumnTasks(state, nextStateTasks);
		}

		await persistBoardMove(
			{
				id: movedTaskId,
				fromState,
				toState: state,
				toIndex
			},
			snapshot
		);

		isDragging = false;
		dragSnapshot = null;
	}

	async function submitStateChange(taskId: string, newState: TaskState): Promise<Response> {
		const formData = new FormData();
		formData.set('id', taskId);
		formData.set('state', newState);

		return fetch('?/updateState', {
			method: 'POST',
			body: formData
		});
	}

	async function handleStateChange(taskId: string, newState: TaskState, previousState: TaskState) {
		if (isSavingMove || previousState === newState) {
			return;
		}

		isSavingMove = true;

		try {
			const response = await submitStateChange(taskId, newState);
			if (!response.ok) {
				throw new Error('update-failed');
			}

			if (previousState !== 'done' && newState === 'done') {
				makeConfettiBurst();
			}

			await invalidateAll();
		} catch {
			toast.error('Could not update the task state. Please try again.');
		} finally {
			isSavingMove = false;
		}
	}

	function makeConfettiBurst() {
		celebrationBurstId += 1;
	}

	const getCreateHref = (state: TaskState) => `/tasks/new?state=${state}`;
</script>

{#if isMobileLayout}
	<div class="space-y-4">
		{#each visibleColumns as column (column.value)}
			{@const isNewColumn = column.value === 'new'}
			{@const isDoneColumn = column.value === 'done'}
			<section id={isDoneColumn ? mobileDoneColumnId : undefined} class="space-y-2.5">
				<div
					class={['overflow-hidden rounded-[3px] border-[1.5px] px-3.5 py-3', column.headerClass]}
				>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-baseline gap-2.5">
							<h3
								class="text-foreground dark:text-foreground text-[1.04rem] font-semibold tracking-[-0.02em]"
							>
								{column.label}
							</h3>
							<span
								class="text-muted-foreground dark:text-muted-foreground text-[13px] font-semibold"
							>
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
								class="bg-card text-muted-foreground hover:bg-card hover:text-foreground dark:bg-muted/70 dark:text-foreground dark:hover:bg-muted h-7 rounded-[2px] px-2 text-[11px] font-semibold"
							>
								<ChevronLeft class="mr-1 size-4" />
							</Button>
						{/if}
					</div>
				</div>

				<div class="flex flex-col gap-2.5">
					{#if isNewColumn}
						<Button
							href={getCreateHref(column.value)}
							variant="outline"
							class="border-pen-tasks/35 bg-pen-tasks/10 text-pen-tasks hover:bg-pen-tasks/10 dark:border-pen-tasks/40 dark:bg-pen-tasks/10 dark:text-pen-tasks dark:hover:bg-pen-tasks/15 h-9 w-full justify-start rounded-xl border border-dashed px-3.5 text-[13px] font-semibold"
						>
							<Plus class="mr-2 size-4" />
							Add task
						</Button>
					{/if}

					<div class="relative">
						<div
							class={[
								'dark: flex min-h-28 flex-col gap-2.5 overflow-hidden rounded-[3px] border-[1.5px] border-dashed p-3 transition-[border-color,background-color,box-shadow]',
								column.emptyClass
							]}
							use:dndzone={getDndZoneOptions(boardTasks[column.value])}
							onconsider={(event) => handleColumnConsider(column.value, event)}
							onfinalize={(event) => void handleColumnFinalize(column.value, event)}
							aria-label={`${column.label} tasks`}
						>
							{#each boardTasks[column.value] as task (task.id)}
								<div animate:flip={{ duration: flipDurationMs }} aria-label={task.title}>
									<TaskCard
										{task}
										onStateChange={(newState) =>
											void handleStateChange(task.id, newState, task.state)}
									/>
								</div>
							{/each}
						</div>

						{#if boardTasks[column.value].length === 0}
							<div
								class="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium"
							>
								No {column.label.toLowerCase()} tasks yet.
							</div>
						{/if}
					</div>
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
					'h-12 w-full justify-between rounded-[3px] border-[1.5px] px-3.5 text-left',
					doneColumn.headerClass
				]}
			>
				<span class="flex items-baseline gap-2.5">
					<span
						class="text-foreground dark:text-foreground text-[1.02rem] font-semibold tracking-[-0.02em]"
					>
						Done
					</span>
					<span class="text-muted-foreground dark:text-muted-foreground text-[13px] font-semibold">
						({doneColumn.count})
					</span>
				</span>
				<span
					class="text-muted-foreground dark:text-muted-foreground inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
				>
					Show
					<ChevronRight class="size-4" />
				</span>
			</Button>
		{/if}
	</div>
{:else}
	<div
		class="min-h-[calc(100dvh-15rem)] min-w-0 gap-2 pb-2 sm:grid"
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
					class={['overflow-hidden rounded-[3px] border-[1.5px] px-4 py-3.5', column.headerClass]}
				>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-baseline gap-2.5">
							<h3
								class="text-foreground dark:text-foreground text-[1.04rem] font-semibold tracking-[-0.02em]"
							>
								{column.label}
							</h3>
							<span class="text-muted-foreground dark:text-muted-foreground text-sm font-semibold">
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
								class="bg-card text-muted-foreground hover:bg-card hover:text-foreground dark:bg-muted/70 dark:text-foreground dark:hover:bg-muted h-7 rounded-[2px] px-2 text-[11px] font-semibold"
							>
								<ChevronLeft class="mr-1 size-4" />
							</Button>
						{/if}
					</div>
				</div>

				<div class="flex flex-1 flex-col gap-2.5">
					{#if isNewColumn}
						<Button
							href={getCreateHref(column.value)}
							variant="outline"
							class="border-pen-tasks/35 bg-pen-tasks/10 text-pen-tasks hover:bg-pen-tasks/10 dark:border-pen-tasks/40 dark:bg-pen-tasks/10 dark:text-pen-tasks dark:hover:bg-pen-tasks/15 h-9 w-full justify-start rounded-xl border border-dashed px-3.5 text-[13px] font-semibold"
						>
							<Plus class="mr-2 size-4" />
							Add task
						</Button>
					{/if}

					<div class="relative min-h-[calc(100dvh-20rem)] flex-1">
						<div
							class={[
								'dark: flex h-full min-h-full flex-col gap-2.5 overflow-hidden rounded-[3px] border-[1.5px] border-dashed p-3 transition-[border-color,background-color,box-shadow]',
								column.emptyClass
							]}
							use:dndzone={getDndZoneOptions(boardTasks[column.value])}
							onconsider={(event) => handleColumnConsider(column.value, event)}
							onfinalize={(event) => void handleColumnFinalize(column.value, event)}
							aria-label={`${column.label} tasks`}
						>
							{#each boardTasks[column.value] as task (task.id)}
								<div animate:flip={{ duration: flipDurationMs }} aria-label={task.title}>
									<TaskCard
										{task}
										onStateChange={(newState) =>
											void handleStateChange(task.id, newState, task.state)}
									/>
								</div>
							{/each}
						</div>

						{#if boardTasks[column.value].length === 0}
							<div
								class="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center p-5 text-center text-sm font-medium"
							>
								No {column.label.toLowerCase()} tasks yet.
							</div>
						{/if}
					</div>
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
					'group flex h-full w-18 min-w-0 flex-col items-center justify-between rounded-3xl border-[1.5px] px-2 py-3.5 text-center transition-transform hover:-translate-y-0.5',
					doneColumn.headerClass
				]}
			>
				<span
					class="bg-background/90 text-muted-foreground dark:bg-muted/75 dark:text-foreground rounded-[2px] px-2 py-0.5 text-[11px] font-semibold"
				>
					{doneColumn.count}
				</span>
				<span
					class="text-foreground dark:text-foreground text-[10px] font-semibold tracking-[0.18em] uppercase"
				>
					Done
				</span>
				<span
					class="text-muted-foreground dark:text-muted-foreground flex flex-col items-center gap-1 text-[9px] font-semibold tracking-[0.14em] uppercase"
				>
					<ChevronRight class="size-4 transition-transform group-hover:translate-x-0.5" />
				</span>
			</button>
		{/if}
	</div>
{/if}

<Confetti burstId={celebrationBurstId} />

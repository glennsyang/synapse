<script lang="ts">
import type { TaskState } from '$lib/schemas/task';

import TaskCard from './TaskCard.svelte';
import { type TaskSummary, taskStateOptions } from './task-ui';

interface Props {
	tasks: TaskSummary[];
}

let { tasks }: Props = $props();

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
</script>

<div class="grid gap-4 xl:grid-cols-5">
	{#each columns as column (column.value)}
		<div class="flex min-w-0 flex-col gap-4">
			<div class={`rounded-lg border border-b-4 p-3 ${column.headerClass}`}>
				<div class="flex items-center justify-between gap-3">
					<div class="flex items-center gap-2">
						<span class={`h-2.5 w-2.5 rounded-full ${column.dotClass}`}></span>
						<h3 class="font-display font-semibold">{column.label}</h3>
					</div>
					<span
						class="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-black/20"
					>
						{column.count}
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				{#each tasksByState[column.value] as task (task.id)}
					<TaskCard {task} onStateChange={(newState) => handleStateChange(task.id, newState)} />
				{/each}

				{#if tasksByState[column.value].length === 0}
					<div
						class={`rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground ${column.emptyClass}`}
					>
						No {column.label.toLowerCase()} tasks
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

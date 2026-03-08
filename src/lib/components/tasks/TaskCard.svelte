<script lang="ts">
import CalendarIcon from '@lucide/svelte/icons/calendar';
import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
import CircleIcon from '@lucide/svelte/icons/circle';
import CircleMinusIcon from '@lucide/svelte/icons/circle-minus';
import ClockIcon from '@lucide/svelte/icons/clock';
import PauseCircleIcon from '@lucide/svelte/icons/pause-circle';
import {
	getTaskStateLabel,
	type TaskPriority,
	type TaskSummary,
	taskPriorityMeta,
	taskStateMeta
} from '$lib/components/tasks/task-ui';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import type { TaskState } from '$lib/schemas/task';

interface Props {
	task: TaskSummary;
	onStateChange?: (newState: TaskState) => void;
}

let { task, onStateChange }: Props = $props();

const stateIcons = {
	new: CircleIcon,
	in_progress: ClockIcon,
	on_hold: PauseCircleIcon,
	blocked: CircleMinusIcon,
	done: CheckCircleIcon
};

let priorityMeta = $derived(taskPriorityMeta[task.priority as TaskPriority] ?? taskPriorityMeta[4]);
let stateMeta = $derived(taskStateMeta[task.state]);
let isNewTask = $derived(task.state === 'new');
let isDoneTask = $derived(task.state === 'done');
const StateIcon = $derived(stateIcons[task.state]);
</script>

<Card.Root
	class={`border transition-shadow hover:shadow-md ${isNewTask ? 'border-slate-300/80 bg-slate-50/85 dark:border-slate-800 dark:bg-slate-950/55' : ''}`}
>
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<div class="flex-1">
				<Card.Title class={`font-display text-lg ${isDoneTask ? 'line-through opacity-50' : ''}`}>
					<a href={`/tasks/${task.id}/edit`} class="transition-colors hover:underline">
						{task.title}
					</a>
				</Card.Title>
				{#if task.description}
					<p
						class={`mt-1 line-clamp-3 text-sm text-muted-foreground ${isDoneTask ? 'opacity-50' : ''}`}
					>
						{task.description}
					</p>
				{/if}
			</div>
			<div class={`flex flex-col items-end gap-1 ${isDoneTask ? 'opacity-60' : ''}`}>
				<Badge variant="outline" class={`gap-2 ${priorityMeta.badgeClass}`}>
					<span class={`h-2.5 w-2.5 rounded-full ${priorityMeta.dotClass}`}></span>
					<span>{priorityMeta.valueLabel}</span>
				</Badge>
			</div>
		</div>
	</Card.Header>

	<Card.Content class={`pb-3 ${isDoneTask ? 'opacity-50' : ''}`}>
		<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
			<Badge variant="outline" class={`gap-1 ${stateMeta.badgeClass}`}>
				<StateIcon class="h-3 w-3" />
				{getTaskStateLabel(task.state)}
			</Badge>

			{#if task.dueDate}
				<div class="flex items-center gap-1">
					<CalendarIcon class="h-3 w-3" />
					<span>{new Date(task.dueDate).toLocaleDateString()}</span>
				</div>
			{/if}
		</div>

		{#if task.tags && task.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each task.tags as tag (tag)}
					<Badge variant="secondary" class="text-xs">{tag}</Badge>
				{/each}
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="pt-0">
		<div class="flex w-full gap-2">
			<Button variant="outline" size="sm" href={`/tasks/${task.id}/edit`} class="flex-1">
				Edit
			</Button>
			{#if onStateChange && task.state !== 'done'}
				<Button
					variant="default"
					size="sm"
					onclick={() => onStateChange?.('done')}
					class="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600/80 dark:hover:bg-emerald-500/80"
				>
					Mark Done
				</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>

<script lang="ts">
	import { goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import {
		formatTaskDisplayId,
		type TaskPriority,
		type TaskSummary,
		taskPriorityMeta
	} from '$lib/components/tasks/task-ui';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { TaskState } from '$lib/schemas/task';
	import { formatDateHeuristic, getDateUrgencyStatus } from '$lib/utils/date';
	import { Calendar, CircleCheck, EllipsisVertical, Pencil, Trash2 } from '@lucide/svelte/icons';

	interface Props {
		task: TaskSummary;
		onStateChange?: (newState: TaskState) => void;
		deleteAction?: string;
	}

	let { task, onStateChange, deleteAction = '?/delete' }: Props = $props();

	let openDeleteTaskDialog = $state(false);

	let priorityMeta = $derived(
		taskPriorityMeta[task.priority as TaskPriority] ?? taskPriorityMeta[4]
	);
	let displayId = $derived(formatTaskDisplayId(task.taskNumber));
	let editHref = $derived(`/tasks/${task.id}/edit`);
	let isDoneTask = $derived(task.state === 'done');
	let isBlockedTask = $derived(task.state === 'blocked');
	let dueDateLabel = $derived(task.dueDate ? formatDateHeuristic(task.dueDate) : null);
	let dueDateStatus = $derived(getDateUrgencyStatus(task.dueDate));
	let hasFooterMeta = $derived(Boolean(dueDateLabel) || Boolean(task.tags?.length));
	let dueDateClass = $derived(
		dueDateStatus === 'overdue'
			? 'text-destructive dark:text-destructive'
			: dueDateStatus === 'today'
				? 'text-pen-tasks dark:text-pen-tasks'
				: 'text-muted-foreground'
	);
</script>

<article
	class={[
		'group bg-background/95 hover:border-border/80 dark:border-border/80 dark:bg-muted/75 dark:hover:border-border/80 relative overflow-hidden rounded-2xl border-[0.5px] p-3.5 pl-4 transition-colors',
		isBlockedTask &&
			'border-destructive/35 dark:border-destructive/35 bg-[repeating-linear-gradient(-45deg,rgba(248,113,113,0.06)_0px,rgba(248,113,113,0.06)_8px,transparent_8px,transparent_16px)] dark:bg-[repeating-linear-gradient(-45deg,rgba(248,113,113,0.09)_0px,rgba(248,113,113,0.09)_8px,rgba(2,6,23,0.78)_8px,rgba(2,6,23,0.78)_16px)]',
		isDoneTask && 'opacity-85'
	]}
>
	<div class="flex items-start justify-between gap-2">
		<div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
			<span
				class="text-muted-foreground font-mono text-[10px] font-semibold tracking-[0.22em] uppercase"
			>
				{displayId}
			</span>
			<Badge
				variant="outline"
				class={[
					'h-5 rounded-[2px] px-2 text-[10px] font-semibold tracking-[0.14em] uppercase',
					priorityMeta.badgeClass
				]}
			>
				{priorityMeta.label}
			</Badge>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						class="text-muted-foreground hover:text-foreground size-7 rounded-full"
						aria-label={`More actions for ${task.title}`}
					>
						<EllipsisVertical class="size-4" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" sideOffset={6} class="w-48 rounded-xl">
				<DropdownMenu.Item onclick={() => goto(editHref)}>
					<Pencil class="size-4" />
					<span>Edit task</span>
				</DropdownMenu.Item>
				{#if onStateChange && task.state !== 'done'}
					<DropdownMenu.Item onclick={() => onStateChange?.('done')}>
						<CircleCheck class="size-4" />
						<span>Mark done</span>
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Separator />
				<DropdownMenu.Item variant="destructive" onclick={() => (openDeleteTaskDialog = true)}>
					<Trash2 class="size-4" />
					<span>Delete task</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<div class="mt-2.5 space-y-1.5">
		<a
			href={editHref}
			class="text-foreground hover:text-pen-tasks dark:hover:text-pen-tasks block text-[15px] leading-5 font-semibold transition-colors hover:underline"
		>
			{task.title}
		</a>

		{#if task.description}
			<p class="text-muted-foreground line-clamp-2 text-[13px] leading-5">{task.description}</p>
		{/if}
	</div>

	{#if hasFooterMeta}
		<div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
			{#if dueDateLabel}
				<span
					class={[
						'border-border/80 bg-muted/80 dark:border-border dark:bg-muted/80 inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 font-medium',
						dueDateClass
					]}
				>
					<Calendar class="size-3" />
					{dueDateLabel}
				</span>
			{/if}

			{#if task.tags && task.tags.length > 0}
				{#each task.tags as tag (tag)}
					<Badge variant="secondary" class="rounded-[2px] px-2 py-0.5 text-[10px] font-medium">
						{tag}
					</Badge>
				{/each}
			{/if}
		</div>
	{/if}
</article>

<ConfirmDialog
	bind:open={openDeleteTaskDialog}
	title={`Delete ${displayId}`}
	message={`Delete "${task.title}"? This action cannot be undone.`}
	confirmButtonText="Delete"
	id={task.id}
	actionUrl={deleteAction}
/>

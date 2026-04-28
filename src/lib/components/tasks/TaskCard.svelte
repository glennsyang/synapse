<script lang="ts">
	import { Calendar, CircleCheck, EllipsisVertical, Pencil, Trash2 } from '@lucide/svelte/icons';
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
	import { formatDateMedium, getDateUrgencyStatus } from '$lib/utils/date';

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
	let dueDateLabel = $derived(task.dueDate ? formatDateMedium(task.dueDate) : null);
	let dueDateStatus = $derived(getDateUrgencyStatus(task.dueDate));
	let hasFooterMeta = $derived(Boolean(dueDateLabel) || Boolean(task.tags?.length));
	let dueDateClass = $derived(
		dueDateStatus === 'overdue'
			? 'text-red-600 dark:text-red-300'
			: dueDateStatus === 'today'
				? 'text-orange-600 dark:text-orange-300'
				: 'text-muted-foreground'
	);
</script>

<article
	class={[
		'group relative overflow-hidden rounded-2xl border-[0.5px] bg-background/95 p-3.5 pl-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-colors hover:border-slate-300/80 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-950/75 dark:hover:border-slate-700/80',
		isBlockedTask &&
			'border-red-200/80 bg-[repeating-linear-gradient(-45deg,rgba(248,113,113,0.06)_0px,rgba(248,113,113,0.06)_8px,transparent_8px,transparent_16px)] dark:border-red-900/60 dark:bg-[repeating-linear-gradient(-45deg,rgba(248,113,113,0.09)_0px,rgba(248,113,113,0.09)_8px,rgba(2,6,23,0.78)_8px,rgba(2,6,23,0.78)_16px)]',
		isDoneTask && 'opacity-85'
	]}
>
	<span class={['absolute inset-y-0 left-0 w-1', priorityMeta.railClass]}></span>

	<div class="flex items-start justify-between gap-2">
		<div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
			<span
				class="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
			>
				{displayId}
			</span>
			<Badge
				variant="outline"
				class={[
					'h-5 rounded-full px-2 text-[10px] font-semibold uppercase tracking-[0.14em]',
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
						class="size-7 rounded-full text-muted-foreground hover:text-foreground"
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
			class="block text-[15px] font-semibold leading-5 text-foreground transition-colors hover:text-orange-700 hover:underline dark:hover:text-orange-300"
		>
			{task.title}
		</a>

		{#if task.description}
			<p class="line-clamp-2 text-[13px] leading-5 text-muted-foreground">{task.description}</p>
		{/if}
	</div>

	{#if hasFooterMeta}
		<div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
			{#if dueDateLabel}
				<span
					class={[
						'inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 font-medium dark:border-slate-800 dark:bg-slate-900/80',
						dueDateClass
					]}
				>
					<Calendar class="size-3" />
					{dueDateLabel}
				</span>
			{/if}

			{#if task.tags && task.tags.length > 0}
				{#each task.tags as tag (tag)}
					<Badge variant="secondary" class="rounded-full px-2 py-0.5 text-[10px] font-medium">
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

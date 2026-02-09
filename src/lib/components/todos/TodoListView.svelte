<script lang="ts">
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FolderOpen from '@lucide/svelte/icons/folder-open';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import type { Project } from '$lib/server/db/types';

	interface Props {
		todos: Array<{
			id: string;
			title: string;
			state: string;
			cadence: string;
			priority: number;
			dueDate: string | null;
			project: Project | null;
			tags: string[] | null;
		}>;
	}

	let { todos }: Props = $props();

	// Priority labels
	const priorityLabels = {
		1: 'Highest',
		2: 'High',
		3: 'Medium',
		4: 'Low'
	};

	// State icons
	const stateIcons = {
		new: CircleIcon,
		in_progress: ClockIcon,
		blocked: CircleIcon,
		done: CheckCircle2Icon
	};

	const stateBadgeVariant = {
		new: 'secondary',
		in_progress: 'default',
		blocked: 'destructive',
		done: 'outline'
	} as const;
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-12">Status</Table.Head>
				<Table.Head>Title</Table.Head>
				<Table.Head>Cadence</Table.Head>
				<Table.Head>Project</Table.Head>
				<Table.Head>Priority</Table.Head>
				<Table.Head>Due Date</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if todos.length === 0}
				<Table.Row>
					<Table.Cell colspan={7} class="h-24 text-center text-muted-foreground">
						No todos found. Create your first todo to get started!
					</Table.Cell>
				</Table.Row>
			{:else}
				{#each todos as todo (todo.id)}
					{@const StateIcon = stateIcons[todo.state as keyof typeof stateIcons]}
					<Table.Row>
						<Table.Cell>
							<Badge
								variant={stateBadgeVariant[todo.state as keyof typeof stateBadgeVariant]}
								class="gap-1"
							>
								<StateIcon class="h-3 w-3" />
							</Badge>
						</Table.Cell>
						<Table.Cell class="font-medium">
							<a href={`/todos/${todo.id}`} class="hover:underline">
								{todo.title}
							</a>
							{#if todo.tags && todo.tags.length > 0}
								<div class="mt-1 flex gap-1">
									{#each todo.tags.slice(0, 3) as tag (tag)}
										<Badge variant="secondary" class="text-xs">{tag}</Badge>
									{/each}
									{#if todo.tags.length > 3}
										<Badge variant="secondary" class="text-xs">
											+{todo.tags.length - 3}
										</Badge>
									{/if}
								</div>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<Badge variant="outline">{todo.cadence}</Badge>
						</Table.Cell>
						<Table.Cell>
							{#if todo.project}
								<div
									class="flex items-center gap-1 text-sm"
									style="color: {todo.project.color || 'currentColor'}"
								>
									<FolderOpen class="h-3 w-3" />
									{todo.project.name}
								</div>
							{:else}
								<span class="text-sm text-muted-foreground">—</span>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<span class="text-sm">
								{priorityLabels[todo.priority as keyof typeof priorityLabels]}
							</span>
						</Table.Cell>
						<Table.Cell>
							{#if todo.dueDate}
								<span class="text-sm">{new Date(todo.dueDate).toLocaleDateString()}</span>
							{:else}
								<span class="text-sm text-muted-foreground">—</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="text-right">
							<Button variant="ghost" size="sm" href={`/todos/${todo.id}/edit`}>Edit</Button>
						</Table.Cell>
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
</div>

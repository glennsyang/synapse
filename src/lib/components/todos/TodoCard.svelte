<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import type { Project } from '$lib/server/db/types';

	interface Props {
		todo: {
			id: string;
			title: string;
			description: string | null;
			state: string;
			cadence: string;
			dueDate: string | null;
			priority: number;
			project: Project | null;
			tags: string[] | null;
			subSteps: Array<{ title: string; completed: boolean }> | null;
		};
		onStateChange?: (newState: string) => void;
	}

	let { todo, onStateChange }: Props = $props();

	// Calculate sub-steps progress
	let completedSubSteps = $derived(
		todo.subSteps ? todo.subSteps.filter((s) => s.completed).length : 0
	);
	let totalSubSteps = $derived(todo.subSteps?.length || 0);
	let subStepsProgress = $derived(
		totalSubSteps > 0 ? (completedSubSteps / totalSubSteps) * 100 : 0
	);

	// Priority color mapping
	const priorityColors = {
		1: 'bg-red-500',
		2: 'bg-orange-500',
		3: 'bg-yellow-500',
		4: 'bg-green-500'
	};

	// State badges
	const stateBadgeVariant = {
		new: 'secondary',
		in_progress: 'default',
		blocked: 'destructive',
		done: 'outline'
	} as const;

	const stateIcons = {
		new: CircleIcon,
		in_progress: ClockIcon,
		blocked: CircleIcon,
		done: CheckCircle2Icon
	};

	const StateIcon = $derived(stateIcons[todo.state as keyof typeof stateIcons]);
</script>

<Card.Root class="transition-shadow hover:shadow-md">
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<Card.Title class="text-lg">
					<a href={`/todos/${todo.id}`} class="hover:underline">
						{todo.title}
					</a>
				</Card.Title>
				{#if todo.description}
					<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{todo.description}</p>
				{/if}
			</div>
			<div
				class={`h-2 w-2 rounded-full ${priorityColors[todo.priority as keyof typeof priorityColors]}`}
				title={`Priority ${todo.priority}`}
			></div>
		</div>
	</Card.Header>

	<Card.Content class="pb-3">
		<!-- Metadata row -->
		<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
			<!-- State Badge -->
			<Badge
				variant={stateBadgeVariant[todo.state as keyof typeof stateBadgeVariant]}
				class="gap-1"
			>
				<StateIcon class="h-3 w-3" />
				{todo.state.replace('_', ' ')}
			</Badge>

			<!-- Cadence -->
			<Badge variant="outline">{todo.cadence}</Badge>

			<!-- Project -->
			{#if todo.project}
				<div class="flex items-center gap-1">
					<FolderOpenIcon class="h-3 w-3" />
					<span style="color: {todo.project.color || 'currentColor'}">{todo.project.name}</span>
				</div>
			{/if}

			<!-- Due Date -->
			{#if todo.dueDate}
				<div class="flex items-center gap-1">
					<CalendarIcon class="h-3 w-3" />
					<span>{new Date(todo.dueDate).toLocaleDateString()}</span>
				</div>
			{/if}
		</div>

		<!-- Tags -->
		{#if todo.tags && todo.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each todo.tags as tag (tag)}
					<Badge variant="secondary" class="text-xs">{tag}</Badge>
				{/each}
			</div>
		{/if}

		<!-- Sub-steps Progress -->
		{#if totalSubSteps > 0}
			<div class="mt-3">
				<div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
					<span>Sub-steps</span>
					<span>{completedSubSteps} / {totalSubSteps}</span>
				</div>
				<Progress value={subStepsProgress} class="h-1" />
			</div>
		{/if}
	</Card.Content>

	<Card.Footer class="pt-0">
		<div class="flex w-full gap-2">
			<Button variant="outline" size="sm" href={`/todos/${todo.id}/edit`} class="flex-1">
				Edit
			</Button>
			{#if onStateChange && todo.state !== 'done'}
				<Button variant="default" size="sm" onclick={() => onStateChange?.('done')} class="flex-1">
					Complete
				</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>

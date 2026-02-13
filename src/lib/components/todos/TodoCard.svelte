<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleMinusIcon from '@lucide/svelte/icons/circle-minus';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import PauseCircleIcon from '@lucide/svelte/icons/pause-circle';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		todo: {
			id: string;
			title: string;
			description: string | null;
			state: string;
			cadence: string | null;
			dueDate: string | null;
			priority: number;
			tags: string[] | null;
		};
		onStateChange?: (newState: string) => void;
	}

	let { todo, onStateChange }: Props = $props();

	// Priority color mapping (larger, more vibrant)
	const priorityColors = {
		1: 'bg-red-500',
		2: 'bg-orange-400',
		3: 'bg-blue-500',
		4: 'bg-gray-400'
	};

	const priorityLabels = {
		1: 'Highest',
		2: 'High',
		3: 'Medium',
		4: 'Low'
	};

	// State badges
	const stateBadgeColor = {
		new: 'bg-orange-500',
		in_progress: 'bg-blue-500',
		on_hold: 'bg-yellow-500',
		blocked: 'bg-red-500',
		done: 'bg-green-500'
	} as const;

	const stateIcons = {
		new: CircleIcon,
		in_progress: ClockIcon,
		on_hold: PauseCircleIcon,
		blocked: CircleMinusIcon,
		done: CheckCircleIcon
	};

	const StateIcon = $derived(stateIcons[todo.state as keyof typeof stateIcons]);
</script>

<Card.Root class="border transition-shadow hover:shadow-md">
	<Card.Header class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<div class="flex-1">
				<Card.Title class="font-display text-lg">
					<a href={`/todos/${todo.id}`} class="hover:underline">
						{todo.title}
					</a>
				</Card.Title>
				{#if todo.description}
					<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{todo.description}</p>
				{/if}
			</div>
			<div class="flex flex-col items-end gap-1">
				<div
					class={`h-4 w-4 rounded-full ${priorityColors[todo.priority as keyof typeof priorityColors]}`}
					title={`Priority: ${priorityLabels[todo.priority as keyof typeof priorityLabels]}`}
				></div>
			</div>
		</div>
	</Card.Header>

	<Card.Content class="pb-3">
		<!-- Metadata row -->
		<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
			<!-- State Badge -->
			<Badge
				variant="default"
				class={`gap-1 ${stateBadgeColor[todo.state as keyof typeof stateBadgeColor]}`}
			>
				<StateIcon class="h-3 w-3" />
				{todo.state.replace('_', ' ')}
			</Badge>

			<!-- Cadence -->
			{#if todo.cadence}
				<Badge variant="outline">{todo.cadence}</Badge>
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

<script lang="ts">
	import type { Project } from '$lib/server/db/types';

	import TodoCard from './TodoCard.svelte';

	interface Props {
		todos: Array<{
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
		}>;
		onStateChange?: (todoId: string, newState: string) => void;
	}

	let { todos, onStateChange }: Props = $props();
</script>

{#if todos.length === 0}
	<div class="rounded-md border p-8 text-center text-muted-foreground">
		<p>No todos found. Create your first todo to get started!</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each todos as todo (todo.id)}
			<TodoCard {todo} onStateChange={(newState) => onStateChange?.(todo.id, newState)} />
		{/each}
	</div>
{/if}

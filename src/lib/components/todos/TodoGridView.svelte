<script lang="ts">
import TodoCard from './TodoCard.svelte';

interface Props {
	todos: Array<{
		id: string;
		title: string;
		description: string | null;
		state: string;
		cadence: string | null;
		dueDate: string | null;
		priority: number;
		tags: string[] | null;
	}>;
	onStateChange?: (todoId: string, newState: string) => void;
}

let { todos, onStateChange }: Props = $props();
</script>

{#if todos.length === 0}
	<div class="w-full">
		<div
			class="flex min-h-56 w-full items-center justify-center rounded-md border border-dashed p-8 text-center text-muted-foreground"
		>
			<p>No todos found. Create your first todo to get started!</p>
		</div>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each todos as todo (todo.id)}
			<TodoCard {todo} onStateChange={(newState) => onStateChange?.(todo.id, newState)} />
		{/each}
	</div>
{/if}

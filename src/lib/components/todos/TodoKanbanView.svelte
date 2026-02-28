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
}

let { todos }: Props = $props();

// Group todos by state
let todosByState = $derived({
	new: todos.filter((t) => t.state === 'new'),
	in_progress: todos.filter((t) => t.state === 'in_progress'),
	on_hold: todos.filter((t) => t.state === 'on_hold'),
	blocked: todos.filter((t) => t.state === 'blocked'),
	done: todos.filter((t) => t.state === 'done')
});

let columns = $derived([
	{
		key: 'new' as const,
		label: 'New',
		count: todosByState.new.length,
		color: 'border-orange-500'
	},
	{
		key: 'in_progress' as const,
		label: 'In Progress',
		count: todosByState.in_progress.length,
		color: 'border-blue-500'
	},
	{
		key: 'on_hold' as const,
		label: 'On Hold',
		count: todosByState.on_hold.length,
		color: 'border-yellow-500'
	},
	{
		key: 'blocked' as const,
		label: 'Blocked',
		count: todosByState.blocked.length,
		color: 'border-red-500'
	},
	{
		key: 'done' as const,
		label: 'Done',
		count: todosByState.done.length,
		color: 'border-green-500'
	}
]);

// Handle state change via form submission
const handleStateChange = (todoId: string, newState: string) => {
	const form = document.createElement('form');
	form.method = 'POST';
	form.action = '?/updateState';

	const idInput = document.createElement('input');
	idInput.type = 'hidden';
	idInput.name = 'id';
	idInput.value = todoId;

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

<div class="grid gap-4 md:grid-cols-5">
	{#each columns as column (column.key + column.label)}
		<div class="flex flex-col gap-4">
			<div class="rounded-lg border border-b-4 bg-muted/50 p-3 {column.color}">
				<h3 class="font-display font-semibold">
					{column.label}
					<span class="ml-2 text-sm text-muted-foreground">({column.count})</span>
				</h3>
			</div>

			<div class="flex flex-col gap-3">
				{#each todosByState[column.key] as todo (todo.id)}
					<TodoCard {todo} onStateChange={(newState) => handleStateChange(todo.id, newState)} />
				{/each}

				{#if todosByState[column.key].length === 0}
					<div
						class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground"
					>
						No {column.label.toLowerCase()} todos
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

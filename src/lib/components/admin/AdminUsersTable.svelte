<script lang="ts">
	import type { User } from '$lib/types';

	import DataTable from './DataTable.svelte';
	import DataTableSortableHeader from './DataTableSortableHeader.svelte';
	import { createUsersColumns } from './users-columns';

	let { users }: { users: User[] } = $props();

	const columns = createUsersColumns(sortableHeaderCell);
</script>

{#snippet sortableHeaderCell(props: {
	label: string;
	sorted: false | 'asc' | 'desc';
	onclick: (event: MouseEvent) => void;
})}
	<DataTableSortableHeader label={props.label} sorted={props.sorted} onclick={props.onclick} />
{/snippet}

<DataTable
	{columns}
	data={users}
	searchPlaceholder="Search users..."
	emptyMessage="No users found."
/>

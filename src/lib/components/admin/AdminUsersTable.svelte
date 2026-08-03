<script lang="ts">
	import type { User } from '$lib/types';

	import DataTable from './DataTable.svelte';
	import { columns } from './users-columns';

	let { users }: { users: User[] } = $props();
</script>

<DataTable
	{columns}
	data={users}
	searchPlaceholder="Search users..."
	defaultPageSize={10}
	defaultSorting={[{ id: 'name', desc: false }]}
	emptyMessage="No users found."
/>

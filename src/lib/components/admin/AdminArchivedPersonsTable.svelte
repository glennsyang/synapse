<script lang="ts">
	import { columns, type ArchivedPerson } from './archived-persons-columns';
	import DataTable from './DataTable.svelte';

	let { people: archivedPeople }: { people: ArchivedPerson[] } = $props();
</script>

<DataTable
	{columns}
	data={archivedPeople}
	searchPlaceholder="Search archived persons..."
	defaultPageSize={10}
	defaultSorting={[{ id: 'name', desc: false }]}
	emptyMessage="No archived persons found."
/>

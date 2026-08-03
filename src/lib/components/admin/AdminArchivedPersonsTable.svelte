<script lang="ts">
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';

	import { createArchivedPersonsColumns, type ArchivedPerson } from './archived-persons-columns';
	import DataTable from './DataTable.svelte';
	import DataTableSortableHeader from './DataTableSortableHeader.svelte';

	let { people: archivedPeople }: { people: ArchivedPerson[] } = $props();

	let unarchiveDialogOpen = $state(false);
	let personToUnarchive = $state<ArchivedPerson | null>(null);

	function openUnarchiveDialog(person: ArchivedPerson) {
		personToUnarchive = person;
		unarchiveDialogOpen = true;
	}

	const columns = createArchivedPersonsColumns(sortableHeaderCell, unarchiveAction);
</script>

{#snippet sortableHeaderCell(props: {
	label: string;
	sorted: false | 'asc' | 'desc';
	onclick: (event: MouseEvent) => void;
})}
	<DataTableSortableHeader label={props.label} sorted={props.sorted} onclick={props.onclick} />
{/snippet}

{#snippet unarchiveAction(person: ArchivedPerson)}
	<Button variant="outline" size="sm" onclick={() => openUnarchiveDialog(person)}>Unarchive</Button>
{/snippet}

<DataTable
	{columns}
	data={archivedPeople}
	searchPlaceholder="Search archived persons..."
	emptyMessage="No archived persons found."
/>

<ConfirmDialog
	bind:open={unarchiveDialogOpen}
	title="Unarchive Person"
	message={`Unarchive ${personToUnarchive?.name}? They will reappear in ${personToUnarchive?.ownerEmail}'s visits list.`}
	confirmButtonText="Unarchive"
	actionUrl="?/unarchivePerson"
	hiddenFields={{ personId: personToUnarchive?.id ?? '' }}
/>

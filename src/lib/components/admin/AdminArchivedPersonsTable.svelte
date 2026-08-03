<script lang="ts">
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import type { people } from '$lib/server/db/schema';
	import { formatDateMedium } from '$lib/utils/date';

	type ArchivedPerson = typeof people.$inferSelect & {
		ownerEmail: string;
		lastVisitDate: string | null;
	};

	let { people: archivedPeople }: { people: ArchivedPerson[] } = $props();

	let unarchiveDialogOpen = $state(false);
	let personToUnarchive = $state<ArchivedPerson | null>(null);

	function openUnarchiveDialog(person: ArchivedPerson) {
		personToUnarchive = person;
		unarchiveDialogOpen = true;
	}
</script>

<div class="overflow-x-auto rounded-xl border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Owner</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>Exempt</Table.Head>
				<Table.Head>Last Visit Date</Table.Head>
				<Table.Head>Archived Date</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if archivedPeople.length === 0}
				<Table.Row>
					<Table.Cell colspan={6} class="text-muted-foreground text-center"
						>No archived persons found.</Table.Cell
					>
				</Table.Row>
			{:else}
				{#each archivedPeople as person (person.id)}
					<Table.Row>
						<Table.Cell>{person.ownerEmail}</Table.Cell>
						<Table.Cell>{person.name}</Table.Cell>
						<Table.Cell>
							<Badge variant={person.isExempt ? 'default' : 'outline'}>
								{person.isExempt ? 'Yes' : 'No'}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							{person.lastVisitDate ? formatDateMedium(person.lastVisitDate) : '—'}
						</Table.Cell>
						<Table.Cell>
							{person.archivedAt ? formatDateMedium(person.archivedAt.slice(0, 10)) : '—'}
						</Table.Cell>
						<Table.Cell class="text-right">
							<Button variant="outline" size="sm" onclick={() => openUnarchiveDialog(person)}>
								Unarchive
							</Button>
						</Table.Cell>
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
</div>

<ConfirmDialog
	bind:open={unarchiveDialogOpen}
	title="Unarchive Person"
	message={`Unarchive ${personToUnarchive?.name}? They will reappear in ${personToUnarchive?.ownerEmail}'s visits list.`}
	confirmButtonText="Unarchive"
	actionUrl="?/unarchivePerson"
	hiddenFields={{ personId: personToUnarchive?.id ?? '' }}
/>

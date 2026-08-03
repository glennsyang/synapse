<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';

	import type { ArchivedPerson } from './archived-persons-columns';

	let { archivedPerson }: { archivedPerson: ArchivedPerson } = $props();

	let openUnarchiveDialog = $state<boolean>(false);
	let isSubmitting = $state<boolean>(false);
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={() => (openUnarchiveDialog = true)}
	class="flex items-center gap-2"
>
	<ArchiveRestoreIcon class="size-4" />
	Unarchive
</Button>

<!-- Unarchive Confirmation Dialog -->
<Dialog.Root bind:open={openUnarchiveDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Unarchive Archived Person</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to unarchive "{archivedPerson.name}" for {archivedPerson.ownerEmail}?
				The person will be set to active status.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/unarchivePerson"
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update }) => {
					await update();
					isSubmitting = false;
					openUnarchiveDialog = false;
				};
			}}
		>
			<input type="hidden" name="personId" value={archivedPerson.id} />

			<div class="flex justify-end gap-2 pt-4">
				<Button type="button" variant="outline" onclick={() => (openUnarchiveDialog = false)}
					>Cancel</Button
				>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Unarchiving...' : 'Unarchive'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

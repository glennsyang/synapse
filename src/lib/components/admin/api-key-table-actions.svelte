<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	import type { AdminApiKey } from './api-keys-columns';

	let { apiKey }: { apiKey: AdminApiKey } = $props();

	let openRevokeDialog = $state<boolean>(false);
	let isSubmitting = $state<boolean>(false);
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={() => (openRevokeDialog = true)}
	class="text-destructive hover:text-destructive flex items-center gap-2"
>
	<Trash2Icon class="size-4" />
	Revoke
</Button>

<Dialog.Root bind:open={openRevokeDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Revoke API key</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to revoke "{apiKey.name || '(unnamed)'}"? Any tool using this key will
				immediately lose access.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/revokeApiKey"
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update }) => {
					await update();
					isSubmitting = false;
					openRevokeDialog = false;
				};
			}}
		>
			<input type="hidden" name="id" value={apiKey.id} />

			<div class="flex justify-end gap-2 pt-4">
				<Button type="button" variant="outline" onclick={() => (openRevokeDialog = false)}>
					Cancel
				</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? 'Revoking...' : 'Revoke'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

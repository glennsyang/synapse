<script lang="ts">
import { toast } from 'svelte-sonner';

import { enhance } from '$app/forms';
import { Button } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog';

import Input from '../ui/input/input.svelte';

interface Props {
	open: boolean;
	title: string;
	message: string;
	confirmButtonText: string;
	id?: string;
	actionUrl?: string;
	hiddenFields?: Record<string, string | number | boolean>;
}

let {
	open = $bindable(),
	title,
	message,
	id,
	confirmButtonText,
	actionUrl,
	hiddenFields
}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description> {message} </Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action={actionUrl}
			use:enhance={() => {
				open = false;

				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') {
						toast.success(`${title} successful!`);
					} else if (result.type === 'failure' && result.data?.error) {
						toast.error((result.data.error as string) || `${title} failed!`);
					} else {
						toast.error(`${title} failed!`);
					}

					await update();
				};
			}}
		>
			<Input type="hidden" name="id" value={id} />
			{#if hiddenFields}
				{#each Object.entries(hiddenFields) as [ name, value ] (name)}
					<Input type="hidden" {name} value={String(value)} />
				{/each}
			{/if}
			<Dialog.Footer>
				<Dialog.Close><Button type="reset" variant="outline">Cancel</Button></Dialog.Close>
				<Button type="submit">{confirmButtonText}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

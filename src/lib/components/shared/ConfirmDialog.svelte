<script lang="ts">
	import { toast } from 'svelte-sonner';

	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmButtonText: string;
		id?: string;
		actionUrl?: string;
	}

	let { open = $bindable(), title, message, id, confirmButtonText, actionUrl }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				{message}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action={actionUrl}
			use:enhance={() => {
				open = false;

				return async ({ result, update }) => {
					if (result.type === 'success') {
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
			<input type="hidden" name="id" value={id} />
			<Dialog.Footer>
				<Dialog.Close><Button type="reset" variant="outline">Cancel</Button></Dialog.Close>
				<Button type="submit">{confirmButtonText}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

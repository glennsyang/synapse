<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { personSchema } from '$lib/schemas/visits';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let formState = $derived(
		superForm(data.form, {
			validators: zod4(personSchema),
			onUpdated({ form }) {
				if (form.message) {
					if (form.message.type === 'error') {
						toast.error(form.message.text);
					}
				}
			}
		})
	);

	const { form, errors, enhance, submitting } = $derived(formState);
</script>

<div class="container mx-auto max-w-2xl p-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Add Person</h1>
		<p class="text-muted-foreground mt-1">Add someone to track visits with</p>
	</div>

	<Card.Root>
		<Card.Content class="pt-6">
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Name*</Label>
						<Input
							id="name"
							name="name"
							type="text"
							bind:value={$form.name}
							placeholder="Enter person's name"
							required
							aria-invalid={$errors.name ? 'true' : undefined}
						/>
						{#if $errors.name}
							<p class="text-destructive mt-1 text-sm">{$errors.name}</p>
						{/if}
					</div>

					<div class="flex gap-2">
						<Button
							type="submit"
							class="bg-pink-600 text-white hover:bg-pink-700"
							disabled={$submitting}
						>
							{$submitting ? 'Adding...' : 'Add'}
						</Button>
						<Button type="button" variant="outline" href="/visits">Cancel</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

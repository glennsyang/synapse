<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import PageFormShell from '$lib/components/shared/PageFormShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { MOOD_TAGS } from '$lib/schemas/meditation';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message } = superForm(data.form, {
		onUpdate: ({ form }) => {
			if (form.valid) {
				toast.success('Routine created successfully!');
			}
			if ($message?.type === 'error') {
				toast.error(`Error creating routine. Reason: ${$message.text}`);
			}
		}
	});
</script>

<PageFormShell>
	<div class="mb-6">
		<Button href="/meditation" variant="ghost">
			<ArrowLeftIcon class="mr-2 h-4 w-4" />
			Back to Meditation
		</Button>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Create New Meditation Routine</Card.Title>
			<Card.Description>Add a custom meditation routine to your library</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-4">
				<!-- Title -->
				<div class="space-y-2">
					<Label for="title">Title *</Label>
					<Input
						id="title"
						name="title"
						bind:value={$form.title}
						placeholder="Morning Mindfulness"
						aria-invalid={$errors.title ? 'true' : undefined}
					/>
					{#if $errors.title}
						<p class="text-sm text-destructive">{$errors.title}</p>
					{/if}
				</div>

				<!-- Description -->
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={$form.description}
						placeholder="A brief description of this meditation routine..."
						rows={3}
					/>
					{#if $errors.description}
						<p class="text-sm text-destructive">{$errors.description}</p>
					{/if}
				</div>

				<!-- Link URL -->
				<div class="space-y-2">
					<Label for="link_url">Meditation Link *</Label>
					<Input
						id="link_url"
						name="link_url"
						type="url"
						bind:value={$form.link_url}
						placeholder="https://youtube.com/watch?v=..."
						aria-invalid={$errors.link_url ? 'true' : undefined}
					/>
					<p class="text-sm text-muted-foreground">
						Link to a YouTube video, audio file, or guided meditation resource
					</p>
					{#if $errors.link_url}
						<p class="text-sm text-destructive">{$errors.link_url}</p>
					{/if}
				</div>

				<!-- Duration -->
				<div class="space-y-2">
					<Label for="duration_minutes">Duration (minutes) *</Label>
					<Input
						id="duration_minutes"
						name="duration_minutes"
						type="number"
						min="1"
						bind:value={$form.duration_minutes}
						placeholder="10"
						aria-invalid={$errors.duration_minutes ? 'true' : undefined}
					/>
					{#if $errors.duration_minutes}
						<p class="text-sm text-destructive">{$errors.duration_minutes}</p>
					{/if}
				</div>

				<!-- Mood Tags -->
				<div class="space-y-2">
					<Label for="mood_tags">Mood Tags *</Label>
					<Input
						id="mood_tags"
						name="mood_tags"
						bind:value={$form.mood_tags}
						placeholder="Anxious, Focused"
						aria-invalid={$errors.mood_tags ? 'true' : undefined}
					/>
					<p class="text-sm text-muted-foreground">
						Comma-separated list. Allowed: {MOOD_TAGS.join(', ')}
					</p>
					{#if $errors.mood_tags}
						<p class="text-sm text-destructive">{$errors.mood_tags}</p>
					{/if}
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button type="submit" class="bg-purple-600 hover:bg-purple-700">Create</Button>
					<Button type="button" variant="outline" href="/meditation">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</PageFormShell>

<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';

	import TagInput from '$lib/components/journal/TagInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { logger } from '$lib/utils/logger';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, message, submitting } = superForm(data.form, {
		onUpdate: ({ form }) => {
			if (form.valid) {
				gettingLocation = false;
				toast.success('Journal entry created successfully!');
			}
			if ($message?.type === 'error') {
				toast.error(`Error creating journal entry. Reason: ${$message.text}`);
			}
		}
	});

	let location = $state($form.location || '');
	let gettingLocation = $state(false);

	function getLocation() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}

		gettingLocation = true;
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				try {
					// Use reverse geocoding API (optional - for now just use coordinates)
					location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
					$form.location = location;
				} catch (error) {
					logger.error('Failed to get location name', { error });
				} finally {
					gettingLocation = false;
				}
			},
			(error) => {
				logger.error('Error getting location', { error });
				alert('Unable to retrieve your location');
				gettingLocation = false;
			}
		);
	}
</script>

<div class="container mx-auto max-w-3xl space-y-6 py-6">
	<div class="flex items-center gap-4">
		<Button href="/journal" variant="ghost" size="sm">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<h1 class="text-3xl font-bold">New Journal Entry</h1>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Write Your Entry</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-6">
				<div class="space-y-2">
					<Label for="date">Date</Label>
					<Input
						id="date"
						name="date"
						type="date"
						bind:value={$form.date}
						class={$errors.date ? 'border-destructive' : ''}
						required
					/>
					{#if $errors.date}
						<p class="text-sm text-destructive">{$errors.date}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="content">Content</Label>
					<Textarea
						id="content"
						name="content"
						bind:value={$form.content}
						placeholder="Write your thoughts..."
						rows={10}
						class={$errors.content ? 'border-destructive' : ''}
						required
					/>
					{#if $errors.content}
						<p class="text-sm text-destructive">{$errors.content}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="tags">Tags (comma-separated)</Label>
					<TagInput bind:value={$form.tags} />
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label for="location">Location</Label>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={getLocation}
							disabled={gettingLocation}
						>
							{gettingLocation ? 'Getting location...' : 'Auto-fill'}
						</Button>
					</div>
					<Input
						id="location"
						name="location"
						bind:value={$form.location}
						placeholder="e.g., Surrey, BC"
					/>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="weatherTemp">Weather Temperature (°C)</Label>
						<Input
							id="weatherTemp"
							name="weatherTemp"
							type="number"
							bind:value={$form.weatherTemp}
							placeholder="10, 22, etc."
						/>
					</div>

					<div class="space-y-2">
						<Label for="weatherCondition">Weather Condition</Label>
						<Input
							id="weatherCondition"
							name="weatherCondition"
							bind:value={$form.weatherCondition}
							placeholder="Partly Cloudy, Sunny, etc."
						/>
					</div>
				</div>

				<div class="flex gap-2">
					<Button type="submit" disabled={$submitting}>
						{$submitting ? 'Saving...' : 'Save Entry'}
					</Button>
					<Button type="button" variant="outline" href="/journal">Cancel</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

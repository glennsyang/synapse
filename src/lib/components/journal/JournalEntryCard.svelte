<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import Cloud from '@lucide/svelte/icons/cloud';
	import Edit from '@lucide/svelte/icons/edit';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { JournalEntry } from '$lib/types';

	import ConfirmDialog from '../shared/ConfirmDialog.svelte';

	let { entry }: { entry: JournalEntry } = $props();

	let openDeleteModal = $state<boolean>(false);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-start justify-between">
			<div class="space-y-1">
				<Card.Title class="flex items-center gap-2">
					<Calendar class="h-4 w-4" />
					{formatDate(entry.date)}
				</Card.Title>
				<Card.Description>
					{#if entry.location}
						<span class="flex items-center gap-1">
							<MapPin class="h-3 w-3" />
							{entry.location}
						</span>
					{/if}
				</Card.Description>
			</div>
			<div class="flex gap-2">
				<Button href="/journal/{entry.id}/edit" variant="outline" size="sm">
					<Edit class="h-4 w-4" />
				</Button>
				<Button variant="destructive" size="sm" onclick={() => (openDeleteModal = true)}>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="prose dark:prose-invert max-w-none">
			{entry.content}
		</div>

		{#if entry.tags && entry.tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each entry.tags as tag (tag)}
					<Badge variant="secondary">{tag}</Badge>
				{/each}
			</div>
		{/if}

		{#if entry.weather}
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Cloud class="h-4 w-4" />
				{#if entry.weather.temp}
					<span>{entry.weather.temp}°F</span>
				{/if}
				{#if entry.weather.condition}
					<span>• {entry.weather.condition}</span>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>

<ConfirmDialog
	bind:open={openDeleteModal}
	id={entry.id}
	actionUrl={`/journal/${entry.id}?/delete`}
	title="Delete Journal Entry"
	message="Are you sure you want to delete this journal entry?"
	confirmButtonText="Delete"
/>

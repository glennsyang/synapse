<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';

	import { goto } from '$app/navigation';
	import JournalEntryCard from '$lib/components/journal/JournalEntryCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let tagFilter = $state('');
	let startDateFilter = $state('');
	let endDateFilter = $state('');

	async function applyFilters() {
		const params: Record<string, string> = {};
		if (tagFilter) params.tag = tagFilter;
		if (startDateFilter) params.startDate = startDateFilter;
		if (endDateFilter) params.endDate = endDateFilter;

		const queryParams = new URLSearchParams(params);
		const queryString = queryParams.toString();
		await goto(`/journal${queryString ? '?' + queryString : ''}`);
	}

	async function clearFilters() {
		tagFilter = '';
		startDateFilter = '';
		endDateFilter = '';
		await goto('/journal');
	}
</script>

<div class="container mx-auto space-y-6 py-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Journal</h1>
		<Button href="/journal/new">
			<Plus class="mr-2 h-4 w-4" />
			New Entry
		</Button>
	</div>

	<Card class="p-4">
		<div class="space-y-4">
			<h2 class="text-lg font-semibold">Filters</h2>
			<div class="grid gap-4 md:grid-cols-3">
				<div>
					<label for="tag" class="text-sm font-medium">Tag</label>
					<Input id="tag" bind:value={tagFilter} placeholder="e.g., anxious" />
				</div>
				<div>
					<label for="startDate" class="text-sm font-medium">Start Date</label>
					<Input id="startDate" type="date" bind:value={startDateFilter} />
				</div>
				<div>
					<label for="endDate" class="text-sm font-medium">End Date</label>
					<Input id="endDate" type="date" bind:value={endDateFilter} />
				</div>
			</div>
			<div class="flex gap-2">
				<Button onclick={applyFilters}>Apply Filters</Button>
				<Button variant="outline" onclick={clearFilters}>Clear</Button>
			</div>
		</div>
	</Card>

	<div class="space-y-4">
		{#if data.entries.length === 0}
			<Card class="p-8 text-center">
				<p class="text-muted-foreground">No journal entries found. Start writing!</p>
			</Card>
		{:else}
			{#each data.entries as entry (entry.id)}
				<JournalEntryCard {entry} />
			{/each}
		{/if}
	</div>
</div>

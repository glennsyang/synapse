<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import Plus from '@lucide/svelte/icons/plus';

	import { goto } from '$app/navigation';
	import JournalEntryCard from '$lib/components/journal/JournalEntryCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let tagFilter = $state('');
	let startDateFilter = $state('');
	let endDateFilter = $state('');
	let filtersOpen = $state(false);

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

<div class="mobile-container mx-auto max-w-7xl space-y-6 py-4 sm:py-6">
	<div class="mobile-stack justify-between">
		<h1 class="font-display text-2xl font-bold sm:text-3xl">Journal</h1>
		<Button href="/journal/new" class="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
			<Plus class="mr-2 h-4 w-4" />
			New Entry
		</Button>
	</div>

	<Collapsible.Root bind:open={filtersOpen}>
		<Collapsible.Trigger>
			<Button variant="outline" class="w-full sm:w-auto">
				<FilterIcon class="mr-2 h-4 w-4" />
				Filters
				<ChevronDown
					class="ml-2 h-4 w-4 transition-transform duration-200 {filtersOpen ? 'rotate-180' : ''}"
				/>
			</Button>
		</Collapsible.Trigger>
		<Collapsible.Content class="mt-4">
			<div
				class="space-y-4 rounded-lg border border-blue-200 bg-blue-500/5 p-4 dark:border-blue-800"
			>
				<div class="responsive-grid-3">
					<div class="space-y-2">
						<Label for="tag">Tag</Label>
						<Input id="tag" type="text" bind:value={tagFilter} placeholder="e.g., anxious" />
					</div>
					<div class="space-y-2">
						<Label for="startDate">Start Date</Label>
						<Input id="startDate" type="date" bind:value={startDateFilter} />
					</div>
					<div class="space-y-2">
						<Label for="endDate">End Date</Label>
						<Input id="endDate" type="date" bind:value={endDateFilter} />
					</div>
				</div>
				<div class="mobile-stack">
					<Button onclick={applyFilters} class="w-full sm:w-auto">Apply Filters</Button>
					<Button variant="outline" onclick={clearFilters} class="w-full sm:w-auto">Clear</Button>
				</div>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>

	<div class="space-y-4">
		{#if data.entries.length === 0}
			<div class="rounded-lg border border-dashed p-8 text-center">
				<CalendarIcon class="mx-auto h-12 w-12 text-muted-foreground" />
				<p class="mt-4 text-muted-foreground">No journal entries found. Start writing!</p>
				<Button href="/journal/new" class="mt-4" variant="outline">
					<Plus class="mr-2 h-4 w-4" />
					Create First Entry
				</Button>
			</div>
		{:else}
			{#each data.entries as entry (entry.id)}
				<JournalEntryCard {entry} />
			{/each}
		{/if}
	</div>
</div>

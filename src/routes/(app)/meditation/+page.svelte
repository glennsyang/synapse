<script lang="ts">
import ChevronDown from '@lucide/svelte/icons/chevron-down';
import ClockIcon from '@lucide/svelte/icons/clock';
import FilterIcon from '@lucide/svelte/icons/filter';
import PlayCircleIcon from '@lucide/svelte/icons/play-circle';
import PlusIcon from '@lucide/svelte/icons/plus';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import { SvelteURLSearchParams } from 'svelte/reactivity';

import { navigating, page } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import * as Collapsible from '$lib/components/ui/collapsible';
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select';
import * as Tabs from '$lib/components/ui/tabs';
import { formatTimeFromTimestamp, formatTimestampShort } from '$lib/utils/date';

import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

const moodTagColors: Record<string, string> = {
	Anxious: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
	'Low Energy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
	Focused: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
	'Pre-Sleep': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
	General: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

let selectedMood = $state<string | undefined>(undefined);
let selectedType = $state<string>('all');
let filtersOpen = $state(false);

function applyFilters() {
	const params = new SvelteURLSearchParams(page.url.searchParams);
	if (selectedMood) {
		params.set('mood', selectedMood);
	} else {
		params.delete('mood');
	}
	params.set('type', selectedType);
	window.location.href = `/meditation?${params.toString()}`;
}
</script>

{#if navigating.to?.url.pathname === '/meditation'}
	<PageSkeleton color="purple" />
{:else}
	<PageShell>
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="font-display text-3xl font-bold">Meditation</h1>
				<p class="text-muted-foreground">Manage routines and track your practice</p>
			</div>
			<Button href="/meditation/routines/new" class="bg-purple-600 hover:bg-purple-700">
				<PlusIcon class="mr-2 h-4 w-4" />
				New Routine
			</Button>
		</div>

		<Tabs.Root value="routines" class="w-full">
			<Tabs.List
				class="inline-flex h-10 w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground"
			>
				<Tabs.Trigger
					value="routines"
					class="font-display border-b-2 border-transparent data-[state=active]:border-purple-500"
					>Routines</Tabs.Trigger
				>
				<Tabs.Trigger
					value="history"
					class="font-display border-b-2 border-transparent data-[state=active]:border-purple-500"
					>History</Tabs.Trigger
				>
			</Tabs.List>

			<!-- Routines Tab -->
			<Tabs.Content value="routines" class="w-full space-y-4">
				<!-- Filters -->
				<Collapsible.Root bind:open={filtersOpen}>
					<Collapsible.Trigger>
						<Button variant="outline" class="w-full sm:w-auto">
							<FilterIcon class="mr-2 h-4 w-4" />
							Filters
							<ChevronDown
								class="ml-2 h-4 w-4 transition-transform duration-200 {filtersOpen
									? 'rotate-180'
									: ''}"
							/>
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content class="mt-4">
						<div
							class="space-y-4 rounded-lg border border-purple-200 bg-purple-500/5 p-4 dark:border-purple-800"
						>
							<div class="grid gap-4 md:grid-cols-3">
								<div>
									<Label for="mood-filter" class="mb-2 block text-sm font-medium">Mood</Label>
									<Select.Root type="single" bind:value={selectedMood}>
										<Select.Trigger id="mood-filter">
											{selectedMood || 'All moods'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="">All moods</Select.Item>
											<Select.Item value="Anxious">Anxious</Select.Item>
											<Select.Item value="Low Energy">Low Energy</Select.Item>
											<Select.Item value="Focused">Focused</Select.Item>
											<Select.Item value="Pre-Sleep">Pre-Sleep</Select.Item>
											<Select.Item value="General">General</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
								<div>
									<Label for="type-filter" class="mb-2 block text-sm font-medium">Type</Label>
									<Select.Root type="single" bind:value={selectedType}>
										<Select.Trigger id="type-filter">
											{selectedType === 'all'
												? 'All'
												: selectedType === 'predefined'
													? 'Predefined'
													: 'User Created'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="all">All</Select.Item>
											<Select.Item value="predefined">Predefined</Select.Item>
											<Select.Item value="user-created">User Created</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
								<div class="flex items-end">
									<Button onclick={applyFilters} class="w-full bg-purple-600 hover:bg-purple-700"
										>Apply Filters</Button
									>
								</div>
							</div>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>

				<!-- Routines List -->
				<div class="grid w-full gap-4 sm:min-h-80 md:grid-cols-2 lg:grid-cols-3">
					{#each data.routines as routine (routine.id)}
						<Card.Root
							class="to-lavender-50 border-purple-200 bg-linear-to-br from-purple-50 transition-shadow hover:shadow-lg dark:border-purple-800 dark:from-purple-950/20 dark:to-purple-900/10"
						>
							<Card.Header>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<Card.Title class="font-display text-lg">{routine.title}</Card.Title>
										{#if routine.description}
											<p class="mt-2 text-sm text-muted-foreground">{routine.description}</p>
										{/if}
									</div>
									{#if routine.isPredefined}
										<Badge
											variant="secondary"
											class="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
										>
											<SparklesIcon class="mr-1 h-3 w-3" />
											Predefined
										</Badge>
									{/if}
								</div>
							</Card.Header>
							<Card.Content class="space-y-3">
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<ClockIcon class="h-4 w-4" />
									<span>{routine.durationMinutes} minutes</span>
								</div>
								<div class="flex flex-wrap gap-1">
									{#each routine.moodTags as tag, index (tag + index)}
										<Badge variant="outline" class={moodTagColors[tag] || 'bg-gray-100'}>
											{tag}
										</Badge>
									{/each}
								</div>
							</Card.Content>
							<Card.Footer class="flex gap-2">
								<Button
									href={routine.linkUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="flex-1 bg-purple-600 hover:bg-purple-700"
								>
									<PlayCircleIcon class="mr-2 h-4 w-4" />
									Practice
								</Button>
								<Button href="/meditation/routines/{routine.id}" variant="outline">Details</Button>
							</Card.Footer>
						</Card.Root>
					{:else}
						<Card.Root class="col-span-full">
							<Card.Content class="py-8 text-center">
								<p class="text-muted-foreground">
									No routines found. Try adjusting your filters or create a new routine.
								</p>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			</Tabs.Content>

			<!-- History Tab -->
			<Tabs.Content value="history" class="w-full space-y-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Session History</Card.Title>
						<Card.Description>Your completed meditation sessions</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if data.sessions.length > 0}
							<div class="space-y-4">
								{#each data.sessions as session (session.id)}
									<div class="flex items-start justify-between border-b pb-4 last:border-b-0">
										<div class="flex-1">
											<h3 class="font-medium">{session.routine.title}</h3>
											<p class="text-sm text-muted-foreground">
												{formatTimestampShort(session.completedAt)}
												at
												{formatTimeFromTimestamp(
													session.completedAt
												)}
											</p>
											{#if session.notes}
												<p class="mt-2 text-sm text-muted-foreground">{session.notes}</p>
											{/if}
										</div>
										<div class="flex flex-col items-end gap-2">
											{#if session.moodRating}
												<Badge variant="outline">Mood: {session.moodRating}/5</Badge>
											{/if}
											<span class="text-sm text-muted-foreground"
												>{session.routine.durationMinutes}
												min</span
											>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="py-8 text-center text-muted-foreground">
								No sessions completed yet. Start practicing to build your history!
							</p>
						{/if}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</PageShell>
{/if}

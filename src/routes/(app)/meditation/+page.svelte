<script lang="ts">
import { ListFilter } from '@lucide/svelte';
import ClockIcon from '@lucide/svelte/icons/clock';
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
import * as Tabs from '$lib/components/ui/tabs';
import * as Tooltip from '$lib/components/ui/tooltip';
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

const activeTab = $derived.by(() =>
	page.url.searchParams.get('tab') === 'history' ? 'history' : 'routines'
);
const showPageSkeleton = $derived(
	navigating.to?.url.pathname === '/meditation' && navigating.from?.url.pathname !== '/meditation'
);

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

{#if showPageSkeleton}
	<PageSkeleton color="purple" />
{:else}
	<PageShell class="min-w-0 overflow-x-hidden">
		<div
			class="mobile-stack mb-4 flex items-center justify-between gap-3 sm:mb-5 sm:flex-wrap lg:flex-nowrap"
		>
			<div class="min-w-0 flex-1">
				<h1 class="font-display text-2xl font-bold sm:text-3xl">Meditation</h1>
				<p class="text-sm text-muted-foreground sm:text-base">
					Manage routines and track your practice
				</p>
			</div>
			<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
				<Button href="/meditation/routines/new" class="bg-purple-600 hover:bg-purple-700">
					<PlusIcon class="mr-2 h-4 w-4" />
					New Routine
				</Button>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								type="button"
								variant="outline"
								size="icon"
								onclick={() => (filtersOpen = !filtersOpen)}
								aria-label="Toggle journal filters"
								aria-controls="journal-filter-bar"
								aria-expanded={filtersOpen}
								class={[
										'shrink-0',
										(filtersOpen) &&
											'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20'
									]}
							>
								<ListFilter class="size-4" />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Toggle filters</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>

		<Tabs.Root value={activeTab} class="w-full gap-3">
			<Tabs.List
				class="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/75 p-1 text-muted-foreground"
			>
				<Tabs.Trigger
					value="routines"
					class="font-display border-b-2 border-transparent data-[state=active]:border-purple-500"
				>
					Routines
				</Tabs.Trigger>
				<Tabs.Trigger
					value="history"
					class="font-display border-b-2 border-transparent data-[state=active]:border-purple-500"
				>
					History
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Routines Tab -->
			<Tabs.Content value="routines" class="w-full space-y-4">
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

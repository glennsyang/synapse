<script lang="ts">
import { CalendarCheck, Plus } from '@lucide/svelte';

import { replaceState } from '$app/navigation';
import { navigating, page } from '$app/state';
import PageShell from '$lib/components/app/PageShell.svelte';
import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
import * as Alert from '$lib/components/ui/alert';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import * as Tabs from '$lib/components/ui/tabs';
import { formatDateShort } from '$lib/utils/date';
import { getStatusLabel, type VisitStatus } from '$lib/utils/visit-status';

import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

type VisitTab = 'all' | VisitStatus;

const allowedTabs = new Set<VisitTab>([
	'all',
	'green',
	'yellow',
	'red',
	'none',
	'exempt',
	'scheduled'
]);

function getInitialTab(): VisitTab {
	const status = page.url.searchParams.get('status');
	if (status && allowedTabs.has(status as VisitTab)) {
		return status as VisitTab;
	}
	return 'all';
}

let activeTab = $state<VisitTab>(getInitialTab());

function getValidTab(value: string): VisitTab {
	if (value === 'all') {
		return 'all';
	}

	if (allowedTabs.has(value as VisitTab)) {
		return value as VisitTab;
	}

	return 'all';
}

function handleTabChange(value: string) {
	const nextTab = getValidTab(value);
	activeTab = nextTab;

	if (typeof window === 'undefined') {
		return;
	}

	const nextUrl = new URL(window.location.href);
	if (nextTab === 'all') {
		nextUrl.searchParams.delete('status');
	} else {
		nextUrl.searchParams.set('status', nextTab);
	}

	replaceState(nextUrl, page.state);
}

function peopleForTab(tab: VisitTab) {
	if (tab === 'all') {
		return data.people;
	}

	if (tab === 'scheduled') {
		return data.people
			.filter((person) => person.status === 'scheduled')
			.sort((a, b) => {
				if (!a.nextFollowUpDate || !b.nextFollowUpDate) {
					return 0;
				}
				return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
			});
	}

	return data.people.filter((person) => person.status === tab);
}

const allPeopleCount = $derived(data.people.length);
const criticalCount = $derived(peopleForTab('red').length);
const overdueCount = $derived(peopleForTab('yellow').length);
const recentCount = $derived(peopleForTab('green').length);
const noVisitsCount = $derived(peopleForTab('none').length);
const exemptCount = $derived(peopleForTab('exempt').length);
const scheduledCount = $derived(peopleForTab('scheduled').length);

function formatTimeSince(days: number): string {
	if (days < 30) {
		return `${days} day${days !== 1 ? 's' : ''} ago`;
	}
	const months = Math.floor(days / 30);
	return `${months} month${months !== 1 ? 's' : ''} ago`;
}
</script>

{#if navigating.to?.url.pathname === '/visits'}
	<PageSkeleton color="pink" />
{:else}
	<PageShell class="sm:py-6">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="font-display text-3xl font-bold">Visit Tracking</h1>
				<p class="mt-1 text-muted-foreground">Track visits made with your group</p>
			</div>
			<Button
				title="Add Person"
				aria-label="Add Person"
				href="/visits/people/new"
				class="bg-pink-600 hover:bg-pink-700"
			>
				<Plus class="mr-2 h-4 w-4" />
				Add Person
			</Button>
		</div>

		<!-- Status Filter Tabs -->
		<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="mb-6 w-full">
			<div class="w-full overflow-x-auto pb-1">
				<Tabs.List
					class="font-display inline-flex h-10 min-w-max items-center justify-start rounded-md bg-muted p-1 text-muted-foreground"
				>
					<Tabs.Trigger
						value="all"
						class="border-b-2 border-transparent data-[state=active]:border-pink-500"
					>
						All ({allPeopleCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="red"
						class="border-b-2 border-transparent data-[state=active]:border-red-500"
					>
						<span class="mr-1 inline-block h-2 w-2 rounded-full bg-red-500"></span>
						Critical ({criticalCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="yellow"
						class="border-b-2 border-transparent data-[state=active]:border-yellow-500"
					>
						<span class="mr-1 inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
						Overdue ({overdueCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="green"
						class="border-b-2 border-transparent data-[state=active]:border-green-500"
					>
						<span class="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>
						Recent ({recentCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="none"
						class="border-b-2 border-transparent data-[state=active]:border-gray-500"
					>
						<span class="mr-1 inline-block h-2 w-2 rounded-full bg-gray-400"></span>
						No Visits ({noVisitsCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="exempt"
						class="border-b-2 border-transparent data-[state=active]:border-gray-600"
					>
						<span class="mr-1 inline-block h-2 w-2 rounded-full bg-gray-500"></span>
						Exempt ({exemptCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="scheduled"
						class="border-b-2 border-transparent data-[state=active]:border-purple-500"
					>
						Scheduled ({scheduledCount})
					</Tabs.Trigger>
				</Tabs.List>
			</div>

			{#each ['all', 'scheduled', 'red', 'yellow', 'green', 'none', 'exempt'] as tab (tab)}
				<Tabs.Content value={tab} class="w-full">
					{@const isScheduledTab = tab === 'scheduled'}
					{@const peopleInTab = peopleForTab(tab as VisitTab)}
					<div class="grid w-full gap-4 sm:min-h-80 md:grid-cols-2 lg:grid-cols-3">
						{#if peopleInTab.length === 0}
							<div class="col-span-full">
								<Card.Root class="w-full border-dashed">
									<Card.Content
										class="flex min-h-56 flex-col items-center justify-center py-12 text-center"
									>
										<p class="mb-4 text-muted-foreground">
											{isScheduledTab ? 'No scheduled follow-up visits found.' : 'No people found.'}
										</p>
										<Button href="/visits/people/new">Add Your First Person</Button>
									</Card.Content>
								</Card.Root>
							</div>
						{:else}
							{#each peopleInTab as person (person.id)}
								{@const borderColor =
									person.status === 'green'
										? 'border-l-green-500'
										: person.status === 'yellow'
											? 'border-l-yellow-500'
											: person.status === 'red'
												? 'border-l-red-500'
												: person.status === 'scheduled'
													? 'border-l-purple-500'
												: person.status === 'exempt'
													? 'border-l-gray-500'
													: 'border-l-gray-400'}
								<a href="/visits/{person.id}">
									<Card.Root class="border-l-4 transition-shadow hover:shadow-md {borderColor}">
										<Card.Header>
											<div class="flex items-start justify-between">
												<Card.Title class="font-display">{person.name}</Card.Title>
												<div class="flex flex-col items-end gap-2">
													<Badge
														variant={person.status === 'green'
															? 'default'
															: person.status === 'yellow'
																? 'secondary'
																: person.status === 'red'
																	? 'destructive'
																	: person.status === 'scheduled'
																		? 'secondary'
																	: 'outline'}
														class={person.status === 'green'
															? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200'
															: person.status === 'yellow'
																? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
																: person.status === 'red'
																	? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200'
																		: person.status === 'scheduled'
																			? 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200'
																	: ''}
													>
														{getStatusLabel(person.status)}
													</Badge>
												</div>
											</div>
										</Card.Header>
										<Card.Content>
											{#if person.lastVisit}
												<div class="text-sm text-muted-foreground">
													{#if isScheduledTab && person.nextFollowUpDate}
														<Alert.Root variant="destructive" class="mb-2">
															<CalendarCheck class="h-4 w-4" />
															<Alert.Title>Follow-up scheduled:</Alert.Title>
															<Alert.Description>
																{formatDateShort(person.nextFollowUpDate)}
															</Alert.Description>
														</Alert.Root>
													{/if}
													<p>
														Last visit: {formatDateShort(person.lastVisit.date)}
														{#if person.daysSinceLastVisit !== null}
															({formatTimeSince(person.daysSinceLastVisit)})
														{/if}
													</p>
													{#if person.lastVisit.companions && person.lastVisit.companions.length > 0}
														<p class="mt-1">With: {person.lastVisit.companions.join(', ')}</p>
													{/if}
													{#if person.daysUntilStatusChange !== null}
														<p class="mt-1 text-xs">
															{person.daysUntilStatusChange}
															day{person.daysUntilStatusChange !== 1
																? 's'
																: ''}
															until
															{person.status === 'green' ? 'overdue' : 'critical'}
														</p>
													{/if}
												</div>
											{:else}
												<p class="text-sm text-muted-foreground">No visits logged yet</p>
											{/if}
										</Card.Content>
									</Card.Root>
								</a>
							{/each}
						{/if}
					</div>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</PageShell>
{/if}

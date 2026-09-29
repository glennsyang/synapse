<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import PageShell from '$lib/components/app/PageShell.svelte';
	import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { formatDateHeuristic } from '$lib/utils/date';
	import { getStatusLabel, type VisitStatus } from '$lib/utils/visit-status';
	import { Plus } from '@lucide/svelte';

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
		<div class="ruled mb-6 flex items-center justify-between gap-3 pb-4">
			<div>
				<h1 class="page-title" style="--pen: oklch(var(--color-pink))">Visit Tracking</h1>
				<p class="text-muted-foreground mt-1">Track visits made with your group</p>
			</div>
			<Button
				title="Add Person"
				aria-label="Add Person"
				href="/visits/people/new"
				class="bg-pen-people hover:bg-pen-people"
			>
				<Plus class="mr-2 h-4 w-4" />
				Add Person
			</Button>
		</div>

		<!-- Status Filter Tabs -->
		<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="mb-6 w-full">
			<div class="w-full overflow-x-auto pb-1">
				<Tabs.List
					class="font-display bg-muted text-muted-foreground inline-flex h-10 min-w-max items-center justify-start rounded-md p-1"
				>
					<Tabs.Trigger
						value="all"
						class="data-[state=active]:border-pen-people border-b-2 border-transparent"
					>
						All ({allPeopleCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="red"
						class="data-[state=active]:border-destructive border-b-2 border-transparent"
					>
						<span class="bg-destructive mr-1 inline-block h-2 w-2 rounded-full"></span>
						Critical ({criticalCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="yellow"
						class="data-[state=active]:border-pen-warn border-b-2 border-transparent"
					>
						<span class="bg-pen-warn mr-1 inline-block h-2 w-2 rounded-full"></span>
						Overdue ({overdueCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="green"
						class="data-[state=active]:border-pen-fitness border-b-2 border-transparent"
					>
						<span class="bg-pen-fitness mr-1 inline-block h-2 w-2 rounded-full"></span>
						Recent ({recentCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="none"
						class="data-[state=active]:border-border border-b-2 border-transparent"
					>
						<span class="bg-muted mr-1 inline-block h-2 w-2 rounded-full"></span>
						No Visits ({noVisitsCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="exempt"
						class="data-[state=active]:border-border border-b-2 border-transparent"
					>
						<span class="bg-muted mr-1 inline-block h-2 w-2 rounded-full"></span>
						Exempt ({exemptCount})
					</Tabs.Trigger>
					<Tabs.Trigger
						value="scheduled"
						class="data-[state=active]:border-pen-mind border-b-2 border-transparent"
					>
						Scheduled ({scheduledCount})
					</Tabs.Trigger>
				</Tabs.List>
			</div>

			{#each ['all', 'scheduled', 'red', 'yellow', 'green', 'none', 'exempt'] as tab (tab)}
				<Tabs.Content value={tab} class="w-full">
					{@const isScheduledTab = tab === 'scheduled'}
					{@const peopleInTab = peopleForTab(tab as VisitTab)}
					{#if peopleInTab.length === 0}
						<div class="border-rule border-y border-dashed py-12 text-center">
							<p class="text-muted-foreground mb-4">
								{isScheduledTab ? 'No scheduled follow-up visits found.' : 'No people found.'}
							</p>
							<Button href="/visits/people/new">Add Your First Person</Button>
						</div>
					{:else}
						<!-- A ruled register: one line per person, like a planner's address page. -->
						<div
							class="text-muted-foreground border-foreground hidden grid-cols-[minmax(0,1.3fr)_7rem_minmax(0,1.4fr)_minmax(0,1fr)_8rem] gap-4 border-b-2 pb-1.5 text-xs font-bold tracking-[0.12em] uppercase md:grid"
						>
							<span>Name</span><span>Status</span><span>Last visit</span><span>With</span><span
								class="text-right">Next change</span
							>
						</div>
						<ul>
							{#each peopleInTab as person (person.id)}
								{@const statusMark =
									person.status === 'green'
										? 'bg-pen-fitness'
										: person.status === 'yellow'
											? 'bg-pen-warn'
											: person.status === 'red'
												? 'bg-destructive'
												: person.status === 'scheduled'
													? 'bg-pen-mind'
													: person.status === 'exempt'
														? 'bg-muted-foreground'
														: 'bg-muted-foreground/50'}
								{@const statusText =
									person.status === 'green'
										? 'text-pen-fitness'
										: person.status === 'yellow'
											? 'text-pen-warn'
											: person.status === 'red'
												? 'text-destructive'
												: person.status === 'scheduled'
													? 'text-pen-mind'
													: 'text-muted-foreground'}
								<li>
									<a
										href="/visits/{person.id}"
										class="border-rule hover:bg-muted/50 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b py-3 text-sm transition-colors md:grid-cols-[minmax(0,1.3fr)_7rem_minmax(0,1.4fr)_minmax(0,1fr)_8rem] md:items-center"
									>
										<span class="flex min-w-0 items-center gap-2.5 font-black">
											<span class="size-2.5 shrink-0 rounded-[1px] {statusMark}" aria-hidden="true"
											></span>
											<span class="truncate">{person.name}</span>
										</span>
										<span class="text-xs font-bold {statusText}"
											>{getStatusLabel(person.status)}</span
										>
										<span class="text-muted-foreground col-span-2 min-w-0 md:col-span-1">
											{#if isScheduledTab && person.nextFollowUpDate}
												<span class="text-pen-mind font-bold">
													Follow-up {formatDateHeuristic(person.nextFollowUpDate, {
														fallback: 'short'
													})}
												</span>
											{:else if person.lastVisit}
												{formatDateHeuristic(person.lastVisit.date, { fallback: 'short' })}
												{#if person.daysSinceLastVisit !== null}
													<span class="text-xs">({formatTimeSince(person.daysSinceLastVisit)})</span
													>
												{/if}
											{:else}
												No visits logged yet
											{/if}
										</span>
										<span class="text-muted-foreground col-span-2 truncate md:col-span-1">
											{#if person.lastVisit?.companions && person.lastVisit.companions.length > 0}
												<span class="md:hidden">With: </span>{person.lastVisit.companions.join(
													', '
												)}
											{/if}
										</span>
										<span
											class="text-muted-foreground col-span-2 text-xs tabular-nums md:col-span-1 md:text-right"
										>
											{#if person.daysUntilStatusChange !== null}
												{person.daysUntilStatusChange}
												day{person.daysUntilStatusChange !== 1 ? 's' : ''} until
												{person.status === 'green' ? 'overdue' : 'critical'}
											{/if}
										</span>
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</PageShell>
{/if}

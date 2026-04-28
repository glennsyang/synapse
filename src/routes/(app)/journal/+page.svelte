<script lang="ts">
	import {
		Calendar,
		ChartArea,
		CircleX,
		ListFilter,
		Plus,
		Search,
		SmilePlus
	} from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import PageShell from '$lib/components/app/PageShell.svelte';
	import JournalEntryCard from '$lib/components/journal/JournalEntryCard.svelte';
	import MoodDistributionChart from '$lib/components/journal/MoodDistributionChart.svelte';
	import MoodLogForm from '$lib/components/journal/MoodLogForm.svelte';
	import MoodTrendChart from '$lib/components/journal/MoodTrendChart.svelte';
	import PageSkeleton from '$lib/components/skeletons/PageSkeleton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { MoodLogFormValues } from '$lib/schemas/mood';
	import { type MoodPeriod, moodPeriods } from '$lib/utils/mood';
	import type { PageData } from './$types';

	type JournalTab = 'journal' | 'mood';

	type MoodTrendPoint = {
		date: string;
		score: number;
		resolvedMood: string;
		mood: string;
		isCustom: boolean;
		fill: string;
	};

	type MoodDistributionPoint = {
		mood: string;
		count: number;
		fill: string;
		percentage: number;
	};

	type JournalMoodData = {
		selectedPeriod: MoodPeriod;
		rangeLabel: string;
		trendPoints: MoodTrendPoint[];
		distribution: MoodDistributionPoint[];
		todayLog: {
			date: string;
			mood: string;
			resolvedMood: string;
			notes: string | null;
		} | null;
		summary: {
			loggedDays: number;
			totalDays: number;
			coveragePercentage: number;
			currentStreak: number;
			mostFrequentMood: string | null;
			averageScore: number | null;
			scaleHint: string;
		};
	};

	type JournalPageData = PageData & {
		selectedTab: JournalTab;
		filters: {
			content: string;
			date: string;
		};
		moodForm: SuperValidated<MoodLogFormValues>;
		mood: JournalMoodData;
	};

	let { data }: { data: JournalPageData } = $props();

	const periodLabels: Record<MoodPeriod, string> = {
		week: 'This week',
		month: 'This month',
		quarter: 'This quarter'
	};

	let filtersOpen = $state(
		Boolean(page.url.searchParams.get('content')?.trim()) ||
			Boolean(page.url.searchParams.get('date'))
	);
	let contentFilter = $state(page.url.searchParams.get('content') ?? '');
	let contentDebounce = $state<ReturnType<typeof setTimeout> | null>(null);
	let contentDirty = $state(false);

	const activeJournalContent = $derived(page.url.searchParams.get('content') ?? '');
	const activeJournalDate = $derived(page.url.searchParams.get('date') ?? '');
	const hasActiveFilters = $derived(
		Boolean(activeJournalContent.trim()) || Boolean(activeJournalDate)
	);
	const activeTab = $derived.by<JournalTab>(() =>
		page.url.searchParams.get('tab') === 'mood' ? 'mood' : 'journal'
	);
	const showPageSkeleton = $derived(
		navigating.to?.url.pathname === '/journal' && navigating.from?.url.pathname !== '/journal'
	);

	const selectedPeriod = $derived.by<MoodPeriod>(() => {
		const currentPeriod = page.url.searchParams.get('period');
		return moodPeriods.includes(currentPeriod as MoodPeriod)
			? (currentPeriod as MoodPeriod)
			: 'week';
	});

	const clearFiltersHref = $derived.by(() => {
		const nextUrl = buildNextUrl((searchParams) => {
			searchParams.delete('content');
			searchParams.delete('date');
		});

		return nextUrl.toString();
	});

	onDestroy(() => {
		if (contentDebounce) {
			clearTimeout(contentDebounce);
		}
	});

	function buildNextUrl(update: (searchParams: URLSearchParams) => void) {
		const nextUrl = new URL(page.url);
		const nextParams = new URLSearchParams(page.url.searchParams);

		update(nextParams);

		const nextSearch = nextParams.toString();
		nextUrl.search = nextSearch;
		return nextUrl;
	}

	async function openJournalTab(tab: JournalTab) {
		const nextUrl = buildNextUrl((searchParams) => {
			if (tab === 'journal') {
				searchParams.delete('tab');
				return;
			}

			searchParams.set('tab', tab);
		});

		await goto(nextUrl.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	function handleContentInput(event: Event) {
		const currentTarget = event.currentTarget;
		if (!(currentTarget instanceof HTMLInputElement)) {
			return;
		}

		contentFilter = currentTarget.value;
		queueContentFilterUpdate();
	}

	function queueContentFilterUpdate() {
		contentDirty = true;
		if (contentDebounce) {
			clearTimeout(contentDebounce);
		}

		contentDebounce = setTimeout(() => {
			void applyContentFilter();
		}, 250);
	}

	async function applyContentFilter() {
		if (contentDebounce) {
			clearTimeout(contentDebounce);
			contentDebounce = null;
		}

		const normalizedContent = contentFilter.trim();
		if (normalizedContent === activeJournalContent) {
			contentDirty = false;
			return;
		}

		const nextUrl = buildNextUrl((searchParams) => {
			if (normalizedContent) {
				searchParams.set('content', normalizedContent);
			} else {
				searchParams.delete('content');
			}
		});

		try {
			await goto(nextUrl.toString(), { replaceState: true, noScroll: true, keepFocus: true });
		} finally {
			contentDirty = false;
		}
	}

	async function handleDateChange(event: Event) {
		const currentTarget = event.currentTarget;
		if (!(currentTarget instanceof HTMLInputElement)) {
			return;
		}

		const nextDate = currentTarget.value;
		const nextUrl = buildNextUrl((searchParams) => {
			if (nextDate) {
				searchParams.set('date', nextDate);
			} else {
				searchParams.delete('date');
			}
		});

		await goto(nextUrl.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function handlePeriodChange(nextPeriod: string) {
		if (!moodPeriods.includes(nextPeriod as MoodPeriod)) {
			return;
		}

		const nextUrl = buildNextUrl((searchParams) => {
			searchParams.set('tab', 'mood');

			if (nextPeriod === 'week') {
				searchParams.delete('period');
				return;
			}

			searchParams.set('period', nextPeriod);
		});

		await goto(nextUrl.toString());
	}
</script>

{#if showPageSkeleton}
	<PageSkeleton color="blue" />
{:else}
	<PageShell class="min-w-0 overflow-x-hidden">
		<div class="mobile-stack mb-4 justify-between gap-3 sm:mb-5 sm:flex-wrap lg:flex-nowrap">
			<div class="min-w-0 flex-1">
				<h1 class="font-display text-2xl font-bold sm:text-3xl">Journal</h1>
				<p class="text-sm text-muted-foreground sm:text-base">
					A reflective archive of days, fragments, and fully formed thoughts, arranged like a living
					stack of pages
				</p>
			</div>
			<div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
				<Button
					href="/journal/new"
					class="min-w-0 flex-1 bg-blue-600 hover:bg-blue-700 sm:flex-none"
				>
					<Plus class="mr-2 h-4 w-4" />
					New Entry
				</Button>
				{#if activeTab === 'journal'}
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
										(filtersOpen || hasActiveFilters) &&
											'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20'
									]}
								>
									<ListFilter class="size-4" />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Toggle filters</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</div>
		</div>

		<Tabs.Root value={activeTab} class="w-full gap-3">
			<Tabs.List
				class="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/75 p-1 text-muted-foreground"
			>
				<Tabs.Trigger
					value="journal"
					class="w-full justify-center font-display border-b-2 border-transparent data-[state=active]:border-blue-500"
					onclick={() => {
						if (activeTab !== 'journal') {
							void openJournalTab('journal');
						}
					}}
				>
					<Calendar class="h-4 w-4" />
					<span>Journal</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="mood"
					class="w-full justify-center font-display border-b-2 border-transparent data-[state=active]:border-blue-500"
					onclick={() => {
						if (activeTab !== 'mood') {
							void openJournalTab('mood');
						}
					}}
				>
					<SmilePlus class="h-4 w-4" />
					<span>Mood</span>
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="journal" class="mt-0 space-y-4">
				{#if activeTab === 'journal'}
					<Collapsible.Root bind:open={filtersOpen}>
						<Collapsible.Content class="w-full">
							<div
								id="journal-filter-bar"
								class="grid gap-4 rounded-3xl border border-blue-200/80 bg-blue-50/55 p-4 shadow-[0_18px_60px_-42px_rgba(59,130,246,0.35)] backdrop-blur-xl dark:border-blue-500/25 dark:bg-blue-500/8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
							>
								<div class="min-w-0 w-full">
									<div class="relative">
										<Search
											class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											id="journal-content-filter"
											type="search"
											value={contentDirty ? contentFilter : activeJournalContent}
											oninput={handleContentInput}
											aria-label="Search journal entries by content"
											placeholder="Search the words inside your entries"
											maxlength={200}
											class="h-11 bg-background/90 pl-9"
										/>
									</div>
								</div>

								<div class="flex flex-col gap-3 sm:flex-row lg:justify-self-end">
									<Input
										id="journal-date-filter"
										type="date"
										value={activeJournalDate}
										onchange={handleDateChange}
										aria-label="Filter journal entries by date"
										class="h-11 min-w-44"
									/>
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													type="button"
													variant="outline"
													size="icon"
													href={clearFiltersHref}
													class="h-10 border-blue-200/70 bg-blue-50 text-blue-800 hover:bg-blue-100"
													aria-label="Clear journal filters"
												>
													<CircleX class="h-4 w-4" />
												</Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>Clear filters</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</div>
						</Collapsible.Content>
					</Collapsible.Root>
				{/if}

				<div class="space-y-4">
					{#if data.entries.length === 0}
						<div
							class="rounded-3xl border border-dashed border-blue-200/80 bg-white/82 p-10 text-center shadow-[0_18px_60px_-48px_rgba(59,130,246,0.35)] backdrop-blur-xl dark:border-blue-400/20 dark:bg-slate-950/62"
						>
							<Calendar class="mx-auto h-12 w-12 text-[oklch(var(--color-blue)/0.75)]" />
							<p class="font-display mt-4 text-2xl font-semibold tracking-tight">
								No pages in this slice of the archive yet.
							</p>
							<p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
								Try a different phrase or date, or start a new entry to keep the chronicle moving.
							</p>
							<Button
								href="/journal/new"
								class="mt-5 border-blue-200/70 bg-blue-50 text-blue-800 hover:bg-blue-100"
								variant="outline"
							>
								<Plus class="mr-2 h-4 w-4" />
								Create First Entry
							</Button>
						</div>
					{:else}
						<div class="columns-1 gap-4 sm:columns-2">
							{#each data.entries as entry (entry.id)}
								<div class="mb-4 break-inside-avoid"><JournalEntryCard {entry} /></div>
							{/each}
						</div>
					{/if}
				</div>
			</Tabs.Content>

			<Tabs.Content value="mood" class="mt-4 min-w-0">
				<div class="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] md:items-start">
					<div class="space-y-6">
						<MoodLogForm form={data.moodForm} todayLog={data.mood.todayLog} />

						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<ChartArea class="h-4 w-4 text-[oklch(var(--color-blue))]" />
								<span>{data.mood.rangeLabel}</span>
							</div>

							<div class="w-full sm:w-48">
								<Select.Root
									type="single"
									value={selectedPeriod}
									onValueChange={(value) => void handlePeriodChange(value)}
								>
									<Select.Trigger class="w-full">{periodLabels[selectedPeriod]}</Select.Trigger>
									<Select.Content>
										{#each moodPeriods as period (period)}
											<Select.Item value={period} label={periodLabels[period]}>
												{periodLabels[period]}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</div>

						<MoodTrendChart
							points={data.mood.trendPoints}
							rangeLabel={data.mood.rangeLabel}
							averageScore={data.mood.summary.averageScore}
						/>
					</div>

					<div class="space-y-4">
						<Card.Root>
							<Card.Header class="pb-2">
								<Card.Title class="text-sm font-medium">Most frequent mood</Card.Title>
							</Card.Header>
							<Card.Content>
								<p class="font-display text-3xl font-bold">
									{data.mood.summary.mostFrequentMood ?? 'None yet'}
								</p>
								<p class="mt-1 text-sm text-muted-foreground">
									Average score: {data.mood.summary.averageScore ?? '—'}
								</p>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<ChartArea class="h-4 w-4" />
									<span>{data.mood.rangeLabel}</span>
								</div>
							</Card.Content>
						</Card.Root>

						<MoodDistributionChart
							distribution={data.mood.distribution}
							rangeLabel={data.mood.rangeLabel}
							totalLogs={data.mood.summary.loggedDays}
							mostFrequentMood={data.mood.summary.mostFrequentMood}
						/>
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</PageShell>
{/if}

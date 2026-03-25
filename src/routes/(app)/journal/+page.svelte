<script lang="ts">
import CalendarIcon from '@lucide/svelte/icons/calendar';
import ChartArea from '@lucide/svelte/icons/chart-area';
import ChevronDown from '@lucide/svelte/icons/chevron-down';
import FilterIcon from '@lucide/svelte/icons/filter';
import Plus from '@lucide/svelte/icons/plus';
import SmilePlus from '@lucide/svelte/icons/smile-plus';
import type { SuperValidated } from 'sveltekit-superforms';
import { goto, replaceState } from '$app/navigation';
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
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select';
import * as Tabs from '$lib/components/ui/tabs';
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
		tag: string;
		startDate: string;
		endDate: string;
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

let filtersOpen = $state(false);

const activeTab = $derived.by<JournalTab>(() =>
	page.url.searchParams.get('tab') === 'mood' ? 'mood' : 'journal'
);

const selectedPeriod = $derived.by<MoodPeriod>(() => {
	const currentPeriod = page.url.searchParams.get('period');
	return moodPeriods.includes(currentPeriod as MoodPeriod) ? (currentPeriod as MoodPeriod) : 'week';
});

const clearFiltersHref = $derived.by(() => {
	const nextUrl = buildNextUrl((searchParams) => {
		searchParams.delete('tag');
		searchParams.delete('startDate');
		searchParams.delete('endDate');
	});

	return nextUrl.toString();
});

function buildNextUrl(update: (searchParams: URLSearchParams) => void) {
	const nextUrl = new URL(page.url);
	const nextParams = new URLSearchParams(page.url.searchParams);

	update(nextParams);

	const nextSearch = nextParams.toString();
	nextUrl.search = nextSearch;
	return nextUrl;
}

function handleTabChange(value: string) {
	const nextTab: JournalTab = value === 'mood' ? 'mood' : 'journal';

	if (typeof window === 'undefined') {
		return;
	}

	const nextUrl = buildNextUrl((searchParams) => {
		if (nextTab === 'journal') {
			searchParams.delete('tab');
			return;
		}

		searchParams.set('tab', nextTab);
	});

	replaceState(nextUrl, page.state);
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

{#if navigating.to?.url.pathname === '/journal'}
	<PageSkeleton color="blue" />
{:else}
	<PageShell class="space-y-6 sm:py-6">
		<div class="space-y-3">
			<div class="mobile-stack justify-between">
				<h1 class="font-display text-2xl font-bold sm:text-3xl">Journal</h1>
				<Button href="/journal/new" class="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
					<Plus class="mr-2 h-4 w-4" />
					New Entry
				</Button>
			</div>
			<p class="max-w-2xl text-sm text-muted-foreground sm:text-base">
				Markdown-friendly entries and daily mood tracking designed for low-friction reflection.
			</p>
		</div>

		<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="w-full gap-3">
			<Tabs.List
				class="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/75 p-1 text-muted-foreground"
			>
				<Tabs.Trigger
					value="journal"
					class="w-full justify-center border-b-2 border-transparent font-display data-[state=active]:border-blue-500"
				>
					<CalendarIcon class="h-4 w-4" />
					<span>Journal</span>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="mood"
					class="w-full justify-center border-b-2 border-transparent font-display data-[state=active]:border-blue-500"
				>
					<SmilePlus class="h-4 w-4" />
					<span>Mood</span>
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="journal" class="mt-6 space-y-4">
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
						<form
							method="GET"
							action="/journal"
							class="space-y-4 rounded-lg border border-blue-200 bg-blue-500/5 p-4 dark:border-blue-800"
						>
							{#if selectedPeriod !== 'week'}
								<input type="hidden" name="period" value={selectedPeriod}>
							{/if}
							<div class="responsive-grid-3">
								<div class="space-y-2">
									<Label for="tag">Mood Tag</Label>
									<Input
										id="tag"
										name="tag"
										type="text"
										value={data.filters.tag}
										placeholder="e.g., calm"
									/>
								</div>
								<div class="space-y-2">
									<Label for="startDate">Start Date</Label>
									<Input
										id="startDate"
										name="startDate"
										type="date"
										value={data.filters.startDate}
									/>
								</div>
								<div class="space-y-2">
									<Label for="endDate">End Date</Label>
									<Input id="endDate" name="endDate" type="date" value={data.filters.endDate} />
								</div>
							</div>
							<div class="mobile-stack">
								<Button type="submit" class="w-full sm:w-auto">Apply Filters</Button>
								<Button variant="outline" href={clearFiltersHref} class="w-full sm:w-auto"
									>Clear</Button
								>
							</div>
						</form>
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
			</Tabs.Content>

			<Tabs.Content value="mood" class="mt-6 space-y-6">
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

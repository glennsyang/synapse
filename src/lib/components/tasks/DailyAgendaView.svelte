<script lang="ts">
import {
	CalendarDays,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Pencil,
	Plus,
	Save,
	Trash2,
	TrendingDown,
	TrendingUp,
	X
} from '@lucide/svelte';
import type { ActionResult } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

import { applyAction, enhance } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Collapsible from '$lib/components/ui/collapsible';
import * as Dialog from '$lib/components/ui/dialog';
import { Input } from '$lib/components/ui/input';
import type { DailyAgendaData, DailyAgendaEntry, DailyAgendaTemplate } from '$lib/types';
import { cn } from '$lib/utils';
import { getStartOfWeek } from '$lib/utils/date';

import DailyAgendaChart from './DailyAgendaChart.svelte';
import DailyAgendaRadial from './DailyAgendaRadial.svelte';

interface Props {
	agenda: DailyAgendaData;
	defaultsDialogOpen?: boolean;
}

let { agenda, defaultsDialogOpen = $bindable(false) }: Props = $props();

let newTemplateTitle = $state('');
let editingTemplateId = $state<string | null>(null);
let editingTemplateTitle = $state('');
let newEntryDate = $state<string | null>(null);
let newEntryTitle = $state('');
let editingEntryId = $state<string | null>(null);
let editingEntryTitle = $state('');
let heroOpen = $state(true);

function calculateAverageCompletion(points: Array<{ completionPercentage: number }>): number {
	return points.length === 0
		? 0
		: Math.round(
				points.reduce((total, point) => total + point.completionPercentage, 0) / points.length
			);
}

const overallCompletionPercentage = $derived(
	Math.min(Math.max(agenda.overallCompletionPercentage, 0), 100)
);
const remainingAgendaItemCount = $derived(
	Math.max(agenda.overallTotalCount - agenda.overallCompletedCount, 0)
);
const activeDayCount = $derived(agenda.days.filter((day) => day.totalCount > 0).length);
const bestDay = $derived(
	agenda.days.reduce<DailyAgendaData['days'][number] | null>((best, day) => {
		if (day.totalCount === 0) {
			return best;
		}

		if (
			!best ||
			day.completionPercentage > best.completionPercentage ||
			(day.completionPercentage === best.completionPercentage &&
				day.completedCount > best.completedCount)
		) {
			return day;
		}

		return best;
	}, null)
);
const todayAgendaDay = $derived(agenda.days.find((day) => day.isToday) ?? null);
const currentWindowPoints = $derived(agenda.chartPoints.slice(-7));
const previousWindowPoints = $derived(
	agenda.chartPoints.slice(0, Math.max(agenda.chartPoints.length - 7, 0))
);
const currentWindowAverage = $derived(calculateAverageCompletion(currentWindowPoints));
const previousWindowAverage = $derived(calculateAverageCompletion(previousWindowPoints));
const completionDelta = $derived(currentWindowAverage - previousWindowAverage);
const momentumLabel = $derived.by(() => {
	if (agenda.overallTotalCount === 0) {
		return 'Fresh canvas';
	}

	if (overallCompletionPercentage >= 80) {
		return 'Locked in';
	}

	if (overallCompletionPercentage >= 55) {
		return 'Strong rhythm';
	}

	if (overallCompletionPercentage >= 30) {
		return 'Building heat';
	}

	return 'Just warming up';
});
const heroSummary = $derived.by(() => {
	if (agenda.overallTotalCount === 0) {
		return agenda.isCurrentWeek
			? 'Seed this week with a few defaults or a day-only item and the planner will start to glow.'
			: 'This archived week closed without any agenda items on the board.';
	}

	const todayText = agenda.isCurrentWeek
		? todayAgendaDay
			? todayAgendaDay.totalCount === 0
				? 'Today is still open for its first agenda item.'
				: `${todayAgendaDay.completedCount} of ${todayAgendaDay.totalCount} items are done today.`
			: 'Today is still open for its first agenda item.'
		: 'Archive mode keeps this week read only.';
	const bestDayText = bestDay
		? `${bestDay.dayName} currently leads the week at ${bestDay.completionPercentage}%.`
		: 'No day has separated itself yet.';
	const deltaAbs = Math.abs(completionDelta);
	const trendText =
		previousWindowPoints.length === 0
			? 'A prior ribbon is not available yet.'
			: completionDelta > 0
				? `${deltaAbs} points brighter than the previous 7 days.`
				: completionDelta < 0
					? `${deltaAbs} points softer than the previous 7 days.`
					: 'Tracking even with the previous 7 days.';

	return `${todayText} ${bestDayText} ${trendText}`;
});
const todayMetricTitle = $derived(agenda.isCurrentWeek ? 'Today' : 'Active days');
const todayMetricValue = $derived(
	agenda.isCurrentWeek && todayAgendaDay
		? `${todayAgendaDay.completionPercentage}%`
		: `${activeDayCount}`
);
const todayMetricDetail = $derived.by(() => {
	if (agenda.isCurrentWeek && todayAgendaDay) {
		if (todayAgendaDay.totalCount === 0) {
			return 'Open canvas today';
		}

		return `${todayAgendaDay.completedCount} of ${todayAgendaDay.totalCount} finished`;
	}

	if (agenda.isCurrentWeek) {
		return 'Nothing scheduled yet';
	}

	return activeDayCount === 0 ? 'No scheduled days' : `${activeDayCount} days carry items`;
});
const trendMetricValue = $derived(
	agenda.overallTotalCount === 0
		? '0 pts'
		: `${completionDelta > 0 ? '+' : ''}${completionDelta} pts`
);
const trendMetricDetail = $derived(
	previousWindowPoints.length === 0
		? 'No prior ribbon yet'
		: completionDelta > 0
			? 'Brighter than the prior 7 days'
			: completionDelta < 0
				? 'Softer than the prior 7 days'
				: 'Even with the prior 7 days'
);
const radialTodayLabel = $derived.by(() => {
	if (!agenda.isCurrentWeek) {
		return 'Archive snapshot';
	}

	if (!todayAgendaDay || todayAgendaDay.totalCount === 0) {
		return 'Today is open';
	}

	return `${todayAgendaDay.shortDayName} ${todayAgendaDay.completedCount}/${todayAgendaDay.totalCount}`;
});
const radialTodayCompletion = $derived(
	!agenda.isCurrentWeek || !todayAgendaDay || todayAgendaDay.totalCount === 0
		? null
		: todayAgendaDay.completionPercentage
);
const heroCollapsedSummary = $derived.by(() => {
	if (agenda.overallTotalCount === 0) {
		return agenda.isCurrentWeek ? 'No items scheduled yet' : 'Empty archive week';
	}

	return `${overallCompletionPercentage}% complete, ${agenda.overallCompletedCount}/${agenda.overallTotalCount} closed`;
});

type AgendaActionData = {
	agendaAction?: {
		type?: 'success' | 'error' | 'validation-error';
		text?: string;
	};
};

type AgendaEnhanceResult = ActionResult<AgendaActionData, AgendaActionData>;

type AgendaEnhanceCallbackArgs = {
	result: AgendaEnhanceResult;
};

function buildAgendaHref(weekStart: string): string {
	const url = new URL(page.url);
	url.searchParams.set('tab', 'agenda');
	url.searchParams.set('week', weekStart);
	return `${url.pathname}?${url.searchParams.toString()}`;
}

function buildAgendaActionHref(actionName: string): string {
	const url = new URL(page.url);
	const searchParams = new URLSearchParams(url.searchParams);

	for (const key of Array.from(searchParams.keys())) {
		if (key.startsWith('/')) {
			searchParams.delete(key);
		}
	}

	searchParams.set('tab', 'agenda');
	searchParams.set('week', agenda.weekStart);

	const query = searchParams.toString();
	return `${url.pathname}?/${actionName}${query ? `&${query}` : ''}`;
}

function createAgendaEnhance(options: {
	successMessage?: string;
	errorMessage?: string;
	silentSuccess?: boolean;
	afterSuccess?: () => void;
	afterFailure?: () => void;
}) {
	return () => {
		return async ({ result }: AgendaEnhanceCallbackArgs) => {
			const message =
				result.type === 'success' || result.type === 'failure'
					? result.data?.agendaAction?.text
					: undefined;

			if (result.type === 'success') {
				options.afterSuccess?.();
				if (!options.silentSuccess && options.successMessage) {
					toast.success(typeof message === 'string' ? message : options.successMessage);
				}
				await invalidateAll();
				await applyAction(result);
				return;
			}

			if (result.type === 'failure') {
				toast.error(
					typeof message === 'string'
						? message
						: (options.errorMessage ?? 'Unable to save Daily Agenda changes.')
				);
				options.afterFailure?.();
				await applyAction(result);
				return;
			}

			if (result.type === 'error') {
				toast.error(options.errorMessage ?? 'Unable to save Daily Agenda changes.');
				options.afterFailure?.();
			}

			await applyAction(result);
		};
	};
}

function startTemplateEdit(template: DailyAgendaTemplate) {
	editingTemplateId = template.id;
	editingTemplateTitle = template.title;
}

function cancelTemplateEdit() {
	editingTemplateId = null;
	editingTemplateTitle = '';
}

function openNewEntry(date: string) {
	newEntryDate = date;
	newEntryTitle = '';
	editingEntryId = null;
	editingEntryTitle = '';
}

function cancelNewEntry() {
	newEntryDate = null;
	newEntryTitle = '';
}

function startEntryEdit(entry: DailyAgendaEntry) {
	editingEntryId = entry.id;
	editingEntryTitle = entry.title;
	newEntryDate = null;
	newEntryTitle = '';
}

function cancelEntryEdit() {
	editingEntryId = null;
	editingEntryTitle = '';
}

function confirmDelete(event: MouseEvent, message: string) {
	if (!window.confirm(message)) {
		event.preventDefault();
	}
}

function getEntrySurfaceClass(entry: DailyAgendaEntry): string {
	return entry.sourceType === 'default'
		? 'bg-slate-100/95 ring-slate-300/70 dark:bg-slate-900/85 dark:ring-slate-700/70'
		: 'bg-background/90 ring-border/60 dark:bg-background/82';
}
</script>

<div class="space-y-4">
	<section
		class={cn(
			'relative isolate overflow-hidden rounded-[1.65rem] border border-orange-200/80 bg-linear-to-br from-orange-50/95 via-background to-amber-50/80 shadow-[0_24px_64px_-38px_rgba(249,115,22,0.28)] dark:border-orange-500/22 dark:from-orange-500/10 dark:via-background dark:to-amber-500/5 dark:shadow-[0_24px_64px_-42px_rgba(249,115,22,0.18)]',
			heroOpen ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'
		)}
	>
		<div
			class="absolute -left-14 top-0 size-40 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/12"
		></div>
		<div
			class="absolute right-0 top-1/3 size-36 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-400/10"
		></div>
		<div
			class="absolute inset-x-6 top-5 h-px bg-linear-to-r from-transparent via-orange-300/60 to-transparent dark:via-orange-400/25"
		></div>

		<Collapsible.Root bind:open={heroOpen}>
			<div class="relative space-y-4">
				<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div class="flex flex-wrap items-center gap-2.5">
						<Badge
							variant="orange"
							class="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
						>
							Daily Agenda
						</Badge>
						<span
							class={cn(
								'inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur',
								agenda.isCurrentWeek
									? 'border-orange-300/70 bg-[oklch(var(--color-orange)/0.12)] text-[oklch(var(--color-orange))] dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-200'
									: 'border-border/70 bg-background/70 text-muted-foreground dark:bg-background/55'
							)}
						>
							{agenda.isCurrentWeek ? 'Current week' : 'Archive snapshot'}
						</span>
						{#if !heroOpen}
							<span
								class="inline-flex rounded-full border border-orange-200/80 bg-background/75 px-3 py-1 text-[10px] font-medium tracking-[0.04em] text-muted-foreground backdrop-blur dark:border-orange-500/20 dark:bg-background/65"
							>
								{heroCollapsedSummary}
							</span>
						{/if}
					</div>

					<div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
						<div
							class="flex min-w-0 items-center gap-1.5 rounded-[1.1rem] border border-orange-200/80 bg-background/78 p-1.5 shadow-xs backdrop-blur dark:border-orange-500/20 dark:bg-background/70"
						>
							<Button
								href={buildAgendaHref(agenda.previousWeekStart)}
								variant="outline"
								size="icon"
								class="size-10 rounded-2xl border-orange-200/70 bg-background/85 hover:bg-orange-50/80 dark:border-orange-500/20 dark:bg-background/70 dark:hover:bg-orange-500/10"
							>
								<ChevronLeft class="size-4" />
							</Button>
							<div class="min-w-0 px-2 text-center sm:min-w-56">
								<p
									class="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
								>
									Week window
								</p>
								<p
									class="mt-1 font-display text-sm font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-base"
								>
									{agenda.weekLabel}
								</p>
							</div>
							<Button
								href={buildAgendaHref(agenda.nextWeekStart)}
								variant="outline"
								size="icon"
								class="size-10 rounded-2xl border-orange-200/70 bg-background/85 hover:bg-orange-50/80 dark:border-orange-500/20 dark:bg-background/70 dark:hover:bg-orange-500/10"
							>
								<ChevronRight class="size-4" />
							</Button>
						</div>

						{#if !agenda.isCurrentWeek}
							<Button
								href={buildAgendaHref(getStartOfWeek())}
								variant="outline"
								class="h-11 rounded-full border-orange-200/80 bg-background/78 px-4 text-[oklch(var(--color-orange))] shadow-xs backdrop-blur hover:bg-orange-50/80 dark:border-orange-500/20 dark:bg-background/70 dark:text-orange-200 dark:hover:bg-orange-500/10"
							>
								<CalendarDays class="mr-2 size-4" />
								Jump to current week
							</Button>
						{/if}

						<Button
							type="button"
							variant="outline"
							class="h-11 rounded-full border-orange-200/80 bg-background/78 px-4 text-foreground shadow-xs backdrop-blur hover:bg-orange-50/80 dark:border-orange-500/20 dark:bg-background/70 dark:hover:bg-orange-500/10"
							aria-controls="daily-agenda-hero-body"
							aria-expanded={heroOpen}
							onclick={() => (heroOpen = !heroOpen)}
						>
							<ChevronDown
								class={cn('ml-2 size-4 transition-transform duration-200', heroOpen && 'rotate-180')}
							/>
						</Button>
					</div>
				</div>

				<Collapsible.Content id="daily-agenda-hero-body" class="overflow-hidden">
					<div
						class="grid gap-5 pt-1 xl:grid-cols-[minmax(0,1.16fr)_minmax(18.5rem,0.84fr)] xl:items-stretch xl:gap-6"
					>
						<div class="min-w-0 space-y-5">
							<div class="space-y-4">
								<p
									class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[oklch(var(--color-orange))]"
								>
									Weekly focus
								</p>

								{#if agenda.overallTotalCount === 0}
									<div class="space-y-3">
										<h2
											class="max-w-xl font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl xl:text-[3.65rem]"
										>
											Ready to seed the week.
										</h2>
										<p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
											{heroSummary}
										</p>
									</div>
								{:else}
									<div class="space-y-3">
										<div class="flex flex-wrap items-end gap-3 sm:gap-4">
											<div class="flex items-end gap-2.5">
												<span
													class="font-display text-5xl font-semibold tracking-[-0.08em] text-[oklch(var(--color-orange))] [text-shadow:0_0_28px_rgba(249,115,22,0.18)] sm:text-6xl xl:text-[5rem]"
												>
													{agenda.overallCompletedCount}
												</span>
												<span
													class="pb-2 font-display text-2xl tracking-[-0.04em] text-muted-foreground sm:text-3xl"
												>
													/ {agenda.overallTotalCount}
												</span>
											</div>

											<div class="pb-2">
												<p
													class="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
												>
													Agenda items closed this week
												</p>
												<h2
													class="mt-1 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl"
												>
													{momentumLabel}
												</h2>
											</div>
										</div>

										<p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
											{heroSummary}
										</p>
									</div>
								{/if}
							</div>

							<div class="grid gap-3 sm:grid-cols-2 min-[1500px]:grid-cols-4">
								<div
									class="rounded-[1.15rem] border border-orange-200/80 bg-orange-50/80 px-4 py-3.5 shadow-xs dark:border-orange-500/20 dark:bg-orange-500/8"
								>
									<p
										class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
									>
										Completed
									</p>
									<p
										class="mt-3 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
									>
										{agenda.overallCompletedCount}
									</p>
									<p class="mt-2 text-xs leading-5 text-muted-foreground">
										Closed across the ribbon
									</p>
								</div>

								<div
									class="rounded-[1.15rem] border border-border/70 bg-background/78 px-4 py-3.5 shadow-xs backdrop-blur dark:bg-background/70"
								>
									<p
										class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
									>
										Remaining
									</p>
									<p
										class="mt-3 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
									>
										{remainingAgendaItemCount}
									</p>
									<p class="mt-2 text-xs leading-5 text-muted-foreground">
										Still waiting this week
									</p>
								</div>

								<div
									class="rounded-[1.15rem] border border-orange-200/70 bg-background/78 px-4 py-3.5 shadow-xs backdrop-blur dark:border-orange-500/18 dark:bg-background/70"
								>
									<p
										class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
									>
										{todayMetricTitle}
									</p>
									<p
										class="mt-3 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
									>
										{todayMetricValue}
									</p>
									<p class="mt-2 text-xs leading-5 text-muted-foreground">{todayMetricDetail}</p>
								</div>

								<div
									class="rounded-[1.15rem] border border-orange-200/70 bg-linear-to-br from-background via-orange-50/70 to-orange-100/70 px-4 py-3.5 shadow-xs dark:border-orange-500/18 dark:from-background dark:via-orange-500/6 dark:to-orange-500/10"
								>
									<div class="flex items-start justify-between gap-3">
										<div>
											<p
												class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
											>
												Ribbon shift
											</p>
											<p
												class="mt-3 font-display text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl"
											>
												{trendMetricValue}
											</p>
										</div>

										{#if completionDelta > 0}
											<TrendingUp class="mt-1 size-5 text-emerald-600 dark:text-emerald-300" />
										{:else if completionDelta < 0}
											<TrendingDown class="mt-1 size-5 text-amber-600 dark:text-amber-300" />
										{/if}
									</div>
									<p class="mt-2 text-xs leading-5 text-muted-foreground">{trendMetricDetail}</p>
								</div>
							</div>
						</div>

						<DailyAgendaRadial
							completionPercentage={overallCompletionPercentage}
							completedCount={agenda.overallCompletedCount}
							remainingCount={remainingAgendaItemCount}
							totalCount={agenda.overallTotalCount}
							{activeDayCount}
							bestDayLabel={bestDay ? bestDay.dayName : 'No standout day yet'}
							bestDayCompletion={bestDay?.completionPercentage ?? 0}
							todayCompletion={radialTodayCompletion}
							todayLabel={radialTodayLabel}
							trendDelta={completionDelta}
							{momentumLabel}
						/>
					</div>
				</Collapsible.Content>
			</div>
		</Collapsible.Root>
	</section>

	<div>
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 min-[1200px]:grid-cols-7">
			{#each agenda.days as day (day.date)}
				<section
					class={cn(
						'flex min-w-0 flex-col rounded-[1.2rem] border border-orange-200/75 bg-background/95 p-3 shadow-sm dark:border-orange-500/18 dark:bg-background/92',
						day.isToday &&
							'border-orange-300 bg-linear-to-br from-orange-50/85 via-background to-orange-100/55 dark:border-orange-400/35 dark:from-orange-500/10 dark:to-orange-500/5',
						!day.isEditable && 'bg-slate-50/85 dark:bg-slate-950/25'
					)}
				>
					<div class="mb-2.5 flex items-start justify-between gap-2">
						<div>
							<p
								class="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
							>
								{day.shortDayName}
							</p>
							<div class="mt-0.5 flex items-baseline gap-1.5">
								<h3
									class="font-display text-2xl font-semibold leading-none tracking-[-0.03em] text-foreground"
								>
									{day.dayNumber}
								</h3>
								<span class="text-xs text-muted-foreground">{day.monthLabel}</span>
							</div>
						</div>
						<Badge
							variant={day.completionPercentage >= 80
								? 'green'
								: day.completionPercentage >= 40
									? 'orange'
									: 'outline'}
						>
							{day.completionPercentage}%
						</Badge>
					</div>

					<div class="mb-3">
						<div class="h-1.5 rounded-full bg-orange-100/80 dark:bg-orange-500/12">
							<div
								class="h-full rounded-full bg-orange-500 transition-[width]"
								style={`width: ${day.completionPercentage}%`}
							></div>
						</div>
						<p class="mt-1.5 text-[11px] text-muted-foreground">
							{day.completedCount}
							of {day.totalCount} complete
						</p>
					</div>

					<div class="flex flex-1 flex-col gap-2">
						{#if day.entries.length === 0}
							<div
								class="rounded-lg border border-dashed border-orange-200/80 bg-background/75 px-2.5 py-3 text-xs text-muted-foreground dark:border-orange-500/18"
							>
								{day.isEditable
									? 'No agenda items yet. Add a day-only item below.'
									: 'No agenda items were captured for this historical day.'}
							</div>
						{/if}

						{#each day.entries as entry (entry.id)}
							{#if editingEntryId === entry.id}
								<form
									method="POST"
									action={buildAgendaActionHref('updateAgendaEntry')}
									use:enhance={createAgendaEnhance({
										successMessage: 'Agenda item updated.',
										errorMessage: 'Unable to update agenda item.',
										afterSuccess: cancelEntryEdit
									})}
									class="rounded-lg border border-orange-200/80 bg-background/90 p-2.5 shadow-xs dark:border-orange-500/20"
								>
									<input type="hidden" name="id" value={entry.id}>
									<Input
										name="title"
										bind:value={editingEntryTitle}
										maxlength={200}
										required
										placeholder="Update day-only item"
									/>
									<div class="mt-2 flex items-center justify-end gap-2">
										<Button
											type="submit"
											size="icon-sm"
											class="bg-orange-600 hover:bg-orange-700"
											aria-label="Save agenda item changes"
										>
											<Save class="size-4" />
										</Button>
										<Button
											type="button"
											size="icon-sm"
											variant="outline"
											aria-label="Cancel editing agenda item"
											onclick={cancelEntryEdit}
										>
											<X class="size-4" />
										</Button>
									</div>
								</form>
							{:else}
								<div
									class={cn(
										'group flex items-start gap-2 rounded-lg px-2 py-1.5 shadow-xs ring-1 backdrop-blur-sm transition-colors',
										getEntrySurfaceClass(entry)
									)}
								>
									<form
										method="POST"
										action={buildAgendaActionHref('toggleAgendaEntry')}
										use:enhance={createAgendaEnhance({
											errorMessage: 'Unable to update agenda item.',
											silentSuccess: true
										})}
										class="shrink-0"
									>
										<input type="hidden" name="id" value={entry.id}>
										<input
											type="hidden"
											name="completed"
											value={entry.completed ? 'false' : 'true'}
										>
										<input
											type="checkbox"
											checked={entry.completed}
											disabled={!day.isEditable}
											class="h-3.5 w-3.5 rounded border-orange-300 text-orange-600 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
											onchange={(event) => event.currentTarget.form?.requestSubmit()}
										>
									</form>
									<div class="min-w-0 flex-1">
										<div class="flex min-h-3.5 items-center">
											<p
												class={cn(
													'text-xs leading-4 text-foreground wrap-break-word',
													entry.completed && 'text-muted-foreground line-through'
												)}
											>
												{entry.title}
											</p>
										</div>
										{#if !day.isEditable}
											<p class="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
												View only
											</p>
										{/if}
									</div>

									{#if day.isEditable && entry.sourceType === 'custom'}
										<div
											class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
										>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												class="size-7"
												onclick={() => startEntryEdit(entry)}
											>
												<Pencil class="size-4" />
											</Button>
											<form
												method="POST"
												action={buildAgendaActionHref('deleteAgendaEntry')}
												use:enhance={createAgendaEnhance({
													successMessage: 'Agenda item deleted.',
													errorMessage: 'Unable to delete agenda item.',
													afterSuccess: () => {
														if (editingEntryId === entry.id) {
															cancelEntryEdit();
														}
													}
												})}
											>
												<input type="hidden" name="id" value={entry.id}>
												<Button
													type="submit"
													variant="destructive"
													size="icon"
													class="size-7"
													aria-label="Delete day-only agenda item"
													onclick={(event) => confirmDelete(event, 'Delete this day-only agenda item?')}
												>
													<Trash2 class="size-4" />
												</Button>
											</form>
										</div>
									{/if}
								</div>
							{/if}
						{/each}

						{#if newEntryDate === day.date}
							<form
								method="POST"
								action={buildAgendaActionHref('createAgendaEntry')}
								use:enhance={createAgendaEnhance({
									successMessage: 'Agenda item added.',
									errorMessage: 'Unable to add agenda item.',
									afterSuccess: cancelNewEntry
								})}
								class="rounded-lg border border-orange-200/80 bg-background/92 p-2.5 shadow-xs dark:border-orange-500/20"
							>
								<input type="hidden" name="date" value={day.date}>
								<Input
									name="title"
									bind:value={newEntryTitle}
									placeholder={`Add something for ${day.dayName.toLowerCase()}`}
									maxlength={200}
									required
								/>
								<div class="mt-2 flex items-center justify-end gap-2">
									<Button
										type="submit"
										size="icon-sm"
										class="bg-orange-600 hover:bg-orange-700"
										aria-label="Add agenda item"
									>
										<Plus class="size-4" />
									</Button>
									<Button
										type="button"
										size="icon-sm"
										variant="outline"
										aria-label="Cancel adding agenda item"
										onclick={cancelNewEntry}
									>
										<X class="size-4" />
									</Button>
								</div>
							</form>
						{:else if day.isEditable}
							<Button
								type="button"
								variant="outline"
								class="mt-auto h-9 justify-start rounded-lg border-dashed border-orange-300/80 bg-orange-50/80 px-3 text-xs text-orange-700 shadow-none hover:bg-orange-100 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-200"
								onclick={() => openNewEntry(day.date)}
							>
								<Plus class="mr-2 size-4" />
								Add item
							</Button>
						{:else}
							<p
								class="mt-auto text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
							>
								Historical items are view only.
							</p>
						{/if}
					</div>
				</section>
			{/each}
		</div>
	</div>

	<DailyAgendaChart points={agenda.chartPoints} rangeLabel={agenda.chartRangeLabel} />

	<Dialog.Root bind:open={defaultsDialogOpen}>
		<Dialog.Content class="sm:max-w-2xl">
			<Dialog.Header>
				<Dialog.Title class="font-display text-2xl">Default Items</Dialog.Title>
				<Dialog.Description>
					Manage the recurring agenda items that should appear from today forward. Historical weeks
					remain view only.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				<div class="flex flex-wrap items-center gap-2">
					<Badge variant="orange">{agenda.templates.length} defaults</Badge>
					<Badge variant="outline">Future days only</Badge>
				</div>

				<form
					method="POST"
					action={buildAgendaActionHref('createAgendaTemplate')}
					use:enhance={createAgendaEnhance({
						successMessage: 'Default item added.',
						errorMessage: 'Unable to add default item.',
						afterSuccess: () => {
							newTemplateTitle = '';
						}
					})}
					class="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 dark:border-orange-500/20 dark:bg-orange-500/6"
				>
					<div class="flex flex-col gap-2 sm:flex-row">
						<Input
							name="title"
							bind:value={newTemplateTitle}
							placeholder="Add a recurring item"
							maxlength={200}
							required
						/>
						<Button type="submit" class="bg-orange-600 hover:bg-orange-700">
							<Plus class="mr-2 size-4" />
							Add Default
						</Button>
					</div>
				</form>

				<div class="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
					{#each agenda.templates as template (template.id)}
						<div class="rounded-2xl border border-border/70 bg-background p-3 shadow-xs">
							{#if editingTemplateId === template.id}
								<form
									method="POST"
									action={buildAgendaActionHref('updateAgendaTemplate')}
									use:enhance={createAgendaEnhance({
										successMessage: 'Default item updated.',
										errorMessage: 'Unable to update default item.',
										afterSuccess: cancelTemplateEdit
									})}
									class="flex flex-col gap-2 sm:flex-row"
								>
									<input type="hidden" name="id" value={template.id}>
									<Input name="title" bind:value={editingTemplateTitle} maxlength={200} required />
									<div class="flex items-center gap-2">
										<Button type="submit" size="sm" class="bg-orange-600 hover:bg-orange-700">
											<Save class="mr-2 size-4" />
											Save
										</Button>
										<Button type="button" size="sm" variant="ghost" onclick={cancelTemplateEdit}>
											<X class="mr-2 size-4" />
											Cancel
										</Button>
									</div>
								</form>
							{:else}
								<div class="flex items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="font-medium text-foreground wrap-break-word">{template.title}</p>
										<p class="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
											Default item
										</p>
									</div>
									<div class="flex items-center gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											class="size-8"
											onclick={() => startTemplateEdit(template)}
										>
											<Pencil class="size-4" />
										</Button>
										<form
											method="POST"
											action={buildAgendaActionHref('deleteAgendaTemplate')}
											use:enhance={createAgendaEnhance({
												successMessage: 'Default item deleted.',
												errorMessage: 'Unable to delete default item.'
											})}
										>
											<input type="hidden" name="id" value={template.id}>
											<Button
												type="submit"
												variant="destructive"
												size="icon"
												class="size-8"
												aria-label="Delete default agenda item"
												onclick={(event) => confirmDelete(event, 'Delete this default item for today and future days?')}
											>
												<Trash2 class="size-4" />
											</Button>
										</form>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<div
							class="rounded-2xl border border-dashed border-orange-200/80 bg-orange-50/40 px-4 py-6 text-center text-sm text-muted-foreground dark:border-orange-500/20 dark:bg-orange-500/5"
						>
							No defaults yet. Add a few recurring items to seed the planner each day.
						</div>
					{/each}
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (defaultsDialogOpen = false)}>
					Close
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>

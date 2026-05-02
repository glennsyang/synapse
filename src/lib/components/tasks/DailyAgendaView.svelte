<script lang="ts">
	import {
		CalendarDays,
		ChevronLeft,
		ChevronRight,
		Pencil,
		Plus,
		Save,
		Trash2,
		X
	} from '@lucide/svelte';
	import type { ActionResult } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import type { DailyAgendaData, DailyAgendaEntry, DailyAgendaTemplate } from '$lib/types';
	import { cn } from '$lib/utils';
	import { daysOfWeek, getStartOfWeek } from '$lib/utils/date';

	import DailyAgendaRadial from './DailyAgendaRadial.svelte';

	interface Props {
		agenda: DailyAgendaData;
		defaultsDialogOpen?: boolean;
	}

	type AgendaDeleteDialogState = {
		id: string;
		title: string;
		message: string;
		actionUrl: string;
		confirmButtonText: string;
	};

	let { agenda, defaultsDialogOpen = $bindable(false) }: Props = $props();

	const templateDayOptions = [...daysOfWeek.slice(1), daysOfWeek[0]];
	const allTemplateDays = templateDayOptions.map((day) => day.id);

	let newTemplateTitle = $state('');
	let newTemplateDays = $state<number[]>([...allTemplateDays]);
	let editingTemplateId = $state<string | null>(null);
	let editingTemplateTitle = $state('');
	let editingTemplateDays = $state<number[]>([...allTemplateDays]);
	let newEntryDate = $state<string | null>(null);
	let newEntryTitle = $state('');
	let editingEntryId = $state<string | null>(null);
	let editingEntryTitle = $state('');
	let agendaDeleteDialogOpen = $state(false);
	let pendingAgendaDelete = $state<AgendaDeleteDialogState | null>(null);

	function normalizeTemplateDays(days: number[]): number[] {
		const selected = new Set(days);

		return templateDayOptions.filter((day) => selected.has(day.id)).map((day) => day.id);
	}

	function toggleTemplateDay(days: number[], dayId: number): number[] {
		if (days.includes(dayId)) {
			return days.filter((day) => day !== dayId);
		}

		return normalizeTemplateDays([...days, dayId]);
	}

	function serializeTemplateDays(days: number[]): string {
		return normalizeTemplateDays(days).join(',');
	}

	function formatTemplateDays(days: number[]): string {
		const orderedDays = normalizeTemplateDays(days);
		if (orderedDays.length === templateDayOptions.length) {
			return 'Every day';
		}

		return templateDayOptions
			.filter((day) => orderedDays.includes(day.id))
			.map((day) => day.shortName)
			.join(', ');
	}

	function toggleNewTemplateDay(dayId: number) {
		newTemplateDays = toggleTemplateDay(newTemplateDays, dayId);
	}

	function toggleEditingTemplateDay(dayId: number) {
		editingTemplateDays = toggleTemplateDay(editingTemplateDays, dayId);
	}

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
	const todayAgendaDay = $derived(agenda.days.find((day) => day.isToday) ?? null);
	const currentWindowPoints = $derived(agenda.chartPoints.slice(-7));
	const previousWindowPoints = $derived(
		agenda.chartPoints.slice(0, Math.max(agenda.chartPoints.length - 7, 0))
	);
	const currentWindowAverage = $derived(calculateAverageCompletion(currentWindowPoints));
	const previousWindowAverage = $derived(calculateAverageCompletion(previousWindowPoints));
	const previousWindowHasActivity = $derived(
		previousWindowPoints.some((point) => point.totalCount > 0)
	);
	const completionDelta = $derived(currentWindowAverage - previousWindowAverage);
	const clampedCurrentWindowAverage = $derived(Math.min(Math.max(currentWindowAverage, 0), 100));
	const clampedPreviousWindowAverage = $derived(Math.min(Math.max(previousWindowAverage, 0), 100));
	const comparisonDeltaLabel = $derived.by(() => {
		if (!previousWindowHasActivity) {
			return 'New rhythm';
		}

		if (completionDelta > 0) {
			return `+${completionDelta} pts`;
		}

		if (completionDelta < 0) {
			return `${completionDelta} pts`;
		}

		return 'Even';
	});
	const comparisonSummary = $derived.by(() => {
		if (!previousWindowHasActivity) {
			return 'Comparison will settle in after one full prior week.';
		}

		if (completionDelta > 6) {
			return 'Stronger than the prior 7 days.';
		}

		if (completionDelta > 0) {
			return 'Tracking ahead of the prior 7 days.';
		}

		if (completionDelta < -6) {
			return 'Softer than the prior 7 days.';
		}

		if (completionDelta < 0) {
			return 'Just under the prior 7 days.';
		}

		return 'Holding steady against the prior 7 days.';
	});
	type TodayAlertState = {
		variant: 'destructive' | 'default' | undefined;
		title: string;
		description: string;
		className: string;
	};

	const todayAlertState = $derived.by((): TodayAlertState | null => {
		if (!agenda.isCurrentWeek) {
			return null;
		}

		if (!todayAgendaDay || todayAgendaDay.totalCount === 0) {
			return {
				variant: 'default',
				title: 'Nothing queued yet',
				description: 'Today is open. Add a task you want to get done.',
				className:
					'border-orange-200/80 bg-orange-50/75 dark:border-orange-500/25 dark:bg-orange-500/10'
			};
		}

		const doneCount = todayAgendaDay.completedCount;
		const totalCount = todayAgendaDay.totalCount;
		const progress = todayAgendaDay.completionPercentage;
		const taskLabel = totalCount === 1 ? 'task' : 'tasks';

		if (progress >= 80) {
			if (doneCount === totalCount) {
				return {
					variant: 'default',
					title: 'All done for today 🎉',
					description: `You wrapped up all ${totalCount} ${taskLabel}. Nice finish.`,
					className:
						'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-500/25 dark:bg-emerald-500/10 text-[oklch(var(--color-green))]'
				};
			}

			return {
				variant: 'default',
				title: 'Almost there 🎉',
				description: `You have ${doneCount} of ${totalCount} ${taskLabel} done today. You're close to a clean sweep.`,
				className:
					'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-500/25 dark:bg-emerald-500/10 text-[oklch(var(--color-green))]'
			};
		}

		if (progress >= 40) {
			return {
				variant: 'default',
				title: progress >= 50 ? 'Halfway there' : 'Good momentum',
				description: `You have ${doneCount} of ${totalCount} ${taskLabel} done today. Keep going and this day ends strong.`,
				className:
					'border-orange-200/80 bg-orange-50/75 dark:border-orange-500/25 dark:bg-orange-500/10 text-[oklch(var(--color-orange))]'
			};
		}

		if (doneCount === 0) {
			return {
				variant: 'destructive',
				title: 'Today needs a first win',
				description: 'No tasks are done yet today. Start with the easiest one and build momentum.',
				className: 'border-red-200/80 bg-red-50/80 dark:border-red-500/25 dark:bg-red-500/10'
			};
		}

		return {
			variant: 'destructive',
			title: 'Today needs attention',
			description: `You have only ${doneCount} of ${totalCount} ${taskLabel} done today. Knock out the next one to get back on pace.`,
			className: 'border-red-200/80 bg-red-50/80 dark:border-red-500/25 dark:bg-red-500/10'
		};
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
		editingTemplateDays = normalizeTemplateDays(template.daysOfWeek);
	}

	function cancelTemplateEdit() {
		editingTemplateId = null;
		editingTemplateTitle = '';
		editingTemplateDays = [...allTemplateDays];
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

	function openAgendaDeleteDialog(config: AgendaDeleteDialogState) {
		pendingAgendaDelete = config;
		agendaDeleteDialogOpen = true;
	}

	function getEntrySurfaceClass(entry: DailyAgendaEntry): string {
		return entry.sourceType === 'default'
			? 'bg-slate-100/95 ring-slate-300/70 dark:bg-slate-900/85 dark:ring-slate-700/70'
			: 'bg-background/90 ring-border/60 dark:bg-background/82';
	}
</script>

<div class="space-y-4">
	<section
		class="relative isolate overflow-hidden rounded-[1.65rem] border border-orange-200/80 bg-linear-to-br from-orange-50/95 via-background to-amber-50/80 p-4 shadow-[0_24px_64px_-38px_rgba(249,115,22,0.22)] dark:border-orange-500/22 dark:from-orange-500/10 dark:via-background dark:to-amber-500/5 dark:shadow-[0_24px_64px_-42px_rgba(249,115,22,0.16)] sm:p-5"
	>
		<div
			class="absolute -left-10 top-0 size-32 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/10"
		></div>
		<div
			class="absolute right-0 top-1/3 size-28 rounded-full bg-amber-200/28 blur-3xl dark:bg-amber-400/8"
		></div>

		<div class="relative space-y-3.5">
			<div
				class="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(13.75rem,15.75rem)] lg:items-start"
			>
				<div class="min-w-0 space-y-3">
					<div class="flex flex-wrap items-center gap-2">
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
								class="h-10 rounded-full border-orange-200/80 bg-background/78 px-4 text-[oklch(var(--color-orange))] shadow-xs backdrop-blur hover:bg-orange-50/80 dark:border-orange-500/20 dark:bg-background/70 dark:text-orange-200 dark:hover:bg-orange-500/10"
							>
								<CalendarDays class="mr-2 size-4" />
								Current week
							</Button>
						{/if}
					</div>

					<div
						class="rounded-[1.25rem] border border-orange-200/80 bg-background/82 p-3.5 shadow-xs backdrop-blur dark:border-orange-500/20 dark:bg-background/72"
					>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div class="flex min-w-0 items-center gap-2">
								<Badge
									variant="outline"
									class="rounded-full border-orange-200/80 bg-background/82 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[oklch(var(--color-orange))] dark:border-orange-500/25 dark:bg-background/70 dark:text-orange-200"
								>
									Week comparison
								</Badge>
								<p class="text-[11px] text-muted-foreground">vs prior 7 days</p>
							</div>
							<div
								class={cn(
									'inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur',
									previousWindowHasActivity && completionDelta > 0
										? 'border-emerald-300/80 bg-emerald-100/85 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
										: previousWindowHasActivity && completionDelta < 0
											? 'border-amber-300/80 bg-amber-100/90 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200'
											: 'border-orange-300/70 bg-background/80 text-[oklch(var(--color-orange))] dark:border-orange-500/30 dark:bg-background/70 dark:text-orange-200'
								)}
							>
								{comparisonDeltaLabel}
							</div>
						</div>

						<div class="mt-3 grid gap-2.5">
							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-3 text-[11px]">
									<span class="font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										{agenda.isCurrentWeek ? 'This week' : 'Selected week'}
									</span>
									<span class="text-foreground">{clampedCurrentWindowAverage}%</span>
								</div>
								<div class="h-2 rounded-full bg-orange-100/85 dark:bg-orange-500/10">
									<div
										class="h-full rounded-full bg-linear-to-r from-orange-400 via-orange-500 to-amber-400"
										style={`width: ${clampedCurrentWindowAverage}%`}
									></div>
								</div>
							</div>

							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-3 text-[11px]">
									<span class="font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										Prior week
									</span>
									<span class="text-foreground">
										{previousWindowHasActivity ? `${clampedPreviousWindowAverage}%` : '—'}
									</span>
								</div>
								<div class="h-2 rounded-full bg-orange-100/85 dark:bg-orange-500/10">
									<div
										class={cn(
											'h-full rounded-full transition-[width]',
											previousWindowHasActivity
												? 'bg-orange-300/85 dark:bg-orange-400/45'
												: 'bg-orange-200/60 dark:bg-orange-500/14'
										)}
										style={`width: ${previousWindowHasActivity ? clampedPreviousWindowAverage : 18}%`}
									></div>
								</div>
							</div>
						</div>

						<p class="mt-2.5 text-[11px] leading-5 text-muted-foreground">{comparisonSummary}</p>
					</div>

					{#if todayAlertState}
						<Alert.Root
							variant={todayAlertState.variant}
							class={cn(
								'w-full min-w-0 rounded-[1.15rem] px-3.5 py-2.5 shadow-xs backdrop-blur',
								todayAlertState.className
							)}
						>
							<Alert.Title class="text-sm font-semibold"> {todayAlertState.title} </Alert.Title>
							<Alert.Description class="text-sm [&_p]:leading-5">
								<p>{todayAlertState.description}</p>
							</Alert.Description>
						</Alert.Root>
					{/if}
				</div>

				<div class="mx-auto w-full max-w-62 lg:mx-0 lg:justify-self-end">
					<DailyAgendaRadial
						completionPercentage={overallCompletionPercentage}
						completedCount={agenda.overallCompletedCount}
						totalCount={agenda.overallTotalCount}
						rollingAverage={currentWindowAverage}
						previousAverage={previousWindowAverage}
						trendDelta={completionDelta}
						hasComparisonData={previousWindowHasActivity}
					/>
				</div>
			</div>
		</div>
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
							variant="secondary"
							class={day.completionPercentage >= 80
								? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 ring-1 ring-emerald-300/80 dark:ring-emerald-500/30'
								: day.completionPercentage >= 40
									? 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200 ring-1 ring-orange-300/80 dark:ring-orange-500/30'
									: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-200 ring-1 ring-red-300/80 dark:ring-red-500/30'}
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
							{`${day.completedCount} of ${day.totalCount} done`}
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
									<Input type="hidden" name="id" value={entry.id} />
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
										<Input type="hidden" name="id" value={entry.id} />
										<Input
											type="hidden"
											name="completed"
											value={entry.completed ? 'false' : 'true'}
										/>
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
											<Button
												type="button"
												variant="destructive"
												size="icon"
												class="size-7"
												aria-label="Delete day-only agenda item"
												onclick={() =>
													openAgendaDeleteDialog({
														id: entry.id,
														title: 'Delete agenda item',
														message: `Delete "${entry.title}"? This action cannot be undone.`,
														actionUrl: buildAgendaActionHref('deleteAgendaEntry'),
														confirmButtonText: 'Delete'
													})}
											>
												<Trash2 class="size-4" />
											</Button>
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
								<Input type="hidden" name="date" value={day.date} />
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
						{/if}
					</div>
				</section>
			{/each}
		</div>
	</div>

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
					<Badge
						variant="secondary"
						class="text-[oklch(var(--color-orange))] bg-[oklch(var(--color-orange)/0.1)] ring-1 ring-[oklch(var(--color-orange)/0.3)]"
					>
						{agenda.templates.length}
						defaults
					</Badge>
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
							newTemplateDays = [...allTemplateDays];
						}
					})}
					class="rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 dark:border-orange-500/20 dark:bg-orange-500/6"
				>
					<Input type="hidden" name="daysOfWeek" value={serializeTemplateDays(newTemplateDays)} />
					<div class="space-y-3">
						<div class="flex flex-col gap-2 sm:flex-row">
							<Input
								name="title"
								bind:value={newTemplateTitle}
								placeholder="Add a recurring item"
								maxlength={200}
								required
							/>
							<Button
								type="submit"
								class="bg-orange-600 hover:bg-orange-700"
								disabled={newTemplateDays.length === 0}
							>
								<Plus class="mr-2 size-4" />
								Add Default
							</Button>
						</div>
						<fieldset class="space-y-2">
							<legend
								class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
							>
								Apply on days
							</legend>
							<div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
								{#each templateDayOptions as day (day.id)}
									<label
										class={cn(
											'flex items-center gap-2 rounded-lg border bg-background/90 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors',
											newTemplateDays.includes(day.id)
												? 'border-orange-300/90 ring-1 ring-orange-300/70 dark:border-orange-500/45 dark:ring-orange-500/35'
												: 'border-border/70'
										)}
									>
										<Input
											type="checkbox"
											checked={newTemplateDays.includes(day.id)}
											class="size-3.5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
											onchange={() => toggleNewTemplateDay(day.id)}
										/>
										<span>{day.shortName}</span>
									</label>
								{/each}
							</div>
							<p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
								Select at least one day.
							</p>
						</fieldset>
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
									class="space-y-3"
								>
									<Input type="hidden" name="id" value={template.id} />
									<Input
										type="hidden"
										name="daysOfWeek"
										value={serializeTemplateDays(editingTemplateDays)}
									/>
									<div class="flex flex-col gap-2 sm:flex-row">
										<Input
											name="title"
											bind:value={editingTemplateTitle}
											maxlength={200}
											required
										/>
										<div class="flex items-center gap-2">
											<Button
												type="submit"
												size="sm"
												class="bg-orange-600 hover:bg-orange-700"
												disabled={editingTemplateDays.length === 0}
											>
												<Save class="mr-2 size-4" />
												Save
											</Button>
											<Button type="button" size="sm" variant="ghost" onclick={cancelTemplateEdit}>
												<X class="mr-2 size-4" />
												Cancel
											</Button>
										</div>
									</div>
									<fieldset class="space-y-2">
										<legend
											class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
										>
											Apply on days
										</legend>
										<div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
											{#each templateDayOptions as day (day.id)}
												<label
													class={cn(
														'flex items-center gap-2 rounded-lg border bg-background/90 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors',
														editingTemplateDays.includes(day.id)
															? 'border-orange-300/90 ring-1 ring-orange-300/70 dark:border-orange-500/45 dark:ring-orange-500/35'
															: 'border-border/70'
													)}
												>
													<Input
														type="checkbox"
														checked={editingTemplateDays.includes(day.id)}
														class="size-3.5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
														onchange={() => toggleEditingTemplateDay(day.id)}
													/>
													<span>{day.shortName}</span>
												</label>
											{/each}
										</div>
										<p
											class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
										>
											Select at least one day.
										</p>
									</fieldset>
								</form>
							{:else}
								<div class="flex items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="font-medium text-foreground wrap-break-word">{template.title}</p>
										<p class="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
											Default item
										</p>
										<p class="mt-1 text-xs text-muted-foreground">
											{formatTemplateDays(template.daysOfWeek)}
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
										<Button
											type="button"
											variant="destructive"
											size="icon"
											class="size-8"
											aria-label="Delete default agenda item"
											onclick={() =>
												openAgendaDeleteDialog({
													id: template.id,
													title: 'Delete default item',
													message: `Delete "${template.title}" for today and future days? This action cannot be undone.`,
													actionUrl: buildAgendaActionHref('deleteAgendaTemplate'),
													confirmButtonText: 'Delete'
												})}
										>
											<Trash2 class="size-4" />
										</Button>
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

	<ConfirmDialog
		bind:open={agendaDeleteDialogOpen}
		title={pendingAgendaDelete?.title ?? 'Delete item'}
		message={pendingAgendaDelete?.message ?? ''}
		confirmButtonText={pendingAgendaDelete?.confirmButtonText ?? 'Delete'}
		id={pendingAgendaDelete?.id}
		actionUrl={pendingAgendaDelete?.actionUrl}
	/>
</div>

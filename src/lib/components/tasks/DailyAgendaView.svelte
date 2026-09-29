<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { cn } from '$lib';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import PenCheck from '$lib/components/shared/PenCheck.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import type { DailyAgendaData, DailyAgendaEntry, DailyAgendaTemplate } from '$lib/types';
	import { daysOfWeek, getStartOfWeek } from '$lib/utils/date';
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

	import Confetti from '../shared/Confetti.svelte';
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
	let celebrationBurstId = $state(0);

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
					'border-pen-tasks/35 bg-pen-tasks/10 dark:border-pen-tasks/25 dark:bg-pen-tasks/10'
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
						'border-pen-fitness/35 bg-pen-fitness/10 dark:border-pen-fitness/25 dark:bg-pen-fitness/10 text-[oklch(var(--color-green))]'
				};
			}

			return {
				variant: 'default',
				title: 'Almost there 🎉',
				description: `You have ${doneCount} of ${totalCount} ${taskLabel} done today. You're close to a clean sweep.`,
				className:
					'border-pen-fitness/35 bg-pen-fitness/10 dark:border-pen-fitness/25 dark:bg-pen-fitness/10 text-[oklch(var(--color-green))]'
			};
		}

		if (progress >= 40) {
			return {
				variant: 'default',
				title: progress >= 50 ? 'Halfway there' : 'Good momentum',
				description: `You have ${doneCount} of ${totalCount} ${taskLabel} done today. Keep going and this day ends strong.`,
				className:
					'border-pen-tasks/35 bg-pen-tasks/10 dark:border-pen-tasks/25 dark:bg-pen-tasks/10 text-[oklch(var(--color-orange))]'
			};
		}

		if (doneCount === 0) {
			return {
				variant: 'destructive',
				title: 'Today needs a first win',
				description: 'No tasks are done yet today. Start with the easiest one and build momentum.',
				className:
					'border-destructive/35 bg-destructive/10 dark:border-destructive/25 dark:bg-destructive/10'
			};
		}

		return {
			variant: 'destructive',
			title: 'Today needs attention',
			description: `You have only ${doneCount} of ${totalCount} ${taskLabel} done today. Knock out the next one to get back on pace.`,
			className:
				'border-destructive/35 bg-destructive/10 dark:border-destructive/25 dark:bg-destructive/10'
		};
	});

	function shouldCelebrateAgendaToggle(
		day: DailyAgendaData['days'][number],
		entry: DailyAgendaEntry
	) {
		return (
			agenda.isCurrentWeek &&
			day.isToday &&
			!entry.completed &&
			day.totalCount > 0 &&
			day.completedCount + 1 >= day.totalCount
		);
	}

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
		return entry.sourceType === 'default' ? '' : 'bg-pen-tasks/6';
	}

	function makeConfettiBurst() {
		celebrationBurstId += 1;
	}
</script>

<div class="space-y-4">
	<section
		class="border-pen-tasks/35 dark:border-pen-tasks/22 relative isolate overflow-hidden rounded-[3px] border p-4 sm:p-5"
	>
		<div class="relative space-y-3.5">
			<div
				class="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(13.75rem,15.75rem)] lg:items-start"
			>
				<div class="min-w-0 space-y-3">
					<div class="flex flex-wrap items-center gap-2">
						<div
							class="bg-background/78 dark:bg-background/70 border-pen-tasks/35 dark:border-pen-tasks/20 flex min-w-0 items-center gap-1.5 rounded-[3px] border p-1.5"
						>
							<Button
								href={buildAgendaHref(agenda.previousWeekStart)}
								variant="outline"
								size="icon"
								class="bg-background/85 dark:bg-background/70 border-pen-tasks/35 hover:bg-pen-tasks/10 dark:border-pen-tasks/20 dark:hover:bg-pen-tasks/10 size-10 rounded-2xl"
							>
								<ChevronLeft class="size-4" />
							</Button>
							<div class="min-w-0 px-2 text-center sm:min-w-56">
								<p class="text-muted-foreground text-xs font-bold">Week window</p>
								<p
									class="font-display text-foreground mt-1 text-sm leading-tight font-semibold tracking-[-0.03em] sm:text-base"
								>
									{agenda.weekLabel}
								</p>
							</div>
							<Button
								href={buildAgendaHref(agenda.nextWeekStart)}
								variant="outline"
								size="icon"
								class="bg-background/85 dark:bg-background/70 border-pen-tasks/35 hover:bg-pen-tasks/10 dark:border-pen-tasks/20 dark:hover:bg-pen-tasks/10 size-10 rounded-2xl"
							>
								<ChevronRight class="size-4" />
							</Button>
						</div>

						{#if !agenda.isCurrentWeek}
							<Button
								href={buildAgendaHref(getStartOfWeek())}
								variant="outline"
								class="bg-background/78 dark:bg-background/70 border-pen-tasks/35 hover:bg-pen-tasks/10 dark:border-pen-tasks/20 dark:text-pen-tasks dark:hover:bg-pen-tasks/10 h-10 rounded-[2px] px-4 text-[oklch(var(--color-orange))]"
							>
								<CalendarDays class="mr-2 size-4" />
								Current week
							</Button>
						{/if}
					</div>

					<div
						class="bg-background/82 dark:bg-background/72 border-pen-tasks/35 dark:border-pen-tasks/20 rounded-[3px] border p-3.5"
					>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div class="flex min-w-0 items-center gap-2">
								<h3 class="text-sm font-black">Week comparison</h3>
								<p class="text-muted-foreground text-[11px]">vs prior 7 days</p>
							</div>
							<div
								class={cn(
									'inline-flex shrink-0 rounded-[2px] border px-2.5 py-1 text-xs font-bold',
									previousWindowHasActivity && completionDelta > 0
										? 'border-pen-fitness/35 bg-pen-fitness/10 text-pen-fitness dark:border-pen-fitness/30 dark:bg-pen-fitness/10 dark:text-pen-fitness'
										: previousWindowHasActivity && completionDelta < 0
											? 'border-pen-warn/35 bg-pen-warn/10 text-pen-warn dark:border-pen-warn/30 dark:bg-pen-warn/12 dark:text-pen-warn'
											: 'bg-background/80 dark:bg-background/70 border-pen-tasks/35 dark:border-pen-tasks/30 dark:text-pen-tasks text-[oklch(var(--color-orange))]'
								)}
							>
								{comparisonDeltaLabel}
							</div>
						</div>

						<div class="mt-3 grid gap-2.5">
							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-3 text-[11px]">
									<span class="text-muted-foreground font-semibold">
										{agenda.isCurrentWeek ? 'This week' : 'Selected week'}
									</span>
									<span class="text-foreground">{clampedCurrentWindowAverage}%</span>
								</div>
								<div class="bg-pen-tasks/10 dark:bg-pen-tasks/10 h-2 rounded-full">
									<div
										class="h-full rounded-full"
										style={`width: ${clampedCurrentWindowAverage}%`}
									></div>
								</div>
							</div>

							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-3 text-[11px]">
									<span class="text-muted-foreground font-semibold"> Prior week </span>
									<span class="text-foreground">
										{previousWindowHasActivity ? `${clampedPreviousWindowAverage}%` : '—'}
									</span>
								</div>
								<div class="bg-pen-tasks/10 dark:bg-pen-tasks/10 h-2 rounded-full">
									<div
										class={cn(
											'h-full rounded-full transition-[width]',
											previousWindowHasActivity
												? 'bg-pen-tasks/10 dark:bg-pen-tasks/8'
												: 'bg-pen-tasks/10 dark:bg-pen-tasks/14'
										)}
										style={`width: ${previousWindowHasActivity ? clampedPreviousWindowAverage : 18}%`}
									></div>
								</div>
							</div>
						</div>

						<p class="text-muted-foreground mt-2.5 text-[11px] leading-5">{comparisonSummary}</p>
					</div>

					{#if todayAlertState}
						<Alert.Root
							variant={todayAlertState.variant}
							class={cn('w-full min-w-0 rounded-[3px] px-3.5 py-2.5', todayAlertState.className)}
						>
							<Alert.Title class="text-sm font-semibold">{todayAlertState.title}</Alert.Title>
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
		<div class="grid grid-cols-1 gap-2 min-[1200px]:grid-cols-7 sm:grid-cols-2 lg:grid-cols-4">
			{#each agenda.days as day (day.date)}
				<section
					class={cn(
						'bg-background/95 dark:bg-background/92 border-pen-tasks/35 dark:border-pen-tasks/18 flex min-w-0 flex-col rounded-[3px] border p-3',
						day.isToday && ' border-pen-tasks dark:border-pen-tasks/35',
						!day.isEditable && 'bg-muted/85 dark:bg-muted/25'
					)}
				>
					<div class="mb-2.5 flex items-start justify-between gap-2">
						<div>
							<p class="text-muted-foreground text-xs font-bold">
								{day.shortDayName}
							</p>
							<div class="mt-0.5 flex items-baseline gap-1.5">
								<h3
									class="font-display text-foreground text-2xl leading-none font-semibold tracking-[-0.03em]"
								>
									{day.dayNumber}
								</h3>
								<span class="text-muted-foreground text-xs">{day.monthLabel}</span>
							</div>
						</div>
						<Badge
							variant="secondary"
							class={day.completionPercentage >= 80
								? 'bg-pen-fitness/10 text-pen-fitness ring-pen-fitness/35 dark:bg-pen-fitness/20 dark:text-pen-fitness dark:ring-pen-fitness/30 ring-1'
								: day.completionPercentage >= 40
									? 'bg-pen-tasks/10 text-pen-tasks ring-pen-tasks/35 dark:bg-pen-tasks/20 dark:text-pen-tasks dark:ring-pen-tasks/30 ring-1'
									: 'bg-destructive/10 text-destructive ring-destructive/35 dark:bg-destructive/20 dark:text-destructive dark:ring-destructive/30 ring-1'}
						>
							{day.completionPercentage}%
						</Badge>
					</div>

					<div class="mb-3">
						<div class="bg-pen-tasks/10 dark:bg-pen-tasks/12 h-1.5 rounded-full">
							<div
								class="bg-pen-tasks h-full rounded-full transition-[width]"
								style={`width: ${day.completionPercentage}%`}
							></div>
						</div>
						<p class="text-muted-foreground mt-1.5 text-[11px]">
							{`${day.completedCount} of ${day.totalCount} done`}
						</p>
					</div>

					<div class="flex flex-1 flex-col gap-2">
						{#if day.entries.length === 0}
							<div
								class="bg-background/75 text-muted-foreground border-pen-tasks/35 dark:border-pen-tasks/18 rounded-lg border border-dashed px-2.5 py-3 text-xs"
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
									class="bg-background/90 border-pen-tasks/35 dark:border-pen-tasks/20 rounded-lg border p-2.5"
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
											class="bg-pen-tasks hover:bg-pen-tasks"
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
										'group border-rule flex items-center gap-1.5 border-b pr-1 transition-colors',
										getEntrySurfaceClass(entry)
									)}
								>
									<form
										method="POST"
										action={buildAgendaActionHref('toggleAgendaEntry')}
										use:enhance={createAgendaEnhance({
											errorMessage: 'Unable to update agenda item.',
											silentSuccess: true,
											afterSuccess: () => {
												if (shouldCelebrateAgendaToggle(day, entry)) {
													makeConfettiBurst();
												}
											}
										})}
										class="shrink-0"
									>
										<Input type="hidden" name="id" value={entry.id} />
										<Input
											type="hidden"
											name="completed"
											value={entry.completed ? 'false' : 'true'}
										/>
										<PenCheck
											checked={entry.completed}
											disabled={!day.isEditable}
											label={entry.title}
											style="--pen: oklch(var(--color-orange))"
											onchange={(event) => event.currentTarget.form?.requestSubmit()}
										/>
									</form>
									<div class="min-w-0 flex-1">
										<div class="flex min-h-3.5 items-center">
											<p
												class={cn(
													'text-foreground text-xs leading-4 wrap-break-word',
													entry.completed &&
														'text-muted-foreground decoration-pen-tasks/70 line-through'
												)}
											>
												{entry.title}
											</p>
										</div>
										{#if !day.isEditable}
											<p class="text-muted-foreground mt-1 text-[11px]">View only</p>
										{/if}
									</div>

									{#if day.isEditable && entry.sourceType === 'custom'}
										<div
											class="flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
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
								class="bg-background/92 border-pen-tasks/35 dark:border-pen-tasks/20 rounded-lg border p-2.5"
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
										class="bg-pen-tasks hover:bg-pen-tasks"
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
								class="border-pen-tasks/35 bg-pen-tasks/10 text-pen-tasks hover:bg-pen-tasks/12 dark:border-pen-tasks/25 dark:bg-pen-tasks/10 dark:text-pen-tasks mt-auto h-9 justify-start rounded-lg border-dashed px-3 text-xs"
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
						class="bg-[oklch(var(--color-orange)/0.1)] text-[oklch(var(--color-orange))] ring-1 ring-[oklch(var(--color-orange)/0.3)]"
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
					class="border-pen-tasks/35 bg-pen-tasks/8 dark:border-pen-tasks/20 dark:bg-pen-tasks/6 rounded-2xl border p-4"
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
								class="bg-pen-tasks hover:bg-pen-tasks"
								disabled={newTemplateDays.length === 0}
							>
								<Plus class="mr-2 size-4" />
								Add Default
							</Button>
						</div>
						<fieldset class="space-y-2">
							<legend class="text-muted-foreground text-xs font-semibold"> Apply on days </legend>
							<div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
								{#each templateDayOptions as day (day.id)}
									<label
										class={cn(
											'bg-background/90 text-foreground flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
											newTemplateDays.includes(day.id)
												? 'border-pen-tasks/35 ring-pen-tasks/35 dark:border-pen-tasks/45 dark:ring-pen-tasks/35 ring-1'
												: 'border-border/70'
										)}
									>
										<Input
											type="checkbox"
											checked={newTemplateDays.includes(day.id)}
											class="border-pen-tasks text-pen-tasks focus:ring-pen-tasks size-3.5 rounded"
											onchange={() => toggleNewTemplateDay(day.id)}
										/>
										<span>{day.shortName}</span>
									</label>
								{/each}
							</div>
							<p class="text-muted-foreground text-[11px] font-medium">Select at least one day.</p>
						</fieldset>
					</div>
				</form>

				<div class="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
					{#each agenda.templates as template (template.id)}
						<div class="border-border/70 bg-background rounded-2xl border p-3">
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
												class="bg-pen-tasks hover:bg-pen-tasks"
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
										<legend class="text-muted-foreground text-xs font-semibold">
											Apply on days
										</legend>
										<div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
											{#each templateDayOptions as day (day.id)}
												<label
													class={cn(
														'bg-background/90 text-foreground flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
														editingTemplateDays.includes(day.id)
															? 'border-pen-tasks/35 ring-pen-tasks/35 dark:border-pen-tasks/45 dark:ring-pen-tasks/35 ring-1'
															: 'border-border/70'
													)}
												>
													<Input
														type="checkbox"
														checked={editingTemplateDays.includes(day.id)}
														class="border-pen-tasks text-pen-tasks focus:ring-pen-tasks size-3.5 rounded"
														onchange={() => toggleEditingTemplateDay(day.id)}
													/>
													<span>{day.shortName}</span>
												</label>
											{/each}
										</div>
										<p class="text-muted-foreground text-[11px] font-medium">
											Select at least one day.
										</p>
									</fieldset>
								</form>
							{:else}
								<div class="flex items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="text-foreground font-medium wrap-break-word">{template.title}</p>
										<p class="text-muted-foreground mt-1 text-xs">Default item</p>
										<p class="text-muted-foreground mt-1 text-xs">
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
							class="text-muted-foreground border-pen-tasks/35 bg-pen-tasks/8 dark:border-pen-tasks/20 dark:bg-pen-tasks/5 rounded-2xl border border-dashed px-4 py-6 text-center text-sm"
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

	<Confetti burstId={celebrationBurstId} />

	<ConfirmDialog
		bind:open={agendaDeleteDialogOpen}
		title={pendingAgendaDelete?.title ?? 'Delete item'}
		message={pendingAgendaDelete?.message ?? ''}
		confirmButtonText={pendingAgendaDelete?.confirmButtonText ?? 'Delete'}
		id={pendingAgendaDelete?.id}
		actionUrl={pendingAgendaDelete?.actionUrl}
	/>
</div>

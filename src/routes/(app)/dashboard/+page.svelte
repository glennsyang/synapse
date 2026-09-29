<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import AgendaCompletionChart from '$lib/components/dashboard/AgendaCompletionChart.svelte';
	import AgendaItemScorecard from '$lib/components/dashboard/AgendaItemScorecard.svelte';
	import VisitHealthPanel from '$lib/components/dashboard/VisitHealthPanel.svelte';
	import WorkoutTypeChart from '$lib/components/dashboard/WorkoutTypeChart.svelte';
	import PenCheck from '$lib/components/shared/PenCheck.svelte';
	import DashboardSkeleton from '$lib/components/skeletons/DashboardSkeleton.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { addDaysToDateString, formatMonthDay } from '$lib/utils/date';
	import {
		ArrowRight,
		Book,
		CircleAlert,
		CircleCheck,
		Dumbbell,
		Heart,
		Users
	} from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';

	let { data } = $props();

	// Optimistic ticks: the stroke draws the moment the box is clicked.
	let pending = $state<Record<string, boolean>>({});

	// Trend direction helpers
	function trendDelta(current: number, previous: number): number | null {
		if (previous === 0) return null;
		return Math.round(((current - previous) / previous) * 100);
	}

	const workoutDelta = $derived(
		trendDelta(data.stats.workoutsThisWeek, data.stats.workoutsLastWeek)
	);
	const meditationDelta = $derived(
		trendDelta(data.stats.meditationThisWeek, data.stats.meditationLastWeek)
	);
	const taskDelta = $derived(
		trendDelta(data.taskStats.completedThisWeek, data.taskStats.completedLastWeek)
	);

	const workoutGapLabel = $derived(
		data.daysSinceLastWorkout === null
			? 'No workouts logged yet'
			: data.daysSinceLastWorkout === 0
				? 'You worked out today!'
				: data.daysSinceLastWorkout === 1
					? 'Last workout: yesterday'
					: `Last workout: ${data.daysSinceLastWorkout} days ago`
	);

	const workoutGapClass = $derived(
		data.daysSinceLastWorkout === null
			? 'text-muted-foreground'
			: data.daysSinceLastWorkout === 0
				? 'text-pen-fitness'
				: data.daysSinceLastWorkout <= 3
					? 'text-muted-foreground'
					: data.daysSinceLastWorkout <= 6
						? 'text-pen-warn'
						: 'text-destructive'
	);

	const tomorrow = $derived(addDaysToDateString(data.today, 1));

	function dueDateLabel(dueDate: string): string {
		if (dueDate === data.today) return 'Today';
		if (dueDate === tomorrow) return 'Tomorrow';
		return formatMonthDay(dueDate);
	}

	const doneCount = $derived(
		data.todayAgendaSummary.items.filter((i) => pending[i.id] ?? i.completed).length
	);

	const agendaProgressPct = $derived(
		data.todayAgendaSummary.total > 0
			? Math.round((doneCount / data.todayAgendaSummary.total) * 100)
			: 0
	);

	// Weekly meditation goal, with reminder urgency escalating as the week
	// progresses without hitting it (dowIndex: 0 = Monday ... 6 = Sunday).
	const meditationWeeklyGoal = $derived(data.dashboardGoals.meditationWeeklyGoal);

	const meditationGoal = $derived.by(() => {
		if (data.stats.meditationThisWeek >= meditationWeeklyGoal) {
			return {
				label: 'Weekly goal met',
				textClass: 'text-pen-fitness'
			};
		}
		if (data.todayDowIndex <= 2) {
			return {
				label: `Goal: ${meditationWeeklyGoal} session${meditationWeeklyGoal === 1 ? '' : 's'} this week`,
				textClass: 'text-muted-foreground'
			};
		}
		if (data.todayDowIndex <= 5) {
			return {
				label: "Don't forget your session this week",
				textClass: 'text-pen-warn'
			};
		}
		return {
			label: 'Last day to hit your weekly goal!',
			textClass: 'text-destructive',
			iconBgClass: 'bg-destructive/15',
			iconClass: 'text-destructive'
		};
	});

	const activityConfig = {
		journal: { icon: Book, pen: 'blue' },
		workout: { icon: Dumbbell, pen: 'green' },
		meditation: { icon: Heart, pen: 'purple' },
		task: { icon: CircleCheck, pen: 'orange' },
		visit: { icon: Users, pen: 'pink' }
	};

	// The planner page header: day numeral plus a Monday-first week strip.
	const dayNumber = $derived(Number(data.today.slice(8, 10)));
	const weekDays = $derived(
		['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => {
			const date = addDaysToDateString(data.today, i - data.todayDowIndex);
			return { letter, day: Number(date.slice(8, 10)), isToday: i === data.todayDowIndex };
		})
	);
	const [weekdayLabel, ...restLabel] = $derived(data.todayLabel.split(', '));

	function signed(delta: number) {
		return `${delta >= 0 ? '+' : ''}${delta}%`;
	}
</script>

<svelte:head>
	<title>Today - Synapse</title>
</svelte:head>

{#snippet delta(value: number | null)}
	{#if value !== null}
		<span
			class={[
				'washi tabular-nums',
				value >= 0 ? 'bg-pen-fitness/12 text-pen-fitness' : 'bg-destructive/10 text-destructive'
			]}>{signed(value)} vs last week</span
		>
	{/if}
{/snippet}

{#snippet heading(title: string, pen: string, href?: string, linkLabel?: string)}
	<div class="ruled mb-4 flex items-baseline gap-3 pb-2" style="--pen: oklch(var(--color-{pen}))">
		<span
			class="size-2.5 translate-y-[-1px] self-center rounded-[1px] bg-(--pen)"
			aria-hidden="true"
		></span>
		<h2 class="text-lg font-black tracking-tight">{title}</h2>
		{#if href}
			<a
				{href}
				class="ml-auto flex items-center gap-1 text-xs font-bold text-(--pen) hover:underline"
			>
				{linkLabel}<ArrowRight class="size-3" aria-hidden="true" />
			</a>
		{/if}
	</div>
{/snippet}

{#if navigating.to?.url.pathname === '/dashboard'}
	<DashboardSkeleton />
{:else}
	<div class="mx-auto w-full max-w-7xl space-y-12" in:fade={{ duration: 160 }}>
		<!-- ── Page header: the date, as a planner prints it ─────────────────── -->
		<header class="ruled flex flex-wrap items-end gap-x-6 gap-y-4 pb-5">
			<div class="flex items-end gap-4">
				<span
					class="text-[5.5rem] leading-[0.8] font-black tracking-[-0.04em] tabular-nums md:text-[7.5rem]"
				>
					{dayNumber}
				</span>
				<div class="pb-1">
					<p class="text-pen-brand text-xl font-black md:text-2xl">{weekdayLabel}</p>
					<p class="text-muted-foreground text-sm font-medium">{restLabel.join(', ')}</p>
					<p class="mt-2 text-sm">Hey, <span class="font-bold">{data.user.name}</span></p>
				</div>
			</div>

			<ol class="ml-auto flex gap-1" aria-label="This week">
				{#each weekDays as d, i (i)}
					<li
						class={[
							'flex w-9 flex-col items-center gap-1 py-1.5 text-xs tabular-nums',
							d.isToday ? 'text-pen-brand font-black' : 'text-muted-foreground'
						]}
						aria-current={d.isToday ? 'date' : undefined}
					>
						<span class="text-[0.65rem] font-bold">{d.letter}</span>
						<span
							class={[
								'grid size-7 place-items-center rounded-full text-sm',
								d.isToday && 'ring-pen-brand ring-[1.5px]'
							]}>{d.day}</span
						>
					</li>
				{/each}
			</ol>

			{#if data.taskStats.openHighPriority > 0}
				<a
					href="/tasks"
					class="bg-pen-warn/15 text-foreground hover:bg-pen-warn/25 flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors sm:w-auto"
				>
					<CircleAlert class="text-pen-warn size-4 shrink-0" />
					<span>
						<span class="font-black">{data.taskStats.openHighPriority}</span>
						high-priority task{data.taskStats.openHighPriority !== 1 ? 's' : ''} open
					</span>
				</a>
			{/if}
		</header>

		<!-- ── Today's agenda + the margin of readings ──────────────────────── -->
		<div class="grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
			<section aria-labelledby="agenda-h" class="min-w-0">
				<div class="ruled mb-1 flex items-baseline gap-3 pb-2">
					<h2 id="agenda-h" class="text-2xl font-black tracking-tight">Today's agenda</h2>
					<span class="text-muted-foreground text-sm tabular-nums">
						<span class="text-foreground font-black">{doneCount}</span>
						/ {data.todayAgendaSummary.total} done
					</span>
					<a
						href="/tasks?tab=agenda"
						class="text-pen-tasks ml-auto flex items-center gap-1 text-xs font-bold hover:underline"
						>Open agenda<ArrowRight class="size-3" aria-hidden="true" /></a
					>
				</div>

				{#if data.todayAgendaSummary.total === 0}
					<div class="border-rule border-b border-dashed py-8">
						<p class="text-sm font-medium">No agenda items for today.</p>
						<a
							href="/tasks?tab=agenda"
							class="text-pen-tasks mt-1 inline-block text-sm font-bold hover:underline"
							>Set up your daily agenda</a
						>
					</div>
				{:else}
					<div class="bg-rule mb-2 h-1 w-full" aria-hidden="true">
						<div
							class="bg-pen-tasks h-full transition-[width] duration-500"
							style="width: {agendaProgressPct}%"
						></div>
					</div>
					<ul>
						{#each data.todayAgendaSummary.items as item (item.id)}
							{@const done = pending[item.id] ?? item.completed}
							<li class="border-rule flex min-h-11 items-center gap-2 border-b">
								<form
									method="POST"
									action="/tasks?/toggleAgendaEntry"
									use:enhance={() => {
										pending[item.id] = !item.completed;
										return async ({ result }) => {
											if (result.type !== 'success') {
												toast.error('Unable to update agenda item.');
											}
											await invalidateAll();
											delete pending[item.id];
										};
									}}
								>
									<input type="hidden" name="id" value={item.id} />
									<input type="hidden" name="completed" value={item.completed ? 'false' : 'true'} />
									<PenCheck
										checked={done}
										label={item.title}
										style="--pen: oklch(var(--color-orange))"
										onchange={(event) => event.currentTarget.form?.requestSubmit()}
									/>
								</form>
								<span
									class={[
										'text-[0.95rem] transition-colors',
										done && 'text-muted-foreground decoration-pen-tasks/70 line-through'
									]}
								>
									{item.title}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<!-- Readings: the week so far, one pen per domain -->
			<section aria-labelledby="readings-h" class="lg:border-rule min-w-0 lg:border-l lg:pl-10">
				<h2 id="readings-h" class="ruled mb-1 pb-2 text-2xl font-black tracking-tight">
					This week
				</h2>
				<div class="divide-rule divide-y">
					<a href="/fitness" class="group flex items-center gap-4 py-4">
						<span class="text-pen-fitness block w-16 text-5xl leading-none font-black tabular-nums">
							{data.stats.workoutsThisWeek}
						</span>
						<div class="min-w-0 flex-1">
							<span class="flex flex-wrap items-center gap-2 font-bold group-hover:underline">
								Workouts {@render delta(workoutDelta)}
							</span>
							<p class="mt-0.5 text-sm font-medium {workoutGapClass}">{workoutGapLabel}</p>
						</div>
					</a>
					<a href="/meditation" class="group flex items-center gap-4 py-4">
						<span class="text-pen-mind block w-16 text-5xl leading-none font-black tabular-nums">
							{data.stats.meditationThisWeek}
						</span>
						<div class="min-w-0 flex-1">
							<span class="flex flex-wrap items-center gap-2 font-bold group-hover:underline">
								Meditation sessions {@render delta(meditationDelta)}
							</span>
							<p
								class="mt-0.5 flex items-center gap-1.5 text-sm font-medium {meditationGoal.textClass}"
							>
								{#if data.stats.meditationThisWeek >= meditationWeeklyGoal}
									<CircleCheck class="size-4 shrink-0" />
								{/if}
								{meditationGoal.label}
							</p>
						</div>
					</a>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<a href="/tasks" {...props} class="group flex items-center gap-4 py-4">
									<span
										class="text-pen-tasks block w-16 text-5xl leading-none font-black tabular-nums"
									>
										{data.taskStats.completedThisWeek}
									</span>
									<div class="min-w-0 flex-1">
										<span class="flex flex-wrap items-center gap-2 font-bold group-hover:underline">
											Tasks completed {@render delta(taskDelta)}
										</span>
										<p class="text-muted-foreground mt-0.5 text-sm tabular-nums">
											{data.taskStats.completedLastWeek} last week · {data.taskStats.openTotal} open
										</p>
									</div>
								</a>
							{/snippet}
						</Tooltip.Trigger>
						{#if data.taskStats.completedThisWeekTitles.length > 0}
							<Tooltip.Content>{data.taskStats.completedThisWeekTitles.join(', ')}</Tooltip.Content>
						{/if}
					</Tooltip.Root>
					<a href="/visits" class="group flex items-center gap-4 py-4">
						<span class="text-pen-people block w-16 text-5xl leading-none font-black tabular-nums">
							{data.visitHealthCounts.critical + data.visitHealthCounts.overdue}
						</span>
						<div class="min-w-0 flex-1">
							<span class="font-bold group-hover:underline">People to see</span>
							<p class="text-muted-foreground mt-0.5 truncate text-sm">
								{[...data.visitHealthNames.critical, ...data.visitHealthNames.overdue].join(', ') ||
									'Everyone is up to date'}
							</p>
						</div>
					</a>
				</div>

				{#if data.dueSoonTasks.length > 0}
					<h3 class="text-muted-foreground mt-6 mb-1 text-xs font-bold tracking-[0.14em] uppercase">
						Due soon
					</h3>
					<ul>
						{#each data.dueSoonTasks as task (task.id)}
							<li>
								<a
									href="/tasks"
									class="border-rule hover:bg-muted/60 flex min-h-10 items-center justify-between gap-3 border-b border-dashed text-sm"
								>
									<span class="truncate">{task.title}</span>
									<span
										class={[
											'shrink-0 text-xs tabular-nums',
											task.dueDate === data.today
												? 'text-pen-tasks font-black'
												: 'text-muted-foreground'
										]}>{dueDateLabel(task.dueDate)}</span
									>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>

		<!-- ── Agenda over time ───────────────────────────────────────────────── -->
		<div class="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
			<section class="min-w-0">
				{@render heading('Agenda completion', 'orange')}
				<p class="text-muted-foreground -mt-2 mb-3 text-xs">8-week trend</p>
				<AgendaCompletionChart trend={data.agendaCompletionTrend} />
			</section>
			<section class="min-w-0">
				{@render heading('Agenda items', 'orange')}
				<p class="text-muted-foreground -mt-2 mb-3 text-xs">4-week completion · worst first</p>
				<AgendaItemScorecard items={data.agendaItemStats} />
			</section>
		</div>

		<!-- ── Body and people ───────────────────────────────────────────────── -->
		<div class="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
			<section class="min-w-0">
				{@render heading('Workout breakdown', 'green', '/fitness', 'Fitness')}
				<p class="text-muted-foreground -mt-2 mb-3 text-xs">By type, last 4 weeks</p>
				<WorkoutTypeChart
					breakdown={data.workoutTypeBreakdown}
					greenThreshold={data.dashboardGoals.workoutGreenThreshold}
					amberThreshold={data.dashboardGoals.workoutAmberThreshold}
				/>
			</section>
			<section class="min-w-0">
				{@render heading('Visit health', 'pink', '/visits', 'View all')}
				<VisitHealthPanel
					counts={data.visitHealthCounts}
					names={data.visitHealthNames}
					upcomingVisits={data.upcomingVisits}
				/>
			</section>
		</div>

		<!-- ── Recent activity, as a written log ──────────────────────────────── -->
		<section class="min-w-0">
			{@render heading('Recent activity', 'teal')}
			<ul class="grid grid-cols-1 gap-x-10 md:grid-cols-2">
				{#each data.recentActivity as item (item.id)}
					{@const cfg = activityConfig[item.type as keyof typeof activityConfig]}
					{@const Icon = cfg.icon}
					<li style="--pen: oklch(var(--color-{cfg.pen}))">
						<a
							href={item.href}
							class="border-rule hover:bg-muted/50 flex min-h-14 items-center gap-3 border-b py-2"
						>
							<Icon class="size-4 shrink-0 text-(--pen)" aria-hidden="true" />
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">{item.title}</span>
								<span class="text-muted-foreground block text-xs tabular-nums">{item.meta}</span>
							</span>
						</a>
					</li>
				{:else}
					<li class="text-muted-foreground py-8 text-sm md:col-span-2">
						No recent activity yet. Start tracking to see your history here.
					</li>
				{/each}
			</ul>
		</section>
	</div>
{/if}

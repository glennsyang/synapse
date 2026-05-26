<script lang="ts">
	import { navigating } from '$app/state';
	import AgendaCompletionChart from '$lib/components/dashboard/AgendaCompletionChart.svelte';
	import AgendaItemScorecard from '$lib/components/dashboard/AgendaItemScorecard.svelte';
	import VisitHealthPanel from '$lib/components/dashboard/VisitHealthPanel.svelte';
	import WorkoutTypeChart from '$lib/components/dashboard/WorkoutTypeChart.svelte';
	import DashboardSkeleton from '$lib/components/skeletons/DashboardSkeleton.svelte';
	import {
		Book,
		CalendarCheck,
		Circle,
		CircleAlert,
		CircleCheck,
		Dumbbell,
		Heart,
		ListTodo,
		Users
	} from '@lucide/svelte/icons';
	import { fade } from 'svelte/transition';

	let { data } = $props();

	// Trend direction helpers
	function trendDelta(current: number, previous: number): number | null {
		if (previous === 0) return null;
		return Math.round(((current - previous) / previous) * 100);
	}

	const journalDelta = $derived(trendDelta(data.stats.journalThisWeek, data.stats.journalLastWeek));
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
				? 'text-[oklch(var(--color-green))]'
				: data.daysSinceLastWorkout <= 3
					? 'text-muted-foreground'
					: data.daysSinceLastWorkout <= 6
						? 'text-amber-500'
						: 'text-destructive'
	);

	const agendaProgressPct = $derived(
		data.todayAgendaSummary.total > 0
			? Math.round((data.todayAgendaSummary.completed / data.todayAgendaSummary.total) * 100)
			: 0
	);

	const activityConfig = {
		journal: {
			icon: Book,
			bgClass: 'bg-[oklch(var(--color-blue)/0.15)]',
			iconClass: 'text-[oklch(var(--color-blue))]'
		},
		workout: {
			icon: Dumbbell,
			bgClass: 'bg-[oklch(var(--color-green)/0.15)]',
			iconClass: 'text-[oklch(var(--color-green))]'
		},
		meditation: {
			icon: Heart,
			bgClass: 'bg-[oklch(var(--color-purple)/0.15)]',
			iconClass: 'text-[oklch(var(--color-purple))]'
		},
		task: {
			icon: CircleCheck,
			bgClass: 'bg-[oklch(var(--color-orange)/0.15)]',
			iconClass: 'text-[oklch(var(--color-orange))]'
		},
		visit: {
			icon: Users,
			bgClass: 'bg-[oklch(var(--color-pink)/0.15)]',
			iconClass: 'text-[oklch(var(--color-pink))]'
		}
	};
</script>

<svelte:head>
	<title>Dashboard - Synapse</title>
</svelte:head>

{#if navigating.to?.url.pathname === '/dashboard'}
	<DashboardSkeleton />
{:else}
	<div class="space-y-8" in:fade={{ duration: 200 }}>
		<!-- ── Hero Band ──────────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-2">
				<h1 class="font-display text-4xl font-bold tracking-tight md:text-5xl">
					Hey,
					<span
						class="bg-linear-to-r from-[oklch(var(--color-teal))] to-[oklch(var(--color-blue))] bg-clip-text text-transparent"
					>
						{data.user.name}
					</span>
				</h1>
				<p class="text-muted-foreground text-sm">{data.todayLabel}</p>
			</div>

			{#if data.taskStats.openHighPriority > 0}
				<a
					href="/tasks"
					class="flex w-fit items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm transition-colors hover:bg-amber-500/20"
				>
					<CircleAlert class="size-4 shrink-0 text-amber-500" />
					<span class="text-amber-600 dark:text-amber-400">
						<span class="font-bold">{data.taskStats.openHighPriority}</span>
						high-priority task{data.taskStats.openHighPriority !== 1 ? 's' : ''}
						open
					</span>
				</a>
			{/if}
		</div>

		<!-- ── Primary Row: Workout Hero + Today's Agenda ───────────────────── -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-5">
			<!-- Workout Hero Card -->
			<a
				href="/fitness"
				class="group bg-card relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md md:col-span-3"
			>
				<div class="flex items-start justify-between">
					<div class="rounded-xl bg-[oklch(var(--color-green)/0.15)] p-2.5">
						<Dumbbell class="size-5 text-[oklch(var(--color-green))]" />
					</div>
					{#if workoutDelta !== null}
						<span
							class="rounded-full px-2 py-0.5 text-xs font-semibold {workoutDelta >= 0
								? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
								: 'bg-destructive/10 text-destructive'}"
						>
							{workoutDelta >= 0 ? '+' : ''}{workoutDelta}%
						</span>
					{/if}
				</div>
				<div class="mt-4">
					<div class="font-display text-5xl leading-none font-bold tabular-nums">
						{data.stats.workoutsThisWeek}
					</div>
					<p class="text-muted-foreground mt-1.5 text-sm">Workouts this week</p>
					<p class="mt-3 text-sm font-medium {workoutGapClass}">{workoutGapLabel}</p>
				</div>
				<div
					class="absolute inset-x-0 bottom-0 h-0.5 bg-[oklch(var(--color-green))] opacity-0 transition-opacity group-hover:opacity-100"
				></div>
			</a>

			<!-- Today's Agenda Summary -->
			<div class="bg-card rounded-2xl border p-5 shadow-xs md:col-span-2">
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-[oklch(var(--color-orange)/0.15)] p-1.5">
							<CalendarCheck class="size-4 text-[oklch(var(--color-orange))]" />
						</div>
						<div>
							<h3 class="font-display text-sm font-semibold">Today's Agenda</h3>
							<p class="text-muted-foreground text-xs">
								{data.todayAgendaSummary.completed}
								of {data.todayAgendaSummary.total} done
							</p>
						</div>
					</div>
					<span
						class="font-display text-2xl font-bold text-[oklch(var(--color-orange))] tabular-nums"
					>
						{agendaProgressPct}%
					</span>
				</div>

				{#if data.todayAgendaSummary.total === 0}
					<p class="text-muted-foreground py-4 text-sm">No agenda items for today.</p>
				{:else}
					<div class="bg-muted mb-4 h-1.5 w-full overflow-hidden rounded-full">
						<div
							class="h-full rounded-full bg-[oklch(var(--color-orange))] transition-all duration-500"
							style="width: {agendaProgressPct}%"
						></div>
					</div>
					<div class="space-y-2.5">
						{#each data.todayAgendaSummary.items as item (item.id)}
							<div class="flex items-center gap-2.5">
								{#if item.completed}
									<CircleCheck class="size-4 shrink-0 text-[oklch(var(--color-green))]" />
								{:else}
									<Circle class="text-muted-foreground/40 size-4 shrink-0" />
								{/if}
								<span
									class="text-sm {item.completed
										? 'text-muted-foreground line-through'
										: 'text-foreground'}"
								>
									{item.title}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- ── Agenda Analytics ───────────────────────────────────────────────── -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- Agenda Completion Trend -->
			<div class="bg-card rounded-2xl border p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-orange)/0.15)] p-1.5">
						<CalendarCheck class="size-4 text-[oklch(var(--color-orange))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Daily Agenda Completion</h3>
						<p class="text-muted-foreground text-xs">8-week trend</p>
					</div>
				</div>
				<AgendaCompletionChart trend={data.agendaCompletionTrend} />
			</div>

			<!-- Agenda Item Scorecard -->
			<div class="bg-card rounded-2xl border p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-orange)/0.15)] p-1.5">
						<CalendarCheck class="size-4 text-[oklch(var(--color-orange))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Agenda Item Breakdown</h3>
						<p class="text-muted-foreground text-xs">4-week completion · worst first</p>
					</div>
				</div>
				<AgendaItemScorecard items={data.agendaItemStats} />
			</div>
		</div>

		<!-- ── Secondary Strip: Journal + Meditation ─────────────────────────── -->
		<div class="grid grid-cols-2 gap-4">
			<a
				href="/journal"
				class="group bg-card/60 hover:bg-card flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors"
			>
				<div class="shrink-0 rounded-lg bg-[oklch(var(--color-blue)/0.15)] p-2">
					<Book class="size-4 text-[oklch(var(--color-blue))]" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<span class="font-display text-xl font-bold tabular-nums">
							{data.stats.journalThisWeek}
						</span>
						{#if journalDelta !== null}
							<span
								class="rounded-full px-1.5 py-0.5 text-xs font-semibold {journalDelta >= 0
									? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
									: 'bg-destructive/10 text-destructive'}"
							>
								{journalDelta >= 0 ? '+' : ''}{journalDelta}%
							</span>
						{/if}
					</div>
					<p class="text-muted-foreground truncate text-xs">Journal entries this week</p>
				</div>
			</a>

			<a
				href="/meditation"
				class="group bg-card/60 hover:bg-card flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors"
			>
				<div class="shrink-0 rounded-lg bg-[oklch(var(--color-purple)/0.15)] p-2">
					<Heart class="size-4 text-[oklch(var(--color-purple))]" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<span class="font-display text-xl font-bold tabular-nums">
							{data.stats.meditationThisWeek}
						</span>
						{#if meditationDelta !== null}
							<span
								class="rounded-full px-1.5 py-0.5 text-xs font-semibold {meditationDelta >= 0
									? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
									: 'bg-destructive/10 text-destructive'}"
							>
								{meditationDelta >= 0 ? '+' : ''}{meditationDelta}%
							</span>
						{/if}
					</div>
					<p class="text-muted-foreground truncate text-xs">Meditation sessions this week</p>
				</div>
			</a>
		</div>

		<!-- ── Fitness + Tasks ────────────────────────────────────────────────── -->
		<div class="grid gap-4 md:grid-cols-2">
			<!-- Workout Type Breakdown -->
			<div class="bg-card rounded-2xl border p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-green)/0.15)] p-1.5">
						<Dumbbell class="size-4 text-[oklch(var(--color-green))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Workout Breakdown</h3>
						<p class="text-muted-foreground text-xs">By type, last 4 weeks</p>
					</div>
				</div>
				<WorkoutTypeChart breakdown={data.workoutTypeBreakdown} />
			</div>

			<!-- Task Stats -->
			<div class="bg-card rounded-2xl border p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-orange)/0.15)] p-1.5">
						<ListTodo class="size-4 text-[oklch(var(--color-orange))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Tasks</h3>
						<p class="text-muted-foreground text-xs">This week vs last week</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground flex items-center gap-2 text-sm">
							<CircleCheck class="size-4 text-[oklch(var(--color-green))]" />
							Completed this week
						</div>
						<div class="flex items-center gap-2">
							<span class="font-display text-2xl font-bold tabular-nums">
								{data.taskStats.completedThisWeek}
							</span>
							{#if taskDelta !== null}
								<span
									class="rounded-full px-1.5 py-0.5 text-xs font-semibold {taskDelta >= 0
										? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
										: 'bg-destructive/10 text-destructive'}"
								>
									{taskDelta >= 0 ? '+' : ''}{taskDelta}%
								</span>
							{/if}
						</div>
					</div>
					<div class="bg-border/60 h-px"></div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">Completed last week</span>
						<span class="font-display text-muted-foreground text-2xl font-bold tabular-nums">
							{data.taskStats.completedLastWeek}
						</span>
					</div>
					<div class="bg-border/60 h-px"></div>
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground flex items-center gap-2 text-sm">
							<CircleAlert class="size-4 text-amber-500" />
							Open high-priority
						</div>
						<a
							href="/tasks"
							class="font-display text-2xl font-bold text-amber-500 tabular-nums hover:underline"
						>
							{data.taskStats.openHighPriority}
						</a>
					</div>
					<div class="bg-border/60 h-px"></div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">Open total</span>
						<a href="/tasks" class="font-display text-2xl font-bold tabular-nums hover:underline">
							{data.taskStats.openTotal}
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Visit Health ───────────────────────────────────────────────────── -->
		<div class="bg-card rounded-2xl border p-5 shadow-xs">
			<div class="mb-4 flex items-center gap-2">
				<div class="rounded-lg bg-[oklch(var(--color-pink)/0.15)] p-1.5">
					<CalendarCheck class="size-4 text-[oklch(var(--color-pink))]" />
				</div>
				<div>
					<h3 class="font-display text-sm font-semibold">Visit Health</h3>
					<p class="text-muted-foreground text-xs">
						<a href="/visits" class="hover:underline">View all →</a>
					</p>
				</div>
			</div>
			<VisitHealthPanel
				counts={data.visitHealthCounts}
				names={data.visitHealthNames}
				upcomingVisits={data.upcomingVisits}
			/>
		</div>

		<!-- ── Recent Activity Feed ───────────────────────────────────────────── -->
		<div class="bg-card rounded-2xl border shadow-xs">
			<div class="border-b px-5 py-4">
				<h3 class="font-display text-sm font-semibold">Recent Activity</h3>
			</div>
			<div class="divide-y">
				{#each data.recentActivity as item (item.id)}
					{@const cfg = activityConfig[item.type as keyof typeof activityConfig]}
					{@const Icon = cfg.icon}
					<a
						href={item.href}
						class="hover:bg-muted/40 flex items-start gap-3 px-5 py-3.5 transition-colors"
					>
						<div class="mt-0.5 shrink-0 rounded-md p-1.5 {cfg.bgClass}">
							<Icon class="size-3.5 {cfg.iconClass}" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{item.title}</p>
							<p class="text-muted-foreground mt-0.5 text-xs">{item.meta}</p>
						</div>
					</a>
				{:else}
					<div class="text-muted-foreground px-5 py-8 text-center text-sm">
						No recent activity yet. Start tracking to see your history here.
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

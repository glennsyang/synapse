<script lang="ts">
	import {
		Book,
		CalendarCheck,
		CircleAlert,
		CircleCheck,
		Dumbbell,
		Heart,
		ListTodo,
		Users
	} from '@lucide/svelte/icons';
	import { fade } from 'svelte/transition';

	import { navigating } from '$app/state';
	import AgendaCompletionChart from '$lib/components/dashboard/AgendaCompletionChart.svelte';
	import VisitHealthPanel from '$lib/components/dashboard/VisitHealthPanel.svelte';
	import WorkoutTypeChart from '$lib/components/dashboard/WorkoutTypeChart.svelte';
	import DashboardSkeleton from '$lib/components/skeletons/DashboardSkeleton.svelte';

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
			bgClass: 'bg-[oklch(var(--color-teal)/0.15)]',
			iconClass: 'text-[oklch(var(--color-teal))]'
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
				<p class="text-sm text-muted-foreground">
					{new Date().toLocaleDateString('en-US', {
						weekday: 'long',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>

			{#if data.taskStats.openHighPriority > 0}
				<a
					href="/tasks"
					class="flex w-fit items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm transition-colors hover:bg-amber-500/20"
				>
					<CircleAlert class="size-4 shrink-0 text-amber-500" />
					<span class="text-amber-600 dark:text-amber-400">
						<span class="font-bold">{data.taskStats.openHighPriority}</span>
						high-priority task{data
							.taskStats.openHighPriority !== 1
							? 's'
							: ''}
						open
					</span>
				</a>
			{/if}
		</div>

		<!-- ── Command Strip: 3 Stat Cards ───────────────────────────────────── -->
		<div class="grid gap-4 sm:grid-cols-3">
			<!-- Journal -->
			<a
				href="/journal"
				class="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="flex items-start justify-between">
					<div class="rounded-xl bg-[oklch(var(--color-blue)/0.15)] p-2.5">
						<Book class="size-5 text-[oklch(var(--color-blue))]" />
					</div>
					{#if journalDelta !== null}
						<span
							class="rounded-full px-2 py-0.5 text-xs font-semibold {journalDelta >= 0
								? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
								: 'bg-destructive/10 text-destructive'}"
						>
							{journalDelta >= 0 ? '+' : ''}{journalDelta}%
						</span>
					{/if}
				</div>
				<div class="mt-4">
					<div class="font-display text-4xl font-bold tabular-nums leading-none">
						{data.stats.journalThisWeek}
					</div>
					<p class="mt-1 text-sm text-muted-foreground">Journal entries this week</p>
				</div>
				<div
					class="absolute inset-x-0 bottom-0 h-0.5 bg-[oklch(var(--color-blue))] opacity-0 transition-opacity group-hover:opacity-100"
				></div>
			</a>

			<!-- Workouts -->
			<a
				href="/fitness"
				class="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
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
					<div class="font-display text-4xl font-bold tabular-nums leading-none">
						{data.stats.workoutsThisWeek}
					</div>
					<p class="mt-1 text-sm text-muted-foreground">Workouts this week</p>
				</div>
				<div
					class="absolute inset-x-0 bottom-0 h-0.5 bg-[oklch(var(--color-green))] opacity-0 transition-opacity group-hover:opacity-100"
				></div>
			</a>

			<!-- Meditation -->
			<a
				href="/meditation"
				class="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="flex items-start justify-between">
					<div class="rounded-xl bg-[oklch(var(--color-purple)/0.15)] p-2.5">
						<Heart class="size-5 text-[oklch(var(--color-purple))]" />
					</div>
					{#if meditationDelta !== null}
						<span
							class="rounded-full px-2 py-0.5 text-xs font-semibold {meditationDelta >= 0
								? 'bg-[oklch(var(--color-green)/0.15)] text-[oklch(var(--color-green))]'
								: 'bg-destructive/10 text-destructive'}"
						>
							{meditationDelta >= 0 ? '+' : ''}{meditationDelta}%
						</span>
					{/if}
				</div>
				<div class="mt-4">
					<div class="font-display text-4xl font-bold tabular-nums leading-none">
						{data.stats.meditationThisWeek}
					</div>
					<p class="mt-1 text-sm text-muted-foreground">Meditation sessions this week</p>
				</div>
				<div
					class="absolute inset-x-0 bottom-0 h-0.5 bg-[oklch(var(--color-purple))] opacity-0 transition-opacity group-hover:opacity-100"
				></div>
			</a>
		</div>

		<!-- ── Analytics Row 1: Tasks ─────────────────────────────────────────── -->
		<div class="grid gap-4 md:grid-cols-2">
			<!-- Agenda Completion Trend -->
			<div class="rounded-2xl border bg-card p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-orange)/0.15)] p-1.5">
						<CalendarCheck class="size-4 text-[oklch(var(--color-orange))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Daily Agenda Completion</h3>
						<p class="text-xs text-muted-foreground">6-week trend</p>
					</div>
				</div>
				<AgendaCompletionChart trend={data.agendaCompletionTrend} />
			</div>

			<!-- Task Stats -->
			<div class="rounded-2xl border bg-card p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-orange)/0.15)] p-1.5">
						<ListTodo class="size-4 text-[oklch(var(--color-orange))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Tasks</h3>
						<p class="text-xs text-muted-foreground">This week vs last week</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
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
					<div class="h-px bg-border/60"></div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Completed last week</span>
						<span class="font-display text-2xl font-bold tabular-nums text-muted-foreground">
							{data.taskStats.completedLastWeek}
						</span>
					</div>
					<div class="h-px bg-border/60"></div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<CircleAlert class="size-4 text-amber-500" />
							Open high-priority
						</div>
						<a
							href="/tasks"
							class="font-display text-2xl font-bold tabular-nums text-amber-500 hover:underline"
						>
							{data.taskStats.openHighPriority}
						</a>
					</div>
					<div class="h-px bg-border/60"></div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Open total</span>
						<a href="/tasks" class="font-display text-2xl font-bold tabular-nums hover:underline">
							{data.taskStats.openTotal}
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Analytics Row 2: Fitness + Visits ─────────────────────────────── -->
		<div class="grid gap-4 md:grid-cols-2">
			<!-- Workout Type Breakdown -->
			<div class="rounded-2xl border bg-card p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-green)/0.15)] p-1.5">
						<Dumbbell class="size-4 text-[oklch(var(--color-green))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Workout Breakdown</h3>
						<p class="text-xs text-muted-foreground">By type, last 4 weeks</p>
					</div>
				</div>
				<WorkoutTypeChart breakdown={data.workoutTypeBreakdown} />
			</div>

			<!-- Visit Health -->
			<div class="rounded-2xl border bg-card p-5 shadow-xs">
				<div class="mb-4 flex items-center gap-2">
					<div class="rounded-lg bg-[oklch(var(--color-pink)/0.15)] p-1.5">
						<CalendarCheck class="size-4 text-[oklch(var(--color-pink))]" />
					</div>
					<div>
						<h3 class="font-display text-sm font-semibold">Visit Health</h3>
						<p class="text-xs text-muted-foreground">
							<a href="/visits" class="hover:underline">View all →</a>
						</p>
					</div>
				</div>
				<VisitHealthPanel counts={data.visitHealthCounts} />
			</div>
		</div>

		<!-- ── Recent Activity Feed ───────────────────────────────────────────── -->
		<div class="rounded-2xl border bg-card shadow-xs">
			<div class="border-b px-5 py-4">
				<h3 class="font-display text-sm font-semibold">Recent Activity</h3>
			</div>
			<div class="divide-y">
				{#each data.recentActivity as item (item.id)}
					{@const cfg = activityConfig[item.type as keyof typeof activityConfig]}
					{@const Icon = cfg.icon}
					<a
						href={item.href}
						class="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
					>
						<div class="mt-0.5 shrink-0 rounded-md p-1.5 {cfg.bgClass}">
							<Icon class="size-3.5 {cfg.iconClass}" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{item.title}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>
						</div>
					</a>
				{:else}
					<div class="px-5 py-8 text-center text-sm text-muted-foreground">
						No recent activity yet. Start tracking to see your history here.
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

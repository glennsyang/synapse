<script lang="ts">
import { Book, Dumbbell, Heart } from '@lucide/svelte/icons';
import { scaleTime } from 'd3-scale';
import { LineChart } from 'layerchart';
import { fade } from 'svelte/transition';

import { navigating } from '$app/state';
import ContentSection from '$lib/components/app/ContentSection.svelte';
import FeatureCard from '$lib/components/app/FeatureCard.svelte';
import StatCard from '$lib/components/app/StatCard.svelte';
import DashboardSkeleton from '$lib/components/skeletons/DashboardSkeleton.svelte';
import * as Accordion from '$lib/components/ui/accordion/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import * as Chart from '$lib/components/ui/chart/index.js';
import * as ScrollArea from '$lib/components/ui/scroll-area/index.js';
import {
	formatDateMedium,
	formatTime12Hour,
	formatTimestampMedium,
	formatTimestampShort
} from '$lib/utils/date';
import { createMarkdownExcerpt } from '$lib/utils/markdown';

import { navItems } from './../sidebar';

let { data } = $props();

const features = $derived(navItems.navMain.filter((item) => item.title !== 'Dashboard'));

// Map features to colors
const featureColors = {
	Journal: 'blue' as const,
	Tasks: 'orange' as const,
	Fitness: 'green' as const,
	Meditation: 'purple' as const,
	Visits: 'pink' as const
};

// Chart configuration
const chartConfig = {
	total: { label: 'Total Activity', color: 'oklch(var(--color-teal))' }
} satisfies Chart.ChartConfig;

// Prepare chart data
const chartData = $derived(
	data.stats.weeklyActivity.map((d) => ({
		date: new Date(d.date),
		journal: d.journal,
		meditation: d.meditation,
		workouts: d.workouts,
		total: d.journal + d.meditation + d.workouts
	}))
);
</script>

<svelte:head> <title>Dashboard - Synapse</title> </svelte:head>

{#if navigating.to?.url.pathname === '/dashboard'}
	<DashboardSkeleton />
{:else}
	<div class="space-y-8" in:fade={{ duration: 200 }}>
		<!-- Hero Section -->
		<div class="space-y-3">
			<h1 class="font-display text-4xl font-bold tracking-tight md:text-5xl">
				Welcome back,
				<span
					class="bg-linear-to-r from-[oklch(var(--color-teal))] to-[oklch(var(--color-blue))] bg-clip-text text-transparent"
					>{data.user.name}</span
				>!
			</h1>
			<p class="text-lg leading-relaxed text-muted-foreground">
				Your second brain is ready to help you stay organized and mindful.
			</p>
		</div>

		<!-- Quick Stats Row -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				label="Journal Entries"
				value={data.stats.journalThisWeek}
				icon={Book}
				color="blue"
				trend="this week"
				trendDirection={data.stats.journalThisWeek > data.stats.journalLastWeek
					? 'up'
					: data.stats.journalThisWeek < data.stats.journalLastWeek
						? 'down'
						: 'neutral'}
			/>
			<StatCard
				label="Workouts Completed"
				value={data.stats.workoutsThisWeek}
				icon={Dumbbell}
				color="green"
				trend="this week"
				trendDirection={data.stats.workoutsThisWeek > data.stats.workoutsLastWeek
					? 'up'
					: data.stats.workoutsThisWeek < data.stats.workoutsLastWeek
						? 'down'
						: 'neutral'}
			/>
			<StatCard
				label="Meditation Sessions"
				value={data.stats.meditationThisWeek}
				icon={Heart}
				color="purple"
				trend="this week"
				trendDirection={data.stats.meditationThisWeek > data.stats.meditationLastWeek
					? 'up'
					: data.stats.meditationThisWeek < data.stats.meditationLastWeek
						? 'down'
						: 'neutral'}
			/>
		</div>

		<!-- Feature Navigation Grid -->
		<ContentSection title="Explore Features" padding="none">
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature (feature.title)}
					{@const color = featureColors[feature.title as keyof typeof featureColors] || 'teal'}
					<FeatureCard
						title={feature.title}
						description={feature.description}
						icon={feature.icon}
						{color}
						href={feature.url}
						ctaText="Open"
					/>
				{/each}
			</div>
		</ContentSection>

		<!-- Weekly Activity Chart -->
		{#if chartData.length > 0}
			<ContentSection title="Weekly Activity" padding="default">
				<Chart.Container config={chartConfig}>
					<LineChart
						points={{ r: 4 }}
						data={chartData}
						x="date"
						xScale={scaleTime()}
						axis="x"
						series={[
							{
								key: 'total',
								label: 'Total Activity',
								color: chartConfig.total.color
							}
						]}
						props={{
							spline: { strokeWidth: 2 },
							highlight: {
								points: {
									r: 6
								}
							},
							xAxis: {
								format: (v: Date) => v.toLocaleDateString('en-US', { weekday: 'short' })
							}
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip
								labelFormatter={(v: Date) =>
									v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
								indicator="line"
							/>
						{/snippet}
					</LineChart>
				</Chart.Container>
			</ContentSection>
		{/if}

		<!-- Recent Activity Section -->
		<ContentSection title="Recent Activity" padding="default">
			<Accordion.Root type="single" class="w-full">
				<!-- Recent Journal Entries -->
				<Accordion.Item value="journal">
					<Accordion.Trigger class="hover:no-underline">
						<div class="flex items-center gap-2">
							<Book class="size-4 text-[oklch(var(--color-blue))]" />
							<span class="font-display font-semibold">Journal Entries</span>
							<Badge
								variant="secondary"
								class="text-[oklch(var(--color-blue))] bg-[oklch(var(--color-blue)/0.1)] ring-1 ring-[oklch(var(--color-blue)/0.3)]"
								>{data.recentJournalEntries.length}</Badge
							>
						</div>
					</Accordion.Trigger>
					<Accordion.Content>
						<ScrollArea.Root class="h-48 space-y-3">
							{#if data.recentJournalEntries.length === 0}
								<p class="text-sm text-muted-foreground">No recent journal entries</p>
							{:else}
								{#each data.recentJournalEntries as entry (entry.id)}
									<a
										href="/journal/{entry.id}"
										class="block rounded-md border-l-4 border-[oklch(var(--color-blue))] bg-[oklch(var(--color-blue)/0.05)] p-3 transition-colors hover:bg-[oklch(var(--color-blue)/0.1)] dark:bg-[oklch(var(--color-blue)/0.1)]"
									>
										<div class="flex items-start justify-between gap-2">
											<div class="flex-1 space-y-1">
												<p class="text-sm leading-relaxed font-medium">
													{createMarkdownExcerpt(entry.content, 80)}
												</p>
												<p class="text-xs text-muted-foreground">
													{formatTimestampShort(entry.createdAt)}
												</p>
											</div>
										</div>
									</a>
								{/each}
							{/if}
							<ScrollArea.Scrollbar orientation="vertical"></ScrollArea.Scrollbar>
						</ScrollArea.Root>
					</Accordion.Content>
				</Accordion.Item>

				<!-- Recent Workouts -->
				<Accordion.Item value="workouts">
					<Accordion.Trigger class="hover:no-underline">
						<div class="flex items-center gap-2">
							<Dumbbell class="size-4 text-[oklch(var(--color-green))]" />
							<span class="font-display font-semibold">Workouts</span>
							<Badge
								variant="secondary"
								class="text-[oklch(var(--color-green))] bg-[oklch(var(--color-green)/0.1)] ring-1 ring-[oklch(var(--color-green)/0.3)]"
								>{data.recentWorkouts.length}</Badge
							>
						</div>
					</Accordion.Trigger>
					<Accordion.Content>
						<ScrollArea.Root class="h-48 space-y-3">
							{#if data.recentWorkouts.length === 0}
								<p class="text-sm text-muted-foreground">No recent workouts</p>
							{:else}
								{#each data.recentWorkouts as workout (workout.id)}
									<a
										href="/fitness"
										class="block rounded-md border-l-4 border-[oklch(var(--color-green))] bg-[oklch(var(--color-green)/0.05)] p-3 transition-colors hover:bg-[oklch(var(--color-green)/0.1)] dark:bg-[oklch(var(--color-green)/0.1)]"
									>
										<div class="flex items-start justify-between gap-2">
											<div class="flex-1 space-y-1">
												<p class="text-sm font-medium capitalize">{workout.type} Workout</p>
												<div class="flex items-center gap-2">
													{#if workout.durationMinutes}
														<span class="text-xs text-muted-foreground"
															>{workout.durationMinutes}
															min</span
														>
														<span class="text-xs text-muted-foreground">•</span>
													{/if}
													<span class="text-xs text-muted-foreground">
														{formatDateMedium(workout.date)}
														{#if workout.time}
															@ {formatTime12Hour(workout.time)}
														{/if}
													</span>
												</div>
											</div>
										</div>
									</a>
								{/each}
							{/if}
							<ScrollArea.Scrollbar orientation="vertical"></ScrollArea.Scrollbar>
						</ScrollArea.Root>
					</Accordion.Content>
				</Accordion.Item>

				<!-- Recent Meditation Sessions -->
				<Accordion.Item value="meditation">
					<Accordion.Trigger class="hover:no-underline">
						<div class="flex items-center gap-2">
							<Heart class="size-4 text-[oklch(var(--color-purple))]" />
							<span class="font-display font-semibold">Meditation</span>
							<Badge
								variant="secondary"
								class="text-[oklch(var(--color-purple))] bg-[oklch(var(--color-purple)/0.1)] ring-1 ring-[oklch(var(--color-purple)/0.3)]"
								>{data.recentMeditations.length}</Badge
							>
						</div>
					</Accordion.Trigger>
					<Accordion.Content>
						<ScrollArea.Root class="h-48 space-y-3">
							{#if data.recentMeditations.length === 0}
								<p class="text-sm text-muted-foreground">No recent meditation sessions</p>
							{:else}
								{#each data.recentMeditations as session (session.id)}
									<a
										href="/meditation"
										class="block rounded-md border-l-4 border-[oklch(var(--color-purple))] bg-[oklch(var(--color-purple)/0.05)] p-3 transition-colors hover:bg-[oklch(var(--color-purple)/0.1)] dark:bg-[oklch(var(--color-purple)/0.1)]"
									>
										<div class="flex items-start justify-between gap-2">
											<div class="flex-1 space-y-1">
												<p class="text-sm font-medium">{session.routine?.title || 'Meditation'}</p>
												<div class="flex items-center gap-2">
													<span class="text-xs text-muted-foreground"
														>{session.routine?.durationMinutes}
														min</span
													>
													<span class="text-xs text-muted-foreground">•</span>
													<span class="text-xs text-muted-foreground">
														{formatTimestampMedium(session.completedAt)}
													</span>
												</div>
											</div>
										</div>
									</a>
								{/each}
							{/if}
							<ScrollArea.Scrollbar orientation="vertical" />
						</ScrollArea.Root>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</ContentSection>
	</div>
{/if}
